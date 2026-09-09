# API konteyneri.
#
# Kod TypeScript da qoladi va `tsx` bilan ishga tushadi — lokalda ham
# shunday. Qurish bosqichi qoʻshilsa ikkita muhit ikki xil kodni
# bajarardi va farq faqat serverda bilinardi.

FROM node:22-alpine AS deps
WORKDIR /app

# Avval faqat manifestlar: kod oʻzgarganda npm ci qayta ishlamasin
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/teeth/package.json packages/teeth/
COPY packages/ui/package.json packages/ui/
# postinstall `prisma generate` ni chaqiradi, unga sxema kerak
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/

# `prisma generate` konfiguratsiyani oʻqiydi va DATABASE_URL ni talab
# qiladi, lekin bazaga ulanmaydi. Qurish paytidagi soxta qiymat —
# ishlaydigan manzil compose dan keladi
ENV DATABASE_URL=postgresql://qurish@localhost:5432/qurish
RUN npm ci --omit=dev --workspace @e-dentist/api --include-workspace-root

FROM node:22-alpine AS runtime
WORKDIR /app

# Konteyner UTC da ishlaydi — sanalar besh soatga surilib ketmasin
ENV TZ=Asia/Tashkent
ENV NODE_ENV=production

# npm workspaces bogʻliqliklarni ildizga yigʻadi; generated/ esa
# `prisma generate` yasagan mijoz
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/generated ./apps/api/generated
COPY package.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# root dan ishlamaydi: konteyner ichidagi xato butun mashinaga
# tarqalmasin (node tasviridagi tayyor foydalanuvchi)
USER node

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
