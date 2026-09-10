// Fayl saqlagich. MinIO S3 bilan mos, shuning uchun standart S3 mijozi
// ishlatiladi — provayder almashsa faqat endpoint oʻzgaradi (tz.md 13-boʻlim:
// joylashtirish koʻchma boʻlishi shart).

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/// Bemor rasmlari ochiq URL orqali berilmaydi — faqat qisqa muddatli
/// imzolangan havola (tz.md 12-boʻlim)
const SIGNED_URL_TTL = 5 * 60

export interface StorageConfig {
  endpoint: string
  accessKey: string
  secretKey: string
  bucket: string
}

export interface Storage {
  /// Bucket yoʻq boʻlsa yaratadi. Server koʻtarilganda bir marta
  ensureBucket(): Promise<void>
  put(key: string, body: Buffer, contentType: string): Promise<void>
  /// Qisqa muddatli havola
  signedUrl(key: string): Promise<string>
  remove(key: string): Promise<void>
}

/// S3 ning «bucket allaqachon bor» javoblari. Nomlar SDK dan keladi
function bucketExists(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name
  return name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists'
}

export function createStorage(config: StorageConfig): Storage {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    // MinIO yoʻlga asoslangan manzillarni kutadi: endpoint/bucket/key
    forcePathStyle: true,
  })

  return {
    async ensureBucket() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: config.bucket }))
      } catch {
        try {
          await client.send(new CreateBucketCommand({ Bucket: config.bucket }))
        } catch (error) {
          // Poyga: ikki jarayon bir vaqtda koʻtarilsa (CI da test fayllari
          // parallel yuradi) ikkalasi ham bucket yoʻq deb topadi. Yutqazgan
          // tomonga MinIO 409 qaytaradi — bucket bor, demak ish allaqachon
          // bajarilgan, xato emas
          if (!bucketExists(error)) throw error
        }
      }
    },

    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      )
    },

    signedUrl(key) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: key }), {
        expiresIn: SIGNED_URL_TTL,
      })
    },

    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
    },
  }
}

/// Obyekt nomi klinika boʻyicha ajratiladi: saqlagichga qaraganda ham
/// qaysi fayl kimniki ekani koʻrinib turadi
export function imageKey(clinicId: string, patientId: string, id: string, ext: string): string {
  return `clinics/${clinicId}/patients/${patientId}/${id}.${ext}`
}
