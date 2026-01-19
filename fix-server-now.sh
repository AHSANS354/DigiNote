#!/bin/bash

echo "🚀 Memperbaiki masalah undefined kategori di server..."
echo "=================================================="

# Step 1: Masuk ke direktori
echo "📁 Masuk ke direktori aplikasi..."
cd /var/www/apps/DigiNote || { echo "❌ Gagal masuk ke direktori"; exit 1; }

# Step 2: Cek status
echo "📋 Cek status git..."
git status

# Step 3: Pull perubahan terbaru
echo "⬇️ Pull perubahan terbaru..."
git pull origin main

# Step 4: Verifikasi commit terbaru
echo "✅ Verifikasi commit terbaru..."
git log --oneline -3

# Step 5: Cek perbaikan di file
echo "🔍 Cek apakah perbaikan sudah ada..."
if grep -q "category_name.*Kategori Tidak Diketahui" frontend/app.js; then
    echo "✅ Perbaikan ditemukan di frontend/app.js"
else
    echo "❌ Perbaikan belum ditemukan"
fi

# Step 6: Restart aplikasi
echo "🔄 Restart aplikasi..."
if command -v pm2 &> /dev/null; then
    echo "Menggunakan PM2..."
    pm2 restart all
else
    echo "Restart nginx..."
    sudo systemctl restart nginx
fi

echo "🎉 Selesai! Silakan refresh browser dan cek tab Laporan"