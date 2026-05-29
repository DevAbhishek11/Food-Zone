# FoodZone — Production Deployment Guide

> Complete, copy-paste-ready guide to take FoodZone from your dev box to a live production environment. Covers all three codebases (Laravel API, Next.js web, Expo mobile) plus every supporting service (Redis, Meilisearch, Reverb, queue workers, scheduler, SSL, backups, monitoring, CI/CD).
>
> **Target environment:** Ubuntu 24.04 LTS VPS · PHP 8.5 · MySQL 8 · Redis 7 · Meilisearch 1.10 · Node 22 · Nginx · Supervisor · Let's Encrypt.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Cost estimate & hosting options](#2-cost-estimate--hosting-options)
3. [Pre-deployment checklist](#3-pre-deployment-checklist)
4. [Domain + DNS setup](#4-domain--dns-setup)
5. [Server provisioning](#5-server-provisioning)
6. [Initial server hardening](#6-initial-server-hardening)
7. [Install system dependencies](#7-install-system-dependencies)
8. [Database setup (MySQL)](#8-database-setup-mysql)
9. [Redis setup](#9-redis-setup)
10. [Meilisearch setup](#10-meilisearch-setup)
11. [Deploy the Laravel API (FoodZoneServer)](#11-deploy-the-laravel-api-foodzoneserver)
12. [Nginx for the API](#12-nginx-for-the-api)
13. [HTTPS with Let's Encrypt](#13-https-with-lets-encrypt)
14. [Queue workers via Supervisor](#14-queue-workers-via-supervisor)
15. [Reverb (WebSockets) via Supervisor](#15-reverb-websockets-via-supervisor)
16. [Scheduler (cron)](#16-scheduler-cron)
17. [Storage & media uploads](#17-storage--media-uploads)
18. [Deploy the Next.js web (foodzoneweb)](#18-deploy-the-nextjs-web-foodzoneweb)
19. [Build & publish the Expo mobile app (FoodZoneApp)](#19-build--publish-the-expo-mobile-app-foodzoneapp)
20. [Push notifications (Expo)](#20-push-notifications-expo)
21. [Payment gateway setup](#21-payment-gateway-setup)
22. [Backups (DB + media)](#22-backups-db--media)
23. [Monitoring, logs, error tracking](#23-monitoring-logs-error-tracking)
24. [CI/CD with GitHub Actions](#24-cicd-with-github-actions)
25. [Zero-downtime deploys](#25-zero-downtime-deploys)
26. [Health checks & smoke tests](#26-health-checks--smoke-tests)
27. [Troubleshooting cheatsheet](#27-troubleshooting-cheatsheet)
28. [Scaling checklist](#28-scaling-checklist)
29. [Cost-optimised single-box layout](#29-cost-optimised-single-box-layout)
30. [Rollback procedure](#30-rollback-procedure)

---

## 1. Architecture overview

```
                           ┌───────────────────┐
                           │   Cloudflare DNS  │
                           │   + SSL proxy     │
                           └──────────┬────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────────┐  ┌─────────────────────┐  ┌────────────────────────┐
│  api.foodzone.app     │  │  www.foodzone.app   │  │  Expo OTA / App stores │
│  Laravel 13 + PHP-FPM │  │  Next.js 16         │  │  Mobile (iOS+Android)  │
│  (FoodZoneServer)     │  │  (foodzoneweb)      │  │  (FoodZoneApp)         │
└──────────┬────────────┘  └──────────┬──────────┘  └───────────┬────────────┘
           │                          │                          │
           │ ◄────── HTTPS API calls ──┴─────────────────────────┘
           │
           ├──► MySQL 8        (orders, posts, users, …)
           ├──► Redis 7        (cache, queues, sessions, broadcast)
           ├──► Meilisearch    (search index: vendors, items, users, posts)
           ├──► Reverb         (WebSocket :8080 for real-time)
           ├──► Queue workers  (push, ratings, broadcasts, exports)
           ├──► Scheduler      (cron tick every minute)
           └──► /storage       (uploaded media: avatars, posts, banners)
```

**Single-VPS layout** (cheap start): all services on one 4 GB / 2 vCPU box.
**Production layout** (scale): split MySQL → managed DB, Redis → managed cache, app → 2+ web servers behind a load balancer, media → S3/R2 + CDN.

---

## 2. Cost estimate & hosting options

| Tier | Setup | Monthly | Good for |
|---|---|---|---|
| **Minimum** | 1× Hetzner CX22 (€4) — everything on one box | ~$5 | Learning, MVP, < 100 daily users |
| **Recommended** | DigitalOcean Droplet (2 vCPU, 4 GB, $24) + Vercel (free for web) | ~$24 | Real launch, < 5k daily users |
| **Managed** | Laravel Forge ($12) + DO Droplet ($24) + managed MySQL ($15) | ~$50 | Hands-off ops |
| **Scale** | 2× app servers + RDS MySQL + ElastiCache Redis + Cloudflare R2 + ALB | $200+ | 10k+ daily users |

**This guide assumes the recommended tier.** Everything works on the minimum tier too — just merge all services onto one VPS.

---

## 3. Pre-deployment checklist

Before you touch a server, confirm:

- [ ] Code is on a **`main`** branch in GitHub (or GitLab).
- [ ] `php artisan test` passes locally — currently **212 tests**.
- [ ] `cd foodzoneweb && npm run build && npm run lint` clean.
- [ ] `cd FoodZoneApp && npx tsc --noEmit && npx expo lint` clean.
- [ ] You own the domain (`foodzone.app` or similar).
- [ ] You have a credit card on file with your VPS provider.
- [ ] You have an SSH key on your dev machine (`~/.ssh/id_ed25519.pub`). Generate with `ssh-keygen -t ed25519 -C "you@example.com"`.
- [ ] You picked secrets for: `APP_KEY`, `DB_PASSWORD`, `REDIS_PASSWORD`, `MEILISEARCH_KEY`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`. (We'll generate them shortly.)
- [ ] You have an Expo account if shipping mobile.
- [ ] You have Apple Developer ($99/yr) + Google Play Console ($25 one-time) accounts if shipping to stores.

---

## 4. Domain + DNS setup

1. **Buy a domain** at Namecheap / Porkbun / Cloudflare Registrar (~$10/yr).
2. **Point nameservers to Cloudflare** (free tier).
3. In the Cloudflare DNS panel, add records (replace `1.2.3.4` with your droplet IP — you'll get it in step 5):

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | A | `@` | `1.2.3.4` | ✅ Proxied |
   | A | `www` | `1.2.3.4` | ✅ Proxied |
   | A | `api` | `1.2.3.4` | ✅ Proxied |
   | A | `ws` | `1.2.3.4` | ❌ DNS only (WebSocket — Cloudflare's free tier supports WS only on proxied, but we keep direct for simplicity) |

   *Note*: If you proxy `ws.foodzone.app` through Cloudflare, you must use port 443 (Cloudflare doesn't proxy arbitrary ports). Either A) terminate WS via the same Nginx server using `/app` path, or B) use `ws.foodzone.app:443` and have Nginx reverse-proxy to Reverb on `127.0.0.1:8080`.

4. **TLS mode** in Cloudflare → SSL/TLS → **Full (strict)**.
5. **Always Use HTTPS** → On.

---

## 5. Server provisioning

### 5.1 DigitalOcean (example)

```bash
# Via the DO control panel:
# - Choose Ubuntu 24.04 LTS
# - 2 vCPU, 4 GB RAM, 80 GB SSD ($24/mo)
# - Region nearest your users (BLR1 for India, SFO3 for US west, etc.)
# - Add your SSH key (paste contents of ~/.ssh/id_ed25519.pub)
# - Hostname: foodzone-prod
```

After ~60 seconds you have an IP. Test the connection:

```bash
ssh root@1.2.3.4
```

### 5.2 Alternatives

- **Hetzner** — cheaper, EU/US datacenters, identical Ubuntu image.
- **Vultr** / **Linode** — same workflow.
- **AWS EC2 / GCP Compute** — overkill for the cost; use only if you need their managed services.

---

## 6. Initial server hardening

Run these as `root` immediately after the first SSH:

```bash
# 6.1 Update everything
apt update && apt -y upgrade
apt -y install ufw fail2ban unattended-upgrades

# 6.2 Create a non-root deploy user
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# 6.3 Lock down SSH
sed -i 's/^#PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# 6.4 Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp     # Reverb (only if not behind nginx)
ufw --force enable

# 6.5 Automatic security patches
dpkg-reconfigure -plow unattended-upgrades

# 6.6 Fail2ban (already installed). Default config bans 5-failures-in-10-min for 10 min.
systemctl enable --now fail2ban

# 6.7 Disconnect and reconnect as deploy
exit
ssh deploy@1.2.3.4
```

From this point on, you're logged in as `deploy`. Use `sudo` when needed.

---

## 7. Install system dependencies

```bash
# 7.1 Add PHP 8.5 PPA (Ondrej)
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update

# 7.2 PHP 8.5 + extensions Laravel needs
sudo apt -y install \
  php8.5-fpm php8.5-cli \
  php8.5-mysql php8.5-redis \
  php8.5-mbstring php8.5-xml php8.5-bcmath \
  php8.5-curl php8.5-zip php8.5-gd \
  php8.5-intl php8.5-soap \
  php8.5-readline php8.5-opcache

# 7.3 Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# 7.4 Node 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
npm i -g pm2

# 7.5 Nginx
sudo apt -y install nginx
sudo systemctl enable nginx

# 7.6 Supervisor (for queue workers + Reverb)
sudo apt -y install supervisor
sudo systemctl enable supervisor

# 7.7 Certbot (Let's Encrypt)
sudo apt -y install certbot python3-certbot-nginx

# 7.8 Git + utilities
sudo apt -y install git curl htop iotop ncdu jq
```

**Verify versions:**

```bash
php -v       # PHP 8.5.x
composer -V  # Composer 2.x
node -v      # v22.x
nginx -v     # 1.24+
```

---

## 8. Database setup (MySQL)

```bash
# 8.1 Install MySQL 8
sudo apt -y install mysql-server
sudo mysql_secure_installation
# Answer:
#   - Password validation: y, level 2 (STRONG)
#   - Set root password: <use a strong one and save it>
#   - Remove anonymous users: y
#   - Disallow remote root login: y
#   - Remove test database: y
#   - Reload privileges: y

# 8.2 Create the app database + user
sudo mysql -u root -p <<'SQL'
CREATE DATABASE foodzone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'foodzone'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON foodzone.* TO 'foodzone'@'localhost';
FLUSH PRIVILEGES;
SQL

# 8.3 Tune InnoDB (4 GB box guidance — adjust if more RAM)
sudo tee /etc/mysql/mysql.conf.d/foodzone.cnf <<'EOF'
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
max_connections = 200
EOF
sudo systemctl restart mysql
```

> **Verify schema portability later.** Your tests run on SQLite; production runs on MySQL. After deploy, run `php artisan migrate:status` to confirm every migration applies cleanly.

---

## 9. Redis setup

```bash
# 9.1 Install
sudo apt -y install redis-server

# 9.2 Bind to localhost + set password + persistence
sudo tee /etc/redis/redis.conf.d/foodzone.conf <<'EOF'
bind 127.0.0.1
requirepass CHANGE_ME_REDIS_PASSWORD
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
EOF

# Some distros store config in /etc/redis/redis.conf — append there if no .d directory:
# sudo nano /etc/redis/redis.conf  →  add the same lines

sudo systemctl restart redis-server
sudo systemctl enable redis-server

# 9.3 Verify
redis-cli -a CHANGE_ME_REDIS_PASSWORD ping  # → PONG
```

---

## 10. Meilisearch setup

```bash
# 10.1 Download the binary
curl -L https://install.meilisearch.com | sh
sudo mv ./meilisearch /usr/local/bin/

# 10.2 Create a dedicated user + data dir
sudo useradd -r -s /bin/false meilisearch
sudo mkdir -p /var/lib/meilisearch /var/log/meilisearch
sudo chown -R meilisearch: /var/lib/meilisearch /var/log/meilisearch

# 10.3 Systemd unit
sudo tee /etc/systemd/system/meilisearch.service <<'EOF'
[Unit]
Description=Meilisearch
After=network.target

[Service]
User=meilisearch
Group=meilisearch
ExecStart=/usr/local/bin/meilisearch \
  --db-path /var/lib/meilisearch/data.ms \
  --env production \
  --http-addr 127.0.0.1:7700 \
  --master-key CHANGE_ME_MEILI_MASTER_KEY
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now meilisearch

# 10.4 Verify
curl -H "Authorization: Bearer CHANGE_ME_MEILI_MASTER_KEY" http://127.0.0.1:7700/health
# → {"status":"available"}
```

---

## 11. Deploy the Laravel API (FoodZoneServer)

### 11.1 Pull the code

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www
git clone https://github.com/YOUR_USERNAME/foodzone.git foodzone
cd foodzone/FoodZoneServer
```

> If your three codebases are separate repos, `git clone` each into `/var/www/`.

### 11.2 Install dependencies

```bash
composer install --no-dev --optimize-autoloader --prefer-dist
```

### 11.3 Create `.env`

```bash
cp .env.example .env
nano .env
```

Set these values (replace placeholders):

```ini
APP_NAME=FoodZone
APP_ENV=production
APP_KEY=                           # Will be generated next
APP_DEBUG=false
APP_URL=https://api.foodzone.app
APP_FRONTEND_URL=https://www.foodzone.app

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=foodzone
DB_USERNAME=foodzone
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD
REDIS_PORT=6379

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=foodzone-app
REVERB_APP_KEY=CHANGE_ME_REVERB_KEY
REVERB_APP_SECRET=CHANGE_ME_REVERB_SECRET
REVERB_HOST=ws.foodzone.app
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=CHANGE_ME_MEILI_MASTER_KEY

MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com         # Or Postmark / SES / Mailgun
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=YOUR_RESEND_API_KEY
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@foodzone.app
MAIL_FROM_NAME="FoodZone"

FILESYSTEM_DISK=public            # Or 's3' for cloud storage

PUSH_ENABLED=true                 # Expo push notifications (P23)
EXPO_ACCESS_TOKEN=YOUR_EXPO_TOKEN

# Payment gateway (P19) — pick Razorpay or Stripe
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
```

Generate `APP_KEY`:

```bash
php artisan key:generate --force
```

### 11.4 Run migrations + seed (first deploy only)

```bash
php artisan migrate --force
php artisan db:seed --force        # Seeds admin + sample vendors + badges catalogue
php artisan storage:link           # Symlinks public/storage → storage/app/public
```

### 11.5 Index Meilisearch

```bash
php artisan scout:import "App\Models\Vendor"
php artisan scout:import "App\Models\MenuItem"
php artisan scout:import "App\Models\User"
php artisan scout:import "App\Models\Post"
```

### 11.6 Cache config / routes / views

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

> Re-run these after **every** deploy.

### 11.7 Permissions

```bash
sudo chown -R deploy:www-data /var/www/foodzone/FoodZoneServer
sudo chmod -R 755 /var/www/foodzone/FoodZoneServer
sudo chmod -R 775 /var/www/foodzone/FoodZoneServer/storage /var/www/foodzone/FoodZoneServer/bootstrap/cache
```

---

## 12. Nginx for the API

```bash
sudo tee /etc/nginx/sites-available/foodzone-api <<'EOF'
server {
    listen 80;
    server_name api.foodzone.app;

    root /var/www/foodzone/FoodZoneServer/public;
    index index.php;

    client_max_body_size 50M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    # CSP is set in app middleware; don't override here.

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
        fastcgi_read_timeout 60;
    }

    location ~ /\.(?!well-known).* { deny all; }

    # Block direct access to storage/private
    location ~* /storage/private/ { deny all; }

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;

    access_log /var/log/nginx/foodzone-api.access.log;
    error_log  /var/log/nginx/foodzone-api.error.log;
}
EOF

sudo ln -sf /etc/nginx/sites-available/foodzone-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Test:

```bash
curl http://api.foodzone.app/api/v1/health
# Expect a JSON health response.
```

---

## 13. HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d api.foodzone.app -d ws.foodzone.app --agree-tos -m you@example.com --redirect
# Choose option 2 (redirect HTTP → HTTPS).
```

Certbot installs a renewal cron + edits the nginx config to add `listen 443 ssl;`. Test the renewal:

```bash
sudo certbot renew --dry-run
```

Recheck:

```bash
curl https://api.foodzone.app/api/v1/health
```

---

## 14. Queue workers via Supervisor

```bash
sudo tee /etc/supervisor/conf.d/foodzone-worker.conf <<'EOF'
[program:foodzone-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/foodzone/FoodZoneServer/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/foodzone-worker.log
stopwaitsecs=3600
EOF

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start foodzone-worker:*
sudo supervisorctl status
```

> **Why 2 workers?** Push notifications + rating recalc + broadcast sends can pile up. Two workers handle hundreds of jobs/min on a 4 GB box. Bump `numprocs` to scale.

---

## 15. Reverb (WebSockets) via Supervisor

```bash
sudo tee /etc/supervisor/conf.d/foodzone-reverb.conf <<'EOF'
[program:foodzone-reverb]
command=php /var/www/foodzone/FoodZoneServer/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
user=deploy
redirect_stderr=true
stdout_logfile=/var/log/foodzone-reverb.log
stopwaitsecs=10
EOF

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start foodzone-reverb
```

Then proxy WS traffic through Nginx so clients hit `wss://ws.foodzone.app` on port 443:

```bash
sudo tee /etc/nginx/sites-available/foodzone-reverb <<'EOF'
server {
    listen 80;
    server_name ws.foodzone.app;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/foodzone-reverb /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ws.foodzone.app --redirect
```

Verify the WS handshake:

```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  -H "Sec-WebSocket-Version: 13" \
  https://ws.foodzone.app/app/CHANGE_ME_REVERB_KEY
# Expect: HTTP/1.1 101 Switching Protocols
```

---

## 16. Scheduler (cron)

```bash
crontab -e
```

Add (single line):

```cron
* * * * * cd /var/www/foodzone/FoodZoneServer && php artisan schedule:run >> /var/log/foodzone-schedule.log 2>&1
```

This ticks once per minute. Your `app/Console/Kernel.php` decides what actually runs (cache warming, prune, etc.).

---

## 17. Storage & media uploads

### 17.1 Local disk (simple, cheap, fine for ≤ a few GB)

`storage:link` already created `public/storage → storage/app/public`. Files go in `storage/app/public/{posts,avatars,banners,...}`. Served via Nginx.

Tighten:

```bash
# Make sure www-data can write
sudo chown -R deploy:www-data /var/www/foodzone/FoodZoneServer/storage
sudo chmod -R 775 /var/www/foodzone/FoodZoneServer/storage
```

### 17.2 Cloud disk (when you outgrow local)

In `.env`:

```ini
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=auto
AWS_BUCKET=foodzone-media
AWS_USE_PATH_STYLE_ENDPOINT=false
AWS_URL=https://media.foodzone.app
AWS_ENDPOINT=https://<account>.r2.cloudflarestorage.com    # Cloudflare R2 — zero egress fees
```

Add `aws/aws-sdk-php` if not already in `composer.json`. Cloudflare R2 + Cloudflare CDN in front is the best bang-for-buck — same domain, no egress.

---

## 18. Deploy the Next.js web (foodzoneweb)

You have two good options. Pick one.

### Option A — Vercel (recommended, easiest)

1. Push `foodzoneweb/` to GitHub (or move it to its own repo).
2. Go to **vercel.com** → New Project → Import your repo.
3. Framework preset: **Next.js** (auto-detected).
4. Root directory: `foodzoneweb` (if it's in a monorepo).
5. Environment variables:

   ```ini
   NEXT_PUBLIC_API_URL=https://api.foodzone.app/api/v1
   NEXT_PUBLIC_REVERB_KEY=CHANGE_ME_REVERB_KEY
   NEXT_PUBLIC_REVERB_HOST=ws.foodzone.app
   NEXT_PUBLIC_REVERB_PORT=443
   NEXT_PUBLIC_REVERB_SCHEME=https
   ```

6. Deploy. Add your domain `www.foodzone.app` in Vercel → Domains.
7. Every push to `main` auto-deploys. Every PR gets a preview URL.

### Option B — Self-host on the same VPS (free, more control)

```bash
cd /var/www/foodzone/foodzoneweb
npm ci --omit=dev
npm run build

# Create .env.production.local
cat > .env.production.local <<'EOF'
NEXT_PUBLIC_API_URL=https://api.foodzone.app/api/v1
NEXT_PUBLIC_REVERB_KEY=CHANGE_ME_REVERB_KEY
NEXT_PUBLIC_REVERB_HOST=ws.foodzone.app
NEXT_PUBLIC_REVERB_PORT=443
NEXT_PUBLIC_REVERB_SCHEME=https
EOF

# Run with PM2 (already installed in step 7)
pm2 start npm --name foodzone-web -- start
pm2 save
pm2 startup    # Follow the printed instruction (one sudo command)
```

Nginx vhost for the web app:

```bash
sudo tee /etc/nginx/sites-available/foodzone-web <<'EOF'
server {
    listen 80;
    server_name foodzone.app www.foodzone.app;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/foodzone-web /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d foodzone.app -d www.foodzone.app --redirect
```

---

## 19. Build & publish the Expo mobile app (FoodZoneApp)

### 19.1 Set up EAS

```bash
# On your dev machine
cd FoodZoneApp
npm i -g eas-cli
eas login
eas build:configure
```

### 19.2 Configure environment

In `app.config.ts` (or `app.json`):

```ts
extra: {
  apiUrl: "https://api.foodzone.app/api/v1",
  reverbKey: "CHANGE_ME_REVERB_KEY",
  reverbHost: "ws.foodzone.app",
  reverbPort: 443,
  reverbScheme: "https",
}
```

Set the EAS secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.foodzone.app/api/v1"
```

### 19.3 Production builds

```bash
# iOS — needs Apple Developer ($99/yr)
eas build --platform ios --profile production

# Android — needs Google Play Console ($25 one-time)
eas build --platform android --profile production
```

Each takes ~15–30 minutes. EAS gives you signed `.ipa` and `.aab` files.

### 19.4 Submit to stores

```bash
eas submit -p ios   --profile production
eas submit -p android --profile production
```

App Store review: 1–3 days. Google Play review: hours to 2 days.

### 19.5 OTA updates after launch

```bash
# Push a JS-only update to existing installs (no store review needed)
eas update --branch production --message "Fix order summary"
```

---

## 20. Push notifications (Expo)

Already wired in P23 (`SendPushNotification` job + `push_tokens` table).

1. Create an Expo access token at **expo.dev → Account → Access Tokens**.
2. Set `EXPO_ACCESS_TOKEN` and `PUSH_ENABLED=true` in the API `.env`.
3. Restart workers: `sudo supervisorctl restart foodzone-worker:*`.
4. Trigger a test from the mobile app (e.g. place an order) and confirm a push arrives.

> Expo handles APNs (Apple) and FCM (Google) for you. For raw FCM/APNs you'd need to manage certificates yourself.

---

## 21. Payment gateway setup

### Razorpay (India)

1. Create a Razorpay account, go to Dashboard → Settings → API Keys → Generate live keys.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.
3. Webhook: Add `https://api.foodzone.app/api/v1/payments/webhook` in Razorpay Dashboard → Settings → Webhooks. Copy the secret to `RAZORPAY_WEBHOOK_SECRET`.
4. Allowed events: `payment.captured`, `payment.failed`, `refund.processed`.

### Stripe (global)

1. Create a Stripe account, get keys from Dashboard → Developers → API Keys.
2. Webhook endpoint same URL. Choose `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.
3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

Restart workers after editing `.env`. Re-cache config:

```bash
php artisan config:cache
sudo supervisorctl restart foodzone-worker:*
```

---

## 22. Backups (DB + media)

### 22.1 Automated MySQL backup

```bash
sudo tee /usr/local/bin/foodzone-backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S)
DIR=/var/backups/foodzone
mkdir -p "$DIR"
mysqldump --single-transaction --quick --routines --triggers \
  -u foodzone -p'CHANGE_ME_STRONG_PASSWORD' foodzone \
  | gzip > "$DIR/db-$TS.sql.gz"
# Keep last 14 days
find "$DIR" -type f -name 'db-*.sql.gz' -mtime +14 -delete
EOF
sudo chmod +x /usr/local/bin/foodzone-backup.sh

# Daily at 03:15
echo "15 3 * * * /usr/local/bin/foodzone-backup.sh" | sudo crontab -
```

### 22.2 Off-site backup (highly recommended)

Pipe the backup to S3 / B2 / R2:

```bash
# After dumping, push to S3
aws s3 cp "$DIR/db-$TS.sql.gz" s3://foodzone-backups/db/
```

Or use **Restic** for incremental encrypted backups:

```bash
sudo apt -y install restic
restic -r b2:foodzone-backups:/ init
restic backup /var/www/foodzone/FoodZoneServer/storage /var/backups/foodzone
restic forget --keep-daily 14 --keep-weekly 8 --prune
```

### 22.3 Test the restore

**Untested backups are not backups.** Restore to a staging server quarterly:

```bash
gunzip < db-20260529-031500.sql.gz | mysql -u foodzone -p foodzone_staging
```

---

## 23. Monitoring, logs, error tracking

### 23.1 Application logs

```bash
tail -f /var/www/foodzone/FoodZoneServer/storage/logs/laravel.log
tail -f /var/log/foodzone-worker.log
tail -f /var/log/foodzone-reverb.log
tail -f /var/log/nginx/foodzone-api.error.log
```

### 23.2 Sentry (errors)

In `.env`:

```ini
SENTRY_LARAVEL_DSN=https://xxxx@sentry.io/yyyy
```

```bash
composer require sentry/sentry-laravel
php artisan sentry:publish --dsn=$SENTRY_LARAVEL_DSN
php artisan config:cache
```

For Next.js: `@sentry/nextjs`. For Expo: `@sentry/react-native`.

### 23.3 Uptime monitoring

Free: **UptimeRobot** or **BetterStack**. Add three monitors:

- `https://api.foodzone.app/api/v1/health` (5-min interval, alert if down 2 checks)
- `https://www.foodzone.app/`
- WS handshake — use BetterStack's WebSocket monitor.

### 23.4 Server metrics

```bash
# Quick view
htop          # CPU + memory
iotop         # Disk I/O
ncdu /        # Disk usage walker
```

Long-term: **Netdata** (free, beautiful) or **Datadog** (paid).

```bash
# Netdata one-liner
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --stable-channel --disable-telemetry
# UI on http://1.2.3.4:19999 — firewall it or proxy via Nginx
```

### 23.5 Slow query log

```bash
sudo mysql -u root -p -e "
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';"
sudo tail -f /var/log/mysql/slow.log
```

---

## 24. CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.5' }
      - run: cd FoodZoneServer && composer install --prefer-dist --no-progress
      - run: cd FoodZoneServer && cp .env.example .env && php artisan key:generate
      - run: cd FoodZoneServer && php artisan test

      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd foodzoneweb && npm ci && npm run lint && npm run build
      - run: cd FoodZoneApp && npm ci && npx tsc --noEmit && npx expo lint

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: deploy
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/foodzone/FoodZoneServer
            git pull origin main
            composer install --no-dev --optimize-autoloader
            php artisan down --render="errors::503" --secret="bypass"
            php artisan migrate --force
            php artisan config:cache
            php artisan route:cache
            php artisan view:cache
            php artisan event:cache
            php artisan up
            sudo supervisorctl restart foodzone-worker:*
            sudo supervisorctl restart foodzone-reverb
```

Add secrets in GitHub → Repo Settings → Secrets:

- `SSH_HOST` = `1.2.3.4`
- `SSH_KEY` = paste the private key (`~/.ssh/id_ed25519` from your deploy machine)

---

## 25. Zero-downtime deploys

The naive deploy in §24 has a 5–10 s `down` window. For a real zero-downtime deploy:

### 25.1 Symlinked releases (Capistrano / Deployer style)

```bash
/var/www/foodzone/FoodZoneServer/
├── current → releases/20260529-1015/    # symlink
├── releases/
│   ├── 20260529-0900/
│   ├── 20260529-1015/                   # newest
│   └── ...
└── shared/
    ├── .env
    └── storage/                         # shared across releases
```

Steps per deploy:

1. `mkdir releases/$(date +%Y%m%d-%H%M%S)`
2. `git clone --depth 1 ...` into the new release dir.
3. Symlink `shared/.env` → `releases/.../.env` and `shared/storage` → `releases/.../storage`.
4. `composer install` in the new release.
5. Cache config/route/view.
6. `php artisan migrate --force` (idempotent migrations only — no destructive ones during business hours).
7. `ln -sfn releases/.../current` to switch atomically.
8. `php-fpm reload` (or graceful `supervisorctl restart`).
9. Keep last 5 releases for quick rollback.

The **Laravel Envoy** or **Deployer** packages automate all of this. Install:

```bash
composer global require deployer/deployer
dep init        # answers will scaffold deploy.php
dep deploy production
```

### 25.2 Even simpler: Laravel Forge

If you don't want to maintain any of this yourself, **Laravel Forge ($12/mo)** does all of §6–§16 + §25 with one click. It's the lowest-friction path.

---

## 26. Health checks & smoke tests

After every deploy, run this from your dev machine:

```bash
#!/usr/bin/env bash
set -e

echo "→ API health"
curl -fsS https://api.foodzone.app/api/v1/health | jq .

echo "→ Web SSR"
curl -fsS https://www.foodzone.app/ | grep -q "FoodZone" && echo "  ok"

echo "→ WS handshake"
curl -i -sS -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  -H "Sec-WebSocket-Version: 13" \
  https://ws.foodzone.app/app/$REVERB_KEY \
  | head -1 | grep -q "101 Switching Protocols" && echo "  ok"

echo "→ Login as seeded admin"
TOKEN=$(curl -fsS -X POST https://api.foodzone.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodzone.app","password":"password"}' | jq -r .data.token)
test -n "$TOKEN" && echo "  ok ($TOKEN)"

echo "✅ all checks passed"
```

> **Change the admin password before going live.** The seed sets `admin@foodzone.app / password`. Log in and rotate immediately.

---

## 27. Troubleshooting cheatsheet

| Symptom | First check | Fix |
|---|---|---|
| `502 Bad Gateway` | `sudo systemctl status php8.5-fpm` | Restart php-fpm: `sudo systemctl restart php8.5-fpm` |
| `500` after deploy | `tail -f storage/logs/laravel.log` | Usually missing migration / cleared cache. `php artisan config:clear && php artisan migrate` |
| `419 Page Expired` (web) | Session driver, CORS | `SESSION_DRIVER=redis`, set `SANCTUM_STATEFUL_DOMAINS` |
| Mobile login times out | `curl https://api.foodzone.app/api/v1/auth/login` | Wrong `apiUrl` in `app.config.ts` — rebuild app |
| WS disconnects every 60s | Nginx `proxy_read_timeout` | Set to `86400` (see §15) |
| Push notifications silent | `tail -f /var/log/foodzone-worker.log` | Check `PUSH_ENABLED=true`, expo token valid, supervisor running |
| Slow `/explore` | Cache hit? `redis-cli -a ... keys 'explore:*'` | Confirm `CACHE_STORE=redis`, restart queue |
| Migrations fail on MySQL but pass on SQLite | Column types | Audit each migration; avoid SQLite-only quirks (no `ENUM` in fresh code) |
| Disk full | `df -h` then `ncdu /var/log` | Logrotate: `sudo nano /etc/logrotate.d/foodzone` |
| Workers crash | `sudo supervisorctl status` | `sudo supervisorctl restart foodzone-worker:*`; check log for OOM |
| Meilisearch out of sync | `php artisan scout:flush "App\Models\Vendor"` then `scout:import` | Re-import the affected model |
| `APP_KEY` lost (worst case) | All encrypted cookies invalidated | Regenerate, force-logout all users (acceptable on launch day, painful later) |

---

## 28. Scaling checklist

Hit a wall? Walk this list top-to-bottom; each step typically buys 5–10× headroom.

1. **Cache hit ratio** — `redis-cli info stats | grep keyspace_hits`. Add caches before scaling compute.
2. **Slow query log** — index the offenders. P35 already added the 5 obvious composites; new endpoints may need their own.
3. **Larger Droplet** — vertical scale to 8 GB / 4 vCPU; cheapest move.
4. **Separate DB host** — managed MySQL ($15/mo) frees the app box.
5. **Separate Redis host** — managed Redis ($15/mo).
6. **Media → S3/R2 + CDN** — frees app disk + bandwidth.
7. **Multiple app servers** behind a load balancer (HAProxy or DO LB). Sessions go to Redis (already the case). Storage goes to S3 (so writes are safe from any node).
8. **Queue workers on a separate box** — they're CPU-heavy when push volumes spike.
9. **Read replicas** for MySQL. Wire via `read`/`write` connection in `config/database.php`.
10. **Search → dedicated Meilisearch** node or hosted (Meilisearch Cloud).
11. **CDN-cache GETs** — vendor list, menu, explore. Cloudflare Cache Rules.
12. **Stop, profile, then scale further** — `php-fpm` slowlog, Datadog APM, real user monitoring.

---

## 29. Cost-optimised single-box layout

If you want everything on **one $6 box** for an MVP, here's the layout:

| Service | Memory | Tweak |
|---|---|---|
| MySQL | 512 MB | `innodb_buffer_pool_size = 256M` |
| Redis | 128 MB | `maxmemory 128mb` |
| Meilisearch | 256 MB | small index, fine |
| PHP-FPM (pm = ondemand, max 8) | 256 MB | `pm.max_children = 8` |
| Nginx | 30 MB | default |
| Reverb | 80 MB | single process |
| Queue workers (2) | 160 MB | OK |
| Free for OS + bursts | ~300 MB | |

You'll hit a memory wall around 1k concurrent users. That's when you move MySQL off-box (see §28).

---

## 30. Rollback procedure

Things will go wrong. Have a tested rollback **before** you need it.

### 30.1 With symlinked releases (§25)

```bash
cd /var/www/foodzone/FoodZoneServer
ls releases/                # newest at bottom
ln -sfn releases/20260528-2100 current
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo supervisorctl restart foodzone-worker:*
sudo supervisorctl restart foodzone-reverb
sudo systemctl reload nginx
```

### 30.2 Without symlinks (simple `git pull` deploy)

```bash
cd /var/www/foodzone/FoodZoneServer
git log --oneline -10       # find the last-good commit
git reset --hard <sha>
composer install --no-dev
php artisan config:cache && php artisan route:cache
sudo supervisorctl restart foodzone-worker:*
```

### 30.3 Database rollback

If a migration corrupted data, **stop the app first** to prevent further writes:

```bash
php artisan down --secret="bypass"
mysql -u root -p foodzone < /var/backups/foodzone/db-PREVIOUS.sql
php artisan up
```

### 30.4 Stop everything (panic button)

```bash
sudo supervisorctl stop all
sudo systemctl stop nginx
# Site is dark. Now triage in calm.
```

---

## Appendix A — One-shot install script

For the brave: this installs §6–§16 in one go. Read it before running.

```bash
curl -fsSL https://gist.githubusercontent.com/YOUR_USERNAME/RAW/foodzone-bootstrap.sh -o bootstrap.sh
less bootstrap.sh   # ALWAYS read before piping to bash
sudo bash bootstrap.sh
```

(Write this gist as a sanitised version of this guide. Don't copy this URL — replace it.)

---

## Appendix B — Useful one-liners

```bash
# Tail every log at once
sudo multitail \
  /var/www/foodzone/FoodZoneServer/storage/logs/laravel.log \
  /var/log/foodzone-worker.log \
  /var/log/foodzone-reverb.log \
  /var/log/nginx/foodzone-api.error.log

# How many jobs queued?
redis-cli -a "$REDIS_PASSWORD" llen queues:default

# Last 50 errors
grep -i error /var/www/foodzone/FoodZoneServer/storage/logs/laravel.log | tail -50

# Top-10 slowest endpoints (parses laravel log times)
grep "duration_ms" laravel.log | jq -r '.duration_ms,.route' | sort -nr | head -20

# Clear all caches
cd /var/www/foodzone/FoodZoneServer && \
  php artisan cache:clear && \
  php artisan config:clear && \
  php artisan route:clear && \
  php artisan view:clear && \
  php artisan event:clear

# Generate a quick smoke-test from any commit
git log --oneline -1
curl -fsS https://api.foodzone.app/api/v1/health
```

---

## Appendix C — Variables you must rotate before going live

Anything labelled `CHANGE_ME_` in this doc. Generate strong values:

```bash
# 32-char random key (use for DB password, Redis, Meili, Reverb)
openssl rand -base64 32 | tr -d '/+=' | head -c 32 ; echo

# Laravel APP_KEY (handled by artisan)
php artisan key:generate
```

Track them in a password manager (**Bitwarden / 1Password**). **Do not commit them to git.**

---

## Appendix D — Reading order for new ops engineers

1. `docs/PROGRESS.md` — what's shipped, current numbers.
2. `docs/WORKPHASES.md` — index of every workphase.
3. This file — `deployment docs/deployment.md`.
4. `FoodZoneServer/API.md` — the API contract.
5. `docs/FUTURE_UPDATES.md` — what's next.
6. `RUNBOOK.md` (when you write it) — known alerts + how to respond.

---

_Last revised: 2026-05-29 · Targets: Ubuntu 24.04 + PHP 8.5 + MySQL 8 + Redis 7 + Meilisearch 1.10 + Node 22._
