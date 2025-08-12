#!/bin/bash

# Raspberry Pi Deployment Script for TP-Link VR400 Automation
# This script sets up everything needed to run the project on Raspberry Pi

echo "🍓 TP-Link VR400 Automation - Raspberry Pi Setup"
echo "================================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js already installed: $(node -v)"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    pm2 startup
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
else
    echo "✅ PM2 already installed"
fi

# Install required system dependencies for Puppeteer
echo "📥 Installing Puppeteer dependencies..."
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget

# Navigate to project directory
PROJECT_DIR="$HOME/tplink-vr400-automation"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found at $PROJECT_DIR"
    echo "Please clone the repository first:"
    echo "git clone https://github.com/dev-ahmedhany/tplink-vr400-automation.git $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Install main project dependencies
echo "📦 Installing main project dependencies..."
npm install yarn -g
yarn

# Build the Next.js frontend
echo "🏗️  Building frontend..."
npm run build

# Install node-script dependencies
echo "📦 Installing node-script dependencies..."
cd node-script
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file with your router details:"
    echo "   nano $PROJECT_DIR/node-script/.env"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tplink-scraper',
    script: 'server.js',
    cwd: '$PROJECT_DIR/node-script',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '$HOME/.pm2/logs/tplink-scraper.log',
    out_file: '$HOME/.pm2/logs/tplink-scraper-out.log',
    error_file: '$HOME/.pm2/logs/tplink-scraper-error.log'
  }]
};
EOF

# Create systemd service for auto-start on boot
echo "🔧 Setting up systemd service..."
sudo tee /etc/systemd/system/tplink-automation.service > /dev/null <<EOF
[Unit]
Description=TP-Link VR400 Automation
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$PROJECT_DIR/node-script
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
PIDFile=$HOME/.pm2/pm2.pid
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable tplink-automation.service

# Start the application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Access Points:"
echo "   Dashboard: http://$(hostname -I | awk '{print $1}'):3001"
echo "   API Status: http://$(hostname -I | awk '{print $1}'):3001/api/status"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: pm2 logs tplink-scraper"
echo "   Restart: pm2 restart tplink-scraper"
echo "   Stop: pm2 stop tplink-scraper"
echo "   Status: pm2 status"
echo ""
echo "🔄 The service will automatically start on boot."
echo "📱 You can access the dashboard from any device on your network!"
