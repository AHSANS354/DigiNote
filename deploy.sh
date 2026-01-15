#!/bin/bash

# Script deployment untuk VPS DigitalOcean dengan MySQL
# Jalankan script ini di VPS setelah clone repository

echo "=== Setup DigiNote - Catatan Keuangan Digital ==="

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (versi 18 LTS)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL (jika belum ada)
echo "Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "Installing MySQL..."
    sudo apt install -y mysql-server
    sudo mysql_secure_installation
fi

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Setup MySQL Database
echo "Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS finance_app;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'finance_user'@'localhost' IDENTIFIED BY 'your_password_here';"
sudo mysql -e "GRANT ALL PRIVILEGES ON finance_app.* TO 'finance_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Setup environment
echo "Setting up environment..."
cp backend/.env.example backend/.env
echo "EDIT backend/.env dengan konfigurasi yang sesuai!"

# Start backend dengan PM2
echo "Starting backend..."
pm2 start backend/server.js --name diginote
pm2 save
pm2 startup

echo "=== Setup selesai! ==="
echo "Langkah selanjutnya:"
echo "1. Edit backend/.env dengan konfigurasi database MySQL"
echo "2. Setup Nginx (lihat nginx.conf)"
echo "3. Restart PM2: pm2 restart diginote"
