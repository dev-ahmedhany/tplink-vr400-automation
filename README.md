# TP-Link VR400 Router Usage Automation

A complete solution for monitoring and visualizing TP-Link VR400 router usage data. This project includes a Node.js scraper, Express.js API server, and Next.js frontend dashboard with real-time analytics and beautiful data visualizations.

## 🌟 Features

### Frontend Dashboard
- **Interactive Charts**: Real-time usage visualization with D3.js powered charts
- **Device Analytics**: Individual device usage tracking and ranking
- **System Monitoring**: Live server statistics and health monitoring
- **Dark Mode UI**: Modern dark theme with gradient accents
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Auto-refresh**: Dashboard updates every 5 minutes automatically

### Backend Services  
- **Automated Scraping**: Hourly scraping of router usage data using Puppeteer
- **REST API**: Express.js server with comprehensive endpoints
- **Data Processing**: Intelligent data aggregation and filtering
- **Real-time Updates**: Live data streaming and caching
- **Error Handling**: Robust error handling and retry mechanisms

### Deployment & Infrastructure
- **Raspberry Pi Ready**: One-click deployment script for Raspberry Pi
- **Process Management**: PM2 integration for production deployment
- **Health Monitoring**: Built-in health checks and status endpoints
- **Data Persistence**: Local JSON storage with automatic cleanup

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
tplink-vr400-automation/
├── src/                           # Next.js Frontend
│   ├── components/               # React Components
│   │   ├── EnhancedAreaChart.tsx # Interactive charts with D3.js
│   │   ├── SystemMonitor.tsx     # Real-time system monitoring
│   │   └── StackedArea.js        # Data visualization components
│   ├── pages/                    # Next.js Pages
│   │   ├── index.tsx             # Main dashboard page
│   │   ├── delete.tsx            # Data management page
│   │   ├── _app.tsx              # App configuration
│   │   └── _document.tsx         # Document structure
│   ├── styles/                   # Styling
│   │   ├── globals.css           # Global styles
│   │   └── Home.module.css       # Component-specific styles
│   └── utils/                    # Utilities
│       ├── api.ts                # API client functions
│       └── getFirestoreAdmin.js  # Firebase admin setup
├── node-script/                  # Backend Services
│   ├── server.js                 # Express.js API server (main)
│   ├── index.js                  # Router scraping logic
│   ├── ecosystem.config.js       # PM2 configuration
│   ├── migrate-data.js           # Data migration utility
│   ├── data/                     # Local data storage
│   └── package.json              # Backend dependencies
├── public/                       # Static assets
├── deploy-raspberry-pi.sh        # Automated Pi deployment
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript configuration
└── next.config.js                # Next.js configuration
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

### Usage Data
- `GET /api/usage` - Get processed usage data optimized for frontend
- `GET /api/usage/raw` - Get raw scraping data from storage
- `GET /api/usage?hours=24` - Get usage data for specific time period
- `GET /api/usage?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get usage data for date range

### System Control
- `POST /api/scrape` - Trigger manual scraping operation
- `GET /api/status` - Get server status, uptime, and statistics
- `GET /health` - Health check endpoint for monitoring
- `GET /api/system/stats` - Detailed system metrics and performance

### Data Management
- `DELETE /api/data/clear` - Clear all stored usage data
- `GET /api/data/export` - Export data in various formats
- `POST /api/data/import` - Import historical data

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

### Data Visualization
- **Enhanced Area Charts**: Interactive D3.js powered charts with zoom and pan
- **Device Rankings**: Top devices and users with usage statistics
- **Time Series Analysis**: Historical data trends and patterns
- **Real-time Metrics**: Live usage updates and system monitoring

### User Experience
- **Modern Dark Theme**: Sleek gradient-based design
- **Responsive Layout**: Optimized for all screen sizes
- **Loading States**: Smooth transitions and progress indicators
- **Error Handling**: User-friendly error messages and recovery

### Analytics Features
- **Usage Aggregation**: Total and per-device data breakdown
- **Time Filtering**: Custom date ranges and period selection
- **Device Grouping**: Automatic user grouping based on device names
- **Export Options**: Data export in multiple formats

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

## 📋 System Requirements

### Hardware
- Raspberry Pi 3B+ or higher (recommended: Pi 4 with 4GB RAM)
- SD card with at least 16GB storage
- Stable network connection to router
- TP-Link VR400 router with web interface access

### Software
- Node.js 16+ (automatically installed by deployment script)
- Raspberry Pi OS Lite or Desktop
- Chrome/Chromium browser dependencies (auto-installed)
- PM2 process manager (auto-installed)

### Network
- Router admin access (username/password)
- Network connectivity between Pi and router
- Optional: Static IP assignment for Raspberry Pi

## 🔧 Development

### Local Development Setup

1. **Frontend Development**
   ```bash
   npm install
   npm run dev
   # Dashboard available at http://localhost:3000
   ```

2. **Backend Development**
   ```bash
   cd node-script
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   # API server available at http://localhost:3001
   ```

### Building for Production

```bash
# Build frontend
npm run build
npm start

# Backend is production-ready by default
cd node-script
npm start
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Puppeteer fails to launch | Install Chrome dependencies: `sudo apt-get install -y chromium-browser` |
| Permission denied on setup | Ensure script is executable: `chmod +x deploy-raspberry-pi.sh` |
| Dashboard shows no data | Check backend logs: `pm2 logs tplink-scraper` |
| Router connection fails | Verify IP address, credentials, and network connectivity |
| High memory usage | Restart services: `pm2 restart tplink-scraper` |

### Debugging Commands

```bash
# Check service status
pm2 status

# View real-time logs
pm2 logs tplink-scraper --lines 50

# Monitor system resources
pm2 monit

# Test router connectivity
curl http://192.168.1.1 # Replace with your router IP
```

## 📈 Performance Optimization

- **Data Retention**: Automatically keeps last 100 entries to prevent storage bloat
- **Caching**: API responses are cached for improved performance
- **Error Recovery**: Automatic retry logic for failed scraping attempts
- **Memory Management**: Puppeteer instances are properly closed after each scrape

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Test on Raspberry Pi before submitting
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Puppeteer](https://pptr.dev/) for web scraping capabilities
- [Next.js](https://nextjs.org/) for the frontend framework
- [D3.js](https://d3js.org/) for data visualization
- [Express.js](https://expressjs.com/) for the API server
- [PM2](https://pm2.keymetrics.io/) for process management

---

<div align="center">
  <strong>🌐 Network Dashboard • 📊 Real-time Analytics • 🚀 Production Ready</strong>
</div>
