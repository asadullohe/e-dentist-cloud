# Garage sozlash konteyneri. Rasmiy rasm `scratch` — ichida shell yoʻq,
# init.sh esa ketma-ket buyruqlar va kutish sikllari talab qiladi.
# Shuning uchun binar alpine ga koʻchiriladi
FROM dxflrs/garage:v2.4.1 AS garage

FROM alpine:3.21
COPY --from=garage /garage /usr/local/bin/garage
COPY init.sh /init.sh
ENTRYPOINT ["/bin/sh", "/init.sh"]
