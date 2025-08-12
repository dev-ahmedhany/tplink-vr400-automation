# tplink-usage

This is a [tplink-usage.vercel.app](https://tplink-usage.vercel.app/)  project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# TP-Link VR400 Router Usage Automation

A complete solution for monitoring and visualizing TP-Link VR400 router usage data. This project includes a Node.js scraper, Express.js API server, and Next.js frontend dashboard.

## 🌟 Features

- **Automated Scraping**: Periodically scrapes router usage data using Puppeteer
- **REST API**: Express.js server provides endpoints for data access
- **Dashboard**: Next.js frontend with interactive charts
- **Raspberry Pi Ready**: Complete deployment script for Raspberry Pi
- **Real-time Updates**: Automatic data refresh and live dashboard
- **Process Management**: PM2 integration for production deployment

## 🚀 Quick Start (Raspberry Pi)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url> ~/tplink-vr400-automation
   cd ~/tplink-vr400-automation
   ```

2. **Run the deployment script:**
   ```bash
   ./deploy-raspberry-pi.sh
   ```

3. **Configure your router details:**
   ```bash
   nano ~/tplink-vr400-automation/node-script/.env
   ```

4. **Access your dashboard:**
   - Dashboard: `http://your-pi-ip:3001`
   - API: `http://your-pi-ip:3001/api/status`

## 📁 Project Structure

```
├── src/                    # Next.js frontend
│   ├── components/        # React components
│   ├── pages/            # Next.js pages
│   ├── styles/           # CSS styles
│   └── utils/            # API utilities
├── node-script/           # Backend server and scraper
│   ├── server.js         # Express.js API server
│   ├── index.js          # Scraping functionality
│   └── package.json      # Backend dependencies
├── functions/             # Legacy Firebase functions
└── deploy-raspberry-pi.sh # Automated deployment script
```

## 🔧 Manual Setup

### Backend (Node.js API Server)

```bash
cd node-script
npm install
cp .env.example .env
# Edit .env with your router details
npm start
```

### Frontend (Next.js)

```bash
npm install
npm run build
npm start
```

## 🌐 API Endpoints

- `GET /api/usage` - Get processed usage data for frontend
- `GET /api/usage/raw` - Get raw scraping data
- `POST /api/scrape` - Trigger manual scraping
- `GET /api/status` - Get server status and statistics
- `GET /health` - Health check endpoint

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Router Configuration
URL=http://192.168.1.1
PASSWORD=your_router_password

# Server Configuration
PORT=3001
NODE_ENV=production

# Optional Settings
TIMEZONE=Africa/Cairo
DISABLE_CRON=false
```

## 🔄 Automation

The system includes automatic scraping every hour using node-cron. Data is stored locally in JSON format and automatically managed (keeps last 100 entries).

## 📊 Dashboard Features

- **Interactive Charts**: Real-time usage visualization
- **Device Breakdown**: Individual device usage tracking
- **Historical Data**: Time-series usage patterns
- **Responsive Design**: Works on desktop and mobile

## 🔧 Process Management

Using PM2 for production deployment:

```bash
# Start
pm2 start ecosystem.config.js

# View logs
pm2 logs tplink-scraper

# Restart
pm2 restart tplink-scraper

# Stop
pm2 stop tplink-scraper
```

## 🛠️ Troubleshooting

### Common Issues

1. **Router Connection**: Verify IP address and credentials
2. **Puppeteer Issues**: Install missing dependencies on Raspberry Pi
3. **Port Conflicts**: Change PORT in .env file
4. **Memory Issues**: Restart PM2 process

### Logs

```bash
# PM2 logs
pm2 logs tplink-scraper

# System logs
journalctl -u tplink-automation.service -f
```

## 📱 Access from Network

Once deployed on Raspberry Pi, the dashboard is accessible from any device on your network:
- Find your Pi's IP: `hostname -I`
- Access dashboard: `http://PI_IP:3001`

## 🔒 Security Notes

- Change default router password
- Consider setting up basic authentication for the dashboard
- Use firewall rules to restrict access if needed

## 📋 Requirements

- Node.js 16+
- Raspberry Pi OS (or any Linux distribution)
- TP-Link VR400 router with web interface access
- Network connectivity between Pi and router

## 🤝 Contributing

Feel free to submit issues and pull requests to improve the project.

## 📄 License

This project is licensed under the MIT License.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
