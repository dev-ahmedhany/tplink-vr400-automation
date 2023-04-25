const puppeteer = require("puppeteer");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto(process.env.URL);
  //set URL = https://

  await page.type("#pc-login-password", process.env.PASSWORD);

  await page.click("#pc-login-btn");


  try {
    await page.waitForSelector("#confirm-yes");
    await page.click("#confirm-yes");
    
  } catch (error) {
    
  }

  await page.waitForSelector("#advanced");
  await delay(500);
  await page.click("#advanced");

  await page.waitForSelector("#menuTree > li:nth-child(13) > a");
  await delay(500);
  await page.click("#menuTree > li:nth-child(13) > a");


  await page.waitForSelector("#menuTree > li:nth-child(13) > ul > li:nth-child(10) > a");
  await delay(500);
  await page.click("#menuTree > li:nth-child(13) > ul > li:nth-child(10) > a");


  await page.waitForSelector("#traffic-stat > tbody > tr:nth-child(1)");

  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll('#traffic-stat tr');
    return Array.from(rows, row => {
      const columns = row.querySelectorAll('td');
      return Array.from(columns, column => column.innerText);
    });
  });

  console.log(result);

  await browser.close();
})();