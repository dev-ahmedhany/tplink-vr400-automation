const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

// Load environment variables
dotenv.config();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeWebsite() {
  const selectors = {
    passwordField: "#pc-login-password",
    loginButton: "#pc-login-btn",
    confirmButton: "#confirm-yes",
    advancedButton: "#advanced",
    button1: "#menuTree > li:nth-child(13) > a",
    button2: "#menuTree > li:nth-child(13) > ul > li:nth-child(10) > a",
    buttonReset: "#resetAll",
    buttonLogout: "#topLogout",
  };

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    slowMo: 0,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-sandbox",
      "--no-zygote",
      "--window-size=1024,1024",
    ],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024 });
  
  const url = process.env.URL;
  if (!url) {
    throw new Error("URL is not defined. Please set the URL environment variable.");
  }
  
  const password = process.env.PASSWORD;
  if (!password) {
    throw new Error("PASSWORD is not defined. Please set the PASSWORD environment variable.");
  }

  console.log(`Navigating to: ${url}`);
  await page.goto(url);

  const buttonClick = async (selector, timeToDelay) => {
    await page.waitForSelector(selector);
    await delay(timeToDelay);
    await page.focus(selector);
    await page.click(selector);
  };

  try {
    console.log("Logging in...");
    await page.waitForSelector(selectors.passwordField);
    await delay(1000);
    await page.type(selectors.passwordField, password, { delay: 100 });
    await buttonClick(selectors.loginButton, 100);
    
    try {
      await buttonClick(selectors.confirmButton, 100);
    } catch (error) {
      console.log("No confirm button found (this is normal)");
    }

    console.log("Navigating to usage statistics...");
    await buttonClick(selectors.advancedButton, 1000);
    await buttonClick(selectors.button1, 1000);
    await buttonClick(selectors.button2, 1000);

    console.log("Extracting usage data...");
    await page.waitForSelector("#traffic-stat > tbody > tr:nth-child(1)");

    const result = await page.evaluate(() => {
      const rows = document.querySelectorAll("#traffic-stat tr");
      return Array.from(rows, (row) => {
        const columns = row.querySelectorAll("td");
        return Array.from(columns, (column) => column.innerText);
      });
    });

    console.log("result", result);
    

    const finalResult = {};
    const deviceNames = {};
    
    result.filter((i) => i.length === 5).filter((i) => i[4] !== '0').map((item) => {
      const mac = item[2];
      const name = item[1] || "null";
      const usage = item[4];
      
      finalResult[mac] = usage; // Store only usage value
      deviceNames[mac] = name;  // Store device name separately
    });

    // Update devices file only with new device names (never change existing ones)
    const existingDevices = readDevicesData();
    const newDevices = {};
    let hasNewDevices = false;
    
    Object.entries(deviceNames).forEach(([mac, name]) => {
      // Only add if the MAC address doesn't exist in devices.json
      if (!existingDevices[mac]) {
        newDevices[mac] = name;
        hasNewDevices = true;
      }
    });
    
    if (hasNewDevices) {
      const updatedDevices = { ...existingDevices, ...newDevices };
      saveDevicesData(updatedDevices);
      console.log("New device names saved:", newDevices);
    } else {
      console.log("No new device names to save");
    }

    console.log("Final result:", finalResult);
    

    console.log("Resetting statistics...");
    await buttonClick(selectors.buttonReset, 100);
    
    try {
      await buttonClick(selectors.buttonLogout, 100);
    } catch (error) {
      console.log("No logout button found or already logged out");
    }

    await browser.close();
    console.log("Scraping completed successfully");
    return finalResult;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'usage-data.json');
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');

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

// Helper function to read devices data
function readDevicesData() {
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      const data = fs.readFileSync(DEVICES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error reading devices data:', error);
    return {};
  }
}

// Helper function to save devices data
function saveDevicesData(devices) {
  try {
    const tempFile = DEVICES_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(devices, null, 2));
    fs.renameSync(tempFile, DEVICES_FILE);
  } catch (error) {
    console.error('Error saving devices data:', error);
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
  
  // Read device names from separate file
  const deviceNames = readDevicesData();
  
  // Collect all unique devices
  const devices = {};
  const totals = {};
  
  rawData.forEach(entry => {
    if (entry.data) {
      Object.entries(entry.data).forEach(([mac, usage]) => {
        const deviceName = deviceNames[mac] || "Unknown Device";
        if (deviceName !== "null" && deviceName) {
          devices[mac] = deviceName;
          if (!totals[mac]) {
            totals[mac] = { usage: 0, name: deviceName };
          }
        }
      });
    }
  });

  // Calculate totals and generate CSV data
  const macList = Object.keys(devices);
  
  // Process each entry to calculate usage
  rawData.forEach(entry => {
    if (entry.data) {
      macList.forEach(mac => {
        if (entry.data[mac]) {
          let usage = entry.data[mac]; // Now usage is directly the value
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

  // Generate CSV header with timestamp
  let csvData = "timestamp,";
  macList.forEach(mac => {
    const deviceName = devices[mac].slice(0, 10);
    const usageMB = Math.round(totals[mac].usage / 1024 / 1024);
    csvData += `${deviceName}_${usageMB}MB,`;
  });
  csvData = csvData.slice(0, -1) + '\n';

  // Generate CSV data points with actual timestamps
  rawData.forEach(entry => {
    if (entry.data) {
      const startTime = new Date(entry.startTime).getTime();
      const endTime = new Date(entry.endTime).getTime();
      const diff = endTime - startTime;
      const mid = startTime + diff / 2;
      
      // Use actual timestamp instead of relative hours
      csvData += new Date(mid).toISOString() + ',';
      
      macList.forEach(mac => {
        if (entry.data[mac]) {
          let usage = entry.data[mac]; // Now usage is directly the value
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

// Get usage data for frontend with optional time filtering
app.get('/api/usage', (req, res) => {
  try {
    const { startDate, endDate, hours } = req.query;
    const rawData = readUsageData();
    
    // Filter data by time range if provided
    let filteredData = rawData;
    
    if (startDate || endDate || hours) {
      const now = new Date();
      let filterStartTime, filterEndTime;
      
      if (hours) {
        // Filter by last N hours
        filterStartTime = new Date(now.getTime() - (parseInt(hours) * 60 * 60 * 1000));
        filterEndTime = now;
      } else {
        // Filter by date range
        filterStartTime = startDate ? new Date(startDate) : new Date(0);
        filterEndTime = endDate ? new Date(endDate) : now;
      }
      
      filteredData = rawData.filter(entry => {
        const entryTime = new Date(entry.endTime || entry.timestamp);
        return entryTime >= filterStartTime && entryTime <= filterEndTime;
      });
    }
    
    const processedData = processUsageData(filteredData);
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

// Get devices data
app.get('/api/devices', (req, res) => {
  try {
    const devices = readDevicesData();
    res.json(devices);
  } catch (error) {
    console.error('Error reading devices data:', error);
    res.status(500).json({ error: 'Failed to fetch devices data' });
  }
});

// Delete device by MAC address (removes from both usage data and device names)
app.delete('/api/devices/:mac', (req, res) => {
  try {
    const macToDelete = req.params.mac;
    
    if (!macToDelete) {
      return res.status(400).json({ error: 'MAC address is required' });
    }
    
    console.log(`Deleting device with MAC: ${macToDelete}`);
    
    // Read current data
    const usageData = readUsageData();
    const devicesData = readDevicesData();
    
    // Check if device exists
    const deviceExists = devicesData[macToDelete] || 
                        usageData.some(entry => entry.data && entry.data[macToDelete]);
    
    if (!deviceExists) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const deviceName = devicesData[macToDelete] || 'Unknown Device';
    
    // Remove from usage data
    let totalEntriesAffected = 0;
    const cleanedUsageData = usageData.map(entry => {
      if (entry.data && entry.data[macToDelete]) {
        totalEntriesAffected++;
        const { [macToDelete]: removed, ...remainingData } = entry.data;
        return { ...entry, data: remainingData };
      }
      return entry;
    });
    
    // Remove from devices data
    const { [macToDelete]: removedDevice, ...remainingDevices } = devicesData;
    
    // Save updated data atomically
    const tempUsageFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tempUsageFile, JSON.stringify(cleanedUsageData, null, 2));
    fs.renameSync(tempUsageFile, DATA_FILE);
    
    const tempDevicesFile = DEVICES_FILE + '.tmp';
    fs.writeFileSync(tempDevicesFile, JSON.stringify(remainingDevices, null, 2));
    fs.renameSync(tempDevicesFile, DEVICES_FILE);
    
    console.log(`✅ Device deleted: ${deviceName} (${macToDelete})`);
    console.log(`   Removed from ${totalEntriesAffected} usage entries`);
    console.log(`   Remaining devices: ${Object.keys(remainingDevices).length}`);
    
    res.json({
      success: true,
      message: 'Device deleted successfully',
      deletedDevice: {
        mac: macToDelete,
        name: deviceName
      },
      entriesAffected: totalEntriesAffected,
      remainingDevices: Object.keys(remainingDevices).length
    });
    
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete device' 
    });
  }
});

// Trigger manual scraping
app.get('/api/scrape', async (req, res) => {
  try {
    console.log('Manual scraping triggered via API');
    
    const startTime = new Date().toISOString();
    const rawData = await scrapeWebsite();
    const endTime = new Date().toISOString();
    
    const result = {
      timestamp: Date.now().toString(),
      startTime,
      endTime,
      data: rawData
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
    
    const activeDevices = Object.keys(rawData).length;
    const totalDevices = Object.keys(rawData).length;
    
    res.json({ 
      success: true, 
      message: 'Scraping completed successfully',
      data: result,
      totalEntries: existingData.length,
      devicesFiltered: `${activeDevices}/${totalDevices} devices`
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
      
      const result = {
        timestamp: Date.now().toString(),
        startTime,
        endTime,
        data: rawData
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
      
      const activeDevices = Object.keys(rawData).length;
      const totalDevices = Object.keys(rawData).length;
      
      console.log(`✅ Scheduled scraping completed successfully (${existingData.length} total entries)`);
      console.log(`📱 Active devices: ${activeDevices}/${totalDevices} devices`);
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
  console.log(`   GET    http://localhost:${PORT}/api/usage - Get processed usage data`);
  console.log(`   GET    http://localhost:${PORT}/api/usage/raw - Get raw usage data`);
  console.log(`   GET    http://localhost:${PORT}/api/devices - Get device names`);
  console.log(`   DELETE http://localhost:${PORT}/api/devices/:mac - Delete device by MAC address`);
  console.log(`   GET    http://localhost:${PORT}/api/scrape - Trigger manual scraping`);
  console.log(`   GET    http://localhost:${PORT}/api/status - Get server status`);
  console.log(`   GET    http://localhost:${PORT}/health - Health check`);
  
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
