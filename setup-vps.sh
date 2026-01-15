#!/bin/bash

# Script setup DigiNote di VPS
# Jalankan di VPS setelah upload file

echo "=== Setup DigiNote di VPS ==="
echo ""

# Variables
APP_NAME="diginote"
APP_DIR="/var/www/apps/${APP_NAME}"
DB_NAME="diginote_db"
DB_USER="diginote_user"
DB_PASS="DigiNote2024"

# Step 1: Extract files
echo "1. Extract files..."
cd /tmp
unzip -o diginote.zip -d ${APP_NAME}
mkdir -p ${APP_DIR}
cp -r ${APP_NAME}/* ${APP_DIR}/
rm -rf ${APP_NAME} diginote.zip

# Step 2: Install Node.js (jika belum ada)
echo "2. Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

node --version
npm --version

# Step 3: Install dependencies
echo "3. Installing backend dependencies..."
cd ${APP_DIR}/backend
npm install --production

# Step 4: Setup MySQL Database
echo "4. Setting up MySQL database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -u root -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# Step 5: Create .env file
echo "5. Creating .env file..."
cat > ${APP_DIR}/backend/.env << EOF
PORT=5001
NODE_ENV=production

# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

# Frontend URL
FRONTEND_URL=https://diginote.my.id
EOF

# Step 6: Install PM2 (jika belum ada)
echo "6. Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Step 7: Start application with PM2
echo "7. Starting application..."
cd ${APP_DIR}/backend
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 start server.js --name ${APP_NAME}
pm2 save
pm2 startup

# Step 8: Setup Nginx
echo "8. Setting up Nginx..."
cat > /etc/nginx/sites-available/${APP_NAME} << 'NGINX_EOF'
server {
    listen 80;
    server_name diginote.my.id;

    # Frontend
    location / {
        root /var/www/apps/diginote/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "=== Setup Selesai! ==="
echo ""
echo "Informasi:"
echo "- App Directory: ${APP_DIR}"
echo "- Database: ${DB_NAME}"
echo "- DB User: ${DB_USER}"
echo "- DB Password: ${DB_PASS}"
echo "- Backend Port: 5001"
echo "- PM2 Process: ${APP_NAME}"
echo ""
echo "Cek status: pm2 status"
echo "Cek logs: pm2 logs ${APP_NAME}"
echo ""
echo "Setup SSL dengan: certbot --nginx -d diginote.my.id"
