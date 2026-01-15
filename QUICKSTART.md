# Quick Start Guide

## Setup Development

### 1. Install MySQL
Download dan install MySQL dari https://dev.mysql.com/downloads/

### 2. Buat Database
```bash
# Masuk ke MySQL
mysql -u root -p

# Buat database dan user
CREATE DATABASE finance_app;
CREATE USER 'finance_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON finance_app.* TO 'finance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=finance_app
DB_USER=finance_user
DB_PASSWORD=password123

JWT_SECRET=rahasia_jwt_kamu_ganti_ini

FRONTEND_URL=http://localhost:3000
```

Jalankan backend:
```bash
npm run dev
```

### 4. Setup Frontend
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```

### 5. Buka Browser
Akses: http://localhost:3000

## Deploy ke VPS DigitalOcean

Lihat panduan lengkap di [DEPLOY.md](DEPLOY.md)

### Ringkasan:
1. Buat Droplet Ubuntu di DigitalOcean
2. SSH ke VPS
3. Clone repository
4. Jalankan `./deploy.sh`
5. Edit `.env` dengan konfigurasi production
6. Setup Nginx (copy dari `nginx.conf`)
7. Akses aplikasi via domain/IP

## Fitur Aplikasi

- ✅ Register & Login dengan JWT
- ✅ Tambah transaksi (pemasukan/pengeluaran)
- ✅ Lihat total pemasukan, pengeluaran, dan saldo
- ✅ Filter transaksi berdasarkan tipe
- ✅ Hapus transaksi
- ✅ Responsive design
- ✅ Data tersimpan per user

## Tech Stack

- **Backend**: Node.js, Express, MySQL, JWT
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Deployment**: Nginx, PM2

## Keamanan

- Password di-hash dengan bcrypt
- JWT untuk autentikasi
- CORS protection
- SQL injection protection (parameterized queries)
- Environment variables untuk sensitive data

## Support

Jika ada masalah, cek:
1. Backend logs: `pm2 logs finance-app`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Database connection: pastikan PostgreSQL running
