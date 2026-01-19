#!/bin/bash

echo "🔄 Updating server dengan perbaikan terbaru..."

# Pull perubahan terbaru dari repository
echo "⬇️ Pulling latest changes..."
git pull origin main

# Restart aplikasi jika menggunakan PM2
echo "🔄 Restarting aplikasi..."
if command -v pm2 &> /dev/null; then
    pm2 restart diginote-backend 2>/dev/null || echo "Backend tidak ditemukan di PM2"
    pm2 restart diginote-frontend 2>/dev/null || echo "Frontend tidak ditemukan di PM2"
else
    echo "PM2 tidak ditemukan, restart manual jika diperlukan"
fi

echo "✅ Update selesai!"
echo "🌐 Silakan refresh browser dan test tab Laporan"