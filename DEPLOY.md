# Panduan Deploy ke VPS DigitalOcean

## Persiapan

1. Buat Droplet di DigitalOcean (Ubuntu 22.04 LTS)
2. Setup SSH key untuk akses
3. (Opsional) Setup domain dan arahkan ke IP VPS
4. Pastikan MySQL sudah terinstall di VPS

## Langkah Deploy

### 1. Koneksi ke VPS
```bash
ssh root@your_vps_ip
```

### 2. Clone Repository
```bash
cd /var/www
git clone https://github.com/username/diginote.git
cd diginote
```

### 3. Jalankan Script Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Konfigurasi Environment
Edit file `.env`:
```bash
nano backend/.env
```

Isi dengan:
```
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=finance_app
DB_USER=finance_user
DB_PASSWORD=password_yang_kuat

JWT_SECRET=random_string_yang_sangat_panjang_dan_aman

FRONTEND_URL=http://your_domain.com
```

### 5. Setup Nginx
```bash
sudo nano /etc/nginx/sites-available/diginote
```

Copy isi dari `nginx.conf`, lalu:
```bash
sudo ln -s /etc/nginx/sites-available/diginote /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Update Frontend API URL
Edit `frontend/app.js`, ganti:
```javascript
const API_URL = 'http://your_domain.com/api';
```

### 7. Restart Backend
```bash
pm2 restart diginote
```

### 8. Setup Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 9. (Opsional) Setup SSL dengan Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

## Maintenance

### Melihat Log Backend
```bash
pm2 logs diginote
```

### Restart Backend
```bash
pm2 restart diginote
```

### Update Aplikasi
```bash
cd /var/www/diginote
git pull
cd backend
npm install
pm2 restart diginote
```

### Backup Database
```bash
pg_dump -U finance_user finance_app > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Backend tidak jalan
```bash
pm2 logs diginote
pm2 restart diginote
```

### Database error
```bash
mysql -u finance_user -p
SHOW DATABASES;
USE finance_app;
SHOW TABLES;
```

### Nginx error
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```
