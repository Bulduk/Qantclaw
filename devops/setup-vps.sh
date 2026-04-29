#!/bin/bash
# AUREON DevOps - VPS Configuration Script
# IMPORTANT: Run as root

echo "[*] Starting AUREON VPS Configuration..."

# 1. Update and Upgrade
apt-get update && apt-get upgrade -y

# 2. Install Dependencies
apt-get install -y ufw fail2ban curl wget git htop prometheus prometheus-node-exporter nginx

# 3. Secure SSH (Key-Only)
echo "[*] Securing SSH..."
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin prohibit-password/g' /etc/ssh/sshd_config
systemctl restart sshd

# 4. Configure UFW (Firewall)
echo "[*] Configuring UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp       # SSH
ufw allow 8787/tcp     # Custom Port
ufw allow 18789/tcp    # Custom Port
ufw allow 3000/tcp     # Admin Panel UI
ufw allow 80/tcp       # HTTP (if required for certs)
ufw allow 443/tcp      # HTTPS
ufw --force enable

# 5. Configure Fail2Ban
echo "[*] Configuring Fail2Ban..."
cat <<EOT > /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOT
systemctl restart fail2ban
systemctl enable fail2ban

echo "[*] VPS Configuration Completed Successfully."
echo "Please set up PM2 and Systemd services next."
