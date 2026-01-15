# DigiNote - Catatan Keuangan Digital

Aplikasi web untuk mencatat pemasukan dan pengeluaran pribadi dengan sistem login.

## Fitur
- Register & Login dengan JWT
- Tambah, Edit, Hapus transaksi
- Lihat saldo total dengan filter bulan/tahun
- Filter transaksi (pemasukan/pengeluaran)
- Laporan keuangan dengan breakdown per kategori
- Kategori dinamis (bisa tambah/hapus)

## Tech Stack
- Backend: Node.js, Express, MySQL
- Frontend: HTML, CSS, JavaScript
- Auth: JWT

## Setup Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database MySQL
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deploy ke VPS DigitalOcean

1. Install Node.js dan PostgreSQL di VPS
2. Clone repository
3. Setup database PostgreSQL
4. Konfigurasi .env
5. Install PM2: `npm install -g pm2`
6. Jalankan: `pm2 start backend/server.js`
7. Setup Nginx sebagai reverse proxy
