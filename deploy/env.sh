# `.env` ni oʻqish. Uchala zaxira skripti shu yerdan foydalanadi.
#
# Nega alohida: `. ./.env` bash sintaksisini talab qiladi, `.env` esa unga
# boʻysunmaydi. `SMTP_FROM=E-Dentist <bot@e-dentist.uz>` da `<` — bash uchun
# fayldan oʻqish belgisi: sourcing oʻsha qatorda sintaksis xatosi bilan
# **toʻxtaydi** va undan keyingi hamma oʻzgaruvchi yoʻqoladi. Jimgina —
# skript ishlayotgandek koʻrinadi, lekin qiymatlar boʻsh boʻladi.
#
# Shuning uchun qatorlar qoʻlda ajratiladi: `=` gacha — nom, keyin — qiymat.

load_env() {
  local file="${1:-.env}" line key value
  [[ -f "$file" ]] || { echo "Fayl yoʻq: $file" >&2; return 1; }

  while IFS= read -r line || [[ -n "$line" ]]; do
    # izoh va boʻsh qatorlar
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    # `=` boʻlmasa — bu sozlama emas
    [[ "$line" == *=* ]] || continue

    key="${line%%=*}"
    value="${line#*=}"
    # faqat haqiqiy nom: HARF_RAQAM
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    # qiymatni oʻrab turgan tirnoqlar olib tashlanadi
    if [[ "$value" == \"*\" || "$value" == \'*\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    export "$key=$value"
  done < "$file"
}
