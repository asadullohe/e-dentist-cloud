// Fayl saqlagich. Garage S3 bilan mos, shuning uchun standart S3 mijozi
// ishlatiladi — provayder almashsa faqat endpoint va kalitlar oʻzgaradi
// (tz.md 13-boʻlim: joylashtirish koʻchma boʻlishi shart). MinIO dan
// Garage ga oʻtish aynan shunday boʻldi (reja 8-bosqich).

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

/// Rasm ochiq URL orqali berilmaydi. Imzolangan havola ham ishlatilmaydi:
/// u serverda `garage:3900` manziliga koʻrsatadi va brauzerga koʻrinmaydi.
/// Har rasm API orqali, sessiya tekshiruvi bilan beriladi (6.5)

export interface StorageConfig {
  endpoint: string
  /// Garage da imzo regioni sozlamadagi `s3_region` ga teng boʻlishi shart
  region: string
  accessKey: string
  secretKey: string
  bucket: string
}

export interface Storage {
  /// Bucket yoʻq boʻlsa yaratadi. Server koʻtarilganda bir marta
  ensureBucket(): Promise<void>
  put(key: string, body: Buffer, contentType: string): Promise<void>
  /// Faylni serverning oʻzi oʻqiydi. Logotip shu yoʻl bilan beriladi:
  /// imzolangan havola ombor manziliga koʻrsatadi, u esa serverda Docker
  /// tarmogʻi ichida va brauzerga koʻrinmaydi
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>
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
    region: config.region,
    credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    // Yoʻlga asoslangan manzil: endpoint/bucket/key — subdomen kerak emas
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
          // tomonga ombor 409 qaytaradi — bucket bor, demak ish allaqachon
          // bajarilgan, xato emas
          if (!bucketExists(error)) throw error
        }
      }
    },

    async get(key) {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }))
        const bytes = await result.Body?.transformToByteArray()
        if (!bytes) return null
        return {
          body: Buffer.from(bytes),
          contentType: result.ContentType ?? 'application/octet-stream',
        }
      } catch {
        // Fayl yoʻq yoki oʻchirilgan — chaqiruvchi 404 qaytaradi
        return null
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
