const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const dotenv = require('dotenv');
const { scrapeWebsite } = require('./index');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'usage-data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper function to read usage data
function readUsageData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading usage data:', error);
    return [];
  }
}

// Helper function to process usage data for frontend
function processUsageData(rawData) {
  if (!rawData || rawData.length === 0) {
    return {
      csvData: '',
      total: 0,
      lastUpdated: new Date().toISOString(),
      devices: []
    };
  }

  // Get the latest data entry for current stats
  const latestEntry = rawData[rawData.length - 1];
  
  // Collect all unique devices
  const devices = {};
  const totals = {};
  
  rawData.forEach(entry => {
    if (entry.data) {
      Object.entries(entry.data).forEach(([mac, deviceInfo]) => {
        if (deviceInfo.name !== "null" && deviceInfo.name) {
          devices[mac] = deviceInfo.name;
          if (!totals[mac]) {
            totals[mac] = { usage: 0, name: deviceInfo.name };
          }
        }
      });
    }
  });

  // Calculate totals and generate CSV data
  const macList = Object.keys(devices);
  let csvData = "usage,";
  
  // Process each entry to calculate usage
  rawData.forEach(entry => {
    if (entry.data) {
      macList.forEach(mac => {
        if (entry.data[mac]) {
          let usage = entry.data[mac].usage;
          const usageNum = parseFloat(usage);
          
          // Convert to bytes
          if (usage.includes('K')) {
            usage = usageNum * 1024;
          } else if (usage.includes('M')) {
            usage = usageNum * 1024 * 1024;
          } else if (usage.includes('G')) {
            usage = usageNum * 1024 * 1024 * 1024;
          } else {
            usage = usageNum;
          }
          
          totals[mac].usage += usage;
        }
      });
    }
  });

  // Calculate total usage
  const total = Object.values(totals).reduce((acc, device) => acc + device.usage, 0);

  // Sort devices by usage
  macList.sort((a, b) => totals[b].usage - totals[a].usage);

  // Generate CSV header
  macList.forEach(mac => {
    const deviceName = devices[mac].slice(0, 10);
    const usageMB = Math.round(totals[mac].usage / 1024 / 1024);
    csvData += `${deviceName}_${usageMB}MB,`;
  });
  csvData = csvData.slice(0, -1) + '\n';

  // Generate CSV data points
  let startPoint = 0;
  rawData.forEach(entry => {
    if (entry.data) {
      const startTime = new Date(entry.startTime).getTime();
      const endTime = new Date(entry.endTime).getTime();
      const diff = endTime - startTime;
      const mid = startTime + diff / 2;
      
      if (startPoint === 0) {
        startPoint = Math.floor(mid / 1000 / 60 / 60) - 1;
      }
      
      csvData += Math.floor(mid / 1000 / 60 / 60) - startPoint + ',';
      
      macList.forEach(mac => {
        if (entry.data[mac]) {
          let usage = entry.data[mac].usage;
          const usageNum = parseFloat(usage);
          
          if (usage.includes('K')) {
            usage = usageNum * 1024;
          } else if (usage.includes('M')) {
            usage = usageNum * 1024 * 1024;
          } else if (usage.includes('G')) {
            usage = usageNum * 1024 * 1024 * 1024;
          } else {
            usage = usageNum;
          }
          
          const rate = Math.round(usage / 1024 / 1024 / (diff / 1000 / 60)) || 0;
          csvData += rate + ',';
        } else {
          csvData += '0,';
        }
      });
      
      csvData = csvData.slice(0, -1) + '\n';
    }
  });

  return {
    csvData,
    total,
    lastUpdated: latestEntry.endTime || new Date().toISOString(),
    devices: macList.map(mac => ({
      mac,
      name: devices[mac],
      usage: totals[mac].usage,
      usageMB: Math.round(totals[mac].usage / 1024 / 1024)
    }))
  };
}

// API Routes

// Get usage data for frontend
app.get('/api/usage', (req, res) => {
  try {
    const rawData = readUsageData();
    const processedData = processUsageData(rawData);
    res.json(processedData);
  } catch (error) {
    console.error('Error processing usage data:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// Get raw usage data
app.get('/api/usage/raw', (req, res) => {
  try {
    const data = readUsageData();
    res.json(data);
  } catch (error) {
    console.error('Error reading raw usage data:', error);
    res.status(500).json({ error: 'Failed to fetch raw data' });
  }
});

// Trigger manual scraping
app.post('/api/scrape', async (req, res) => {
  try {
    console.log('Manual scraping triggered via API');
    
    const startTime = new Date().toISOString();
    const rawData = await scrapeWebsite();
    const endTime = new Date().toISOString();
    
    // Filter out devices with 0 usage to reduce file size
    const filteredData = {};
    Object.entries(rawData).forEach(([mac, deviceInfo]) => {
      const usage = deviceInfo.usage;
      // Keep only devices with non-zero usage
      if (usage !== "0" && usage !== 0 && parseFloat(usage) > 0) {
        filteredData[mac] = deviceInfo;
      }
    });
    
    const result = {
      timestamp: Date.now().toString(),
      startTime,
      endTime,
      data: filteredData
    };
    
    // Save to file with optimized file management
    const maxEntries = parseInt(process.env.MAX_ENTRIES) || 4320; // 30 days of 10-min intervals
    let existingData = readUsageData();
    existingData.push(result);
    
    // Keep only last N entries
    if (existingData.length > maxEntries) {
      const entriesToRemove = existingData.length - maxEntries;
      existingData.splice(0, entriesToRemove);
    }
    
    // Write file atomically to prevent corruption during reads
    const tempFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(existingData, null, 2));
    fs.renameSync(tempFile, DATA_FILE);
    
    const activeDevices = Object.keys(filteredData).length;
    const totalDevices = Object.keys(rawData).length;
    
    res.json({ 
      success: true, 
      message: 'Scraping completed successfully',
      data: result,
      totalEntries: existingData.length,
      devicesFiltered: `${activeDevices}/${totalDevices} devices with usage > 0`
    });
  } catch (error) {
    console.error('Error during manual scraping:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get server status
app.get('/api/status', (req, res) => {
  const data = readUsageData();
  const lastEntry = data.length > 0 ? data[data.length - 1] : null;
  const maxEntries = parseInt(process.env.MAX_ENTRIES) || 4320; // 30 days of 10-min intervals
  const scrapeInterval = process.env.SCRAPE_INTERVAL || '*/10 * * * *';
  
  res.json({
    status: 'running',
    version: '1.0.0',
    uptime: process.uptime(),
    lastScrape: lastEntry ? lastEntry.endTime : null,
    totalEntries: data.length,
    maxEntries: maxEntries,
    nextScheduledScrape: scrapeInterval === '*/10 * * * *' ? 'Every 10 minutes' : scrapeInterval,
    dataRetention: `${Math.floor(maxEntries * 10 / 60 / 24)} days (${maxEntries} entries)`,
    fileSize: fs.existsSync(DATA_FILE) ? `${(fs.statSync(DATA_FILE).size / 1024 / 1024).toFixed(2)} MB` : '0 MB'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve the Next.js app static files
const outDir = path.join(__dirname, '..', 'out');

// Check if out directory exists
if (fs.existsSync(outDir)) {
  // Serve static files from the Next.js build
  app.use(express.static(outDir));
  
  // Catch-all handler for client-side routing (only for non-API routes)
  app.get('*', (req, res) => {
    // Don't catch API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = path.join(outDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(503).send(`
        <html>
          <body>
            <h1>Frontend Not Built</h1>
            <p>Please build the frontend first:</p>
            <pre>npm run build</pre>
            <p>Then restart the server.</p>
          </body>
        </html>
      `);
    }
  });
} else {
  // Fallback when frontend is not built
  app.get('*', (req, res) => {
    // Don't catch API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.status(503).send(`
      <html>
        <body>
          <h1>Frontend Not Built</h1>
          <p>Please build the frontend first:</p>
          <pre>npm run build</pre>
          <p>Then restart the server.</p>
        </body>
      </html>
    `);
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Schedule automatic scraping (every 10 minutes)
const scheduleEnabled = process.env.DISABLE_CRON !== 'true';
const maxEntries = parseInt(process.env.MAX_ENTRIES) || 4320; // 30 days of 10-min intervals (30 * 24 * 6)
const scrapeInterval = process.env.SCRAPE_INTERVAL || '*/10 * * * *'; // Every 10 minutes

if (scheduleEnabled) {
  console.log('🕒 Setting up automatic scraping schedule (every 10 minutes)...');
  cron.schedule(scrapeInterval, async () => {
    try {
      console.log('🤖 Running scheduled scraping...');
      
      const startTime = new Date().toISOString();
      const rawData = await scrapeWebsite();
      const endTime = new Date().toISOString();
      
      // Filter out devices with 0 usage to reduce file size
      const filteredData = {};
      Object.entries(rawData).forEach(([mac, deviceInfo]) => {
        const usage = deviceInfo.usage;
        // Keep only devices with non-zero usage
        if (usage !== "0" && usage !== 0 && parseFloat(usage) > 0) {
          filteredData[mac] = deviceInfo;
        }
      });
      
      const result = {
        timestamp: Date.now().toString(),
        startTime,
        endTime,
        data: filteredData
      };
      
      // Save to file with optimized file management
      let existingData = readUsageData();
      existingData.push(result);
      
      // Keep only last N entries (configurable, default 30 days of 10-min intervals)
      if (existingData.length > maxEntries) {
        const entriesToRemove = existingData.length - maxEntries;
        existingData.splice(0, entriesToRemove);
        console.log(`📁 Cleaned up ${entriesToRemove} old entries, keeping last ${maxEntries}`);
      }
      
      // Write file atomically to prevent corruption during reads
      const tempFile = DATA_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(existingData, null, 2));
      fs.renameSync(tempFile, DATA_FILE);
      
      const activeDevices = Object.keys(filteredData).length;
      const totalDevices = Object.keys(rawData).length;
      
      console.log(`✅ Scheduled scraping completed successfully (${existingData.length} total entries)`);
      console.log(`📱 Active devices: ${activeDevices}/${totalDevices} with usage > 0`);
    } catch (error) {
      console.error('❌ Scheduled scraping failed:', error);
    }
  }, {
    timezone: process.env.TIMEZONE || "Africa/Cairo"
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/usage - Get processed usage data`);
  console.log(`   GET  http://localhost:${PORT}/api/usage/raw - Get raw usage data`);
  console.log(`   POST http://localhost:${PORT}/api/scrape - Trigger manual scraping`);
  console.log(`   GET  http://localhost:${PORT}/api/status - Get server status`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
  
  const maxEntries = parseInt(process.env.MAX_ENTRIES) || 4320; // 30 days of 10-min intervals
  const scrapeInterval = process.env.SCRAPE_INTERVAL || '*/10 * * * *';
  
  if (scheduleEnabled) {
    console.log(`⏰ Automatic scraping: Enabled (${scrapeInterval === '*/10 * * * *' ? 'every 10 minutes' : scrapeInterval})`);
    console.log(`📁 Data retention: ${Math.floor(maxEntries * 10 / 60 / 24)} days (${maxEntries} entries max)`);
  } else {
    console.log(`⏰ Automatic scraping: Disabled (DISABLE_CRON=true)`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
