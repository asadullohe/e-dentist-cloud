# Landing, kabinet va boshqaruv paneli — statik fayllar, Caddy ularni
# tarqatadi.
#
# Uchalasi bitta tasvirda: ular bitta repozitoriyadan chiqadi va birga
# yangilanadi, alohida konteyner qilishning maʼnosi yoʻq. Landing da
# qurish bosqichi yoʻq — fayllar shundayligicha koʻchiriladi.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/cabinet/package.json apps/cabinet/
COPY apps/admin/package.json apps/admin/
COPY packages/shared/package.json packages/shared/
COPY packages/teeth/package.json packages/teeth/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/

# Qurish uchun dev bogʻliqliklar ham kerak (vite, tailwind)
RUN npm ci --ignore-scripts

COPY packages ./packages
COPY apps/cabinet ./apps/cabinet
COPY apps/admin ./apps/admin
COPY tsconfig.base.json ./
# Ilovalarning tsconfig i ildizdagi bazadan meros oladi. Ildizdagi
# tsconfig.json koʻchirilmaydi: u faqat muharrir uchun va API ga
# havola qiladi, API esa bu tasvirda yoʻq

RUN npm run build -w @e-dentist/cabinet && npm run build -w @e-dentist/admin

FROM caddy:2-alpine AS runtime
COPY --from=build /app/apps/cabinet/dist /srv/kabinet
COPY --from=build /app/apps/admin/dist /srv/admin
COPY apps/landing /srv/landing
COPY deploy/Caddyfile /etc/caddy/Caddyfile
