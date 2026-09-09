#!/usr/bin/env bash
# Yangi Ubuntu 24.04 serverini ishga tayyorlash.
#
# Nima qiladi:
#   1. `edentist` foydalanuvchisini yaratadi (sudo bilan)
#   2. root bilan kirishni va parol bilan kirishni yopadi
#   3. ufw: faqat SSH, 80 va 443 ochiq qoladi
#   4. fail2ban: SSH ga parol tanlashga urinishlarni bloklaydi
#   5. Xavfsizlik yangilanishlarini avtomatik qiladi
#   6. Docker va Docker Compose oʻrnatadi
#   7. Swap qoʻshadi (4 GB xotirali serverda qurish paytida asqotadi)
#
# Ishlatish (server ichida, root bilan):
#   bash server-setup.sh
#
# Skript idempotent: ikki marta ishlatilsa ham zarar qilmaydi.

set -euo pipefail

USERNAME="${SETUP_USER:-edentist}"

if [[ $EUID -ne 0 ]]; then
  echo "Bu skript root bilan ishlaydi: sudo bash server-setup.sh" >&2
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────
# Eng muhim tekshiruv: SSH kaliti boʻlmasa parol bilan kirishni yopib
# boʻlmaydi — aks holda serverga umuman kira olmay qolasiz
# ─────────────────────────────────────────────────────────────────────────
ROOT_KEYS="/root/.ssh/authorized_keys"
if [[ ! -s "$ROOT_KEYS" ]]; then
  cat >&2 <<'MSG'
XATO: /root/.ssh/authorized_keys boʻsh.

Demak serverga SSH kaliti bilan emas, parol bilan kirilgan. Parolni
yopsak, siz ham kira olmay qolasiz.

Avval oʻz kompyuteringizda kalit yasang va serverga qoʻshing:

  ssh-keygen -t ed25519 -C "e-dentist"
  ssh-copy-id root@<SERVER_IP>

Keyin shu skriptni qaytadan ishga tushiring.
MSG
  exit 1
fi

echo "──> Vaqt zonasi"
timedatectl set-timezone Asia/Tashkent

echo "──> Paketlar"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg ufw fail2ban unattended-upgrades

echo "──> Foydalanuvchi: $USERNAME"
if ! id -u "$USERNAME" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$USERNAME"
fi

# `sudo` guruhi parol soʻraydi, parolsiz foydalanuvchi esa uni hech qachon
# kiritolmaydi — sudo butunlay ishlamay qoladi.
#
# Terminal boʻlsa parolni shu yerda soʻraymiz. Boʻlmasa (ssh buyruq
# rejimi) parolsiz sudo yoqiladi: buzuq sudo bilan qoldirish xavfsizroq
# emas — u odamni root parolini tiklashga va konsolga majbur qiladi,
# oxiri baribir shu yerga keladi
PASSWORD_SET=1
if ! passwd -S "$USERNAME" 2>/dev/null | awk '{exit $2 == "P" ? 0 : 1}'; then
  if [[ -t 0 ]]; then
    echo "    sudo uchun parol qoʻying (SSH ga parol bilan kirish yopiq):"
    passwd "$USERNAME"
  else
    PASSWORD_SET=0
    echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$USERNAME"
    chmod 440 "/etc/sudoers.d/$USERNAME"
  fi
fi
usermod -aG sudo "$USERNAME"
install -d -m 700 -o "$USERNAME" -g "$USERNAME" "/home/$USERNAME/.ssh"
install -m 600 -o "$USERNAME" -g "$USERNAME" "$ROOT_KEYS" "/home/$USERNAME/.ssh/authorized_keys"

echo "──> SSH: root va parol bilan kirish yopiladi"
cat > /etc/ssh/sshd_config.d/99-e-dentist.conf <<'SSHD'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
SSHD
sshd -t
systemctl reload ssh

echo "──> Firewall"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp comment 'HTTP/3'
ufw --force enable

echo "──> fail2ban"
cat > /etc/fail2ban/jail.local <<'JAIL'
[sshd]
enabled = true
# Besh marta notoʻgʻri urinishdan keyin bir soatga bloklanadi
maxretry = 5
findtime = 10m
bantime = 1h
JAIL
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "──> Avtomatik xavfsizlik yangilanishlari"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "──> Swap (2 GB)"
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "──> Docker"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
usermod -aG docker "$USERNAME"
systemctl enable --now docker

echo "──> Loyiha papkasi"
install -d -o "$USERNAME" -g "$USERNAME" /opt/e-dentist

cat <<MSG

Tayyor.

Endi yangi terminalda shu foydalanuvchi bilan kiring:

  ssh $USERNAME@<SERVER_IP>

Tekshirib koʻring:
  docker --version
  docker compose version
  sudo ufw status
  sudo fail2ban-client status sshd

DIQQAT: shu oynani yopmang, avval yangi ulanish ishlashiga ishonch hosil
qiling. Ishlamasa — Hetzner konsolidan (Console) kirib tuzatish mumkin.
MSG

if [[ "$PASSWORD_SET" -eq 0 ]]; then
  cat <<'MSG'

╭──────────────────────────────────────────────────────────────╮
│ SUDO PAROLSIZ ISHLAYDI                                       │
│                                                              │
│ Skript terminalsiz ishga tushdi, parol soʻray olmadi —       │
│ shuning uchun `sudo` parolsiz qilib qoʻyildi. Serverga       │
│ faqat SSH kaliti bilan kiriladi, lekin kalit oʻgʻirlansa     │
│ hujumchi darhol root boʻla oladi.                            │
│                                                              │
│ Qatʼiyroq variantga oʻtish (tavsiya etiladi):                │
│                                                              │
│     passwd edentist                                          │
│     rm /etc/sudoers.d/edentist                               │
│                                                              │
│ Shundan keyin sudo har safar parol soʻraydi.                 │
╰──────────────────────────────────────────────────────────────╯
MSG
fi
