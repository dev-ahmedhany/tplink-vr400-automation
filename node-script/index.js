const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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
    headless: false,
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

    const finalResult = {};
    result.filter((i) => i.length === 5).map((item) => {
      finalResult[item[2]] = { usage: item[4], name: item[1] || "null" };
    });

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

async function main() {
  try {
    console.log('🚀 Starting TP-Link VR400 scraper...');
    
    const startTime = new Date().toISOString();
    console.log(`⏰ Start time: ${startTime}`);
    
    // Run the scraping
    const data = await scrapeWebsite();
    
    const endTime = new Date().toISOString();
    console.log(`⏰ End time: ${endTime}`);
    
    const result = {
      timestamp: Date.now().toString(),
      startTime,
      endTime,
      data
    };
    
    // Display results
    console.log('\n📊 Usage Data:');
    console.log('==============');
    Object.entries(data).forEach(([mac, info]) => {
      console.log(`Device: ${info.name} (${mac})`);
      console.log(`Usage: ${info.usage}`);
      console.log('---');
    });
    
    // Save to file
    const outputDir = path.join(__dirname, 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = process.env.OUTPUT_FILE || path.join(outputDir, 'usage-data.json');
    
    // Read existing data if file exists
    let existingData = [];
    if (fs.existsSync(outputFile)) {
      try {
        const fileContent = fs.readFileSync(outputFile, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        console.warn(`⚠️  Could not read existing data: ${error}`);
      }
    }
    
    // Add new result
    existingData.push(result);
    
    // Keep only last 100 entries to prevent file from growing too large
    if (existingData.length > 100) {
      existingData = existingData.slice(-100);
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));
    console.log(`\n💾 Data saved to: ${outputFile}`);
    
    console.log('\n✅ Scraping completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during scraping:');
    console.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { scrapeWebsite, main };
