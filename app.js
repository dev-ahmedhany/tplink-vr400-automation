require('dotenv').config();
const puppeteer = require("puppeteer");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const selectors = {
    passwordField: "#pc-login-password",
    loginButton: "#pc-login-btn",
    confirmButton: "#confirm-yes",
    advancedButton: "#advanced",
    button1: "#menuTree > li:nth-child(12) > a",
    button2: "#menuTree > li:nth-child(12) > ul > li:nth-child(7) > a",
  }
  const timeToDelay = 1000;

  const browser = await puppeteer.launch({headless: "new",args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({
    width: 1024,
    height: 1024,
    deviceScaleFactor: 1,
  });
  await page.goto(process.env.URL);


  const buttonClick = async (selector,previous) => {
      await page.waitForSelector(selector);
      await delay(timeToDelay);
      await page.click(selector);
  }

  try {
    await page.waitForSelector(selectors.passwordField);
    await delay(timeToDelay);
    await page.type(selectors.passwordField, process.env.PASSWORD,{delay: 100});
    await buttonClick(selectors.loginButton, async () => {
    }
      );
    try {
      await buttonClick(selectors.confirmButton);
    } catch (error) {
      console.log("no confirm", error);
    }
    await buttonClick(selectors.advancedButton , async () => {
      await page.waitForSelector(selectors.passwordField);
        await delay(timeToDelay);
        await page.type(selectors.passwordField, process.env.PASSWORD,{delay: 100});
        await buttonClick(selectors.loginButton);
        try {
          await buttonClick(selectors.confirmButton);
        } catch (error) {
          console.log("no confirm", error);
        }
      }
      );
    await buttonClick(selectors.button1, async () => {
      await buttonClick(selectors.advancedButton, () => {})})

    await buttonClick(selectors.button2, async () => {
      await buttonClick(selectors.button1, () => {})})
  
  
      try {
        await page.waitForSelector("#traffic-stat > tbody > tr:nth-child(1)");
      } catch (error) {
        await buttonClick(selectors.button2, async () => {
          await buttonClick(selectors.button1, () => {})})
      }
  
    const result = await page.evaluate(() => {
      const rows = document.querySelectorAll('#traffic-stat tr');
      return Array.from(rows, row => {
        const columns = row.querySelectorAll('td');
        return Array.from(columns, column => column.innerText);
      });
    });
    const finalResult = {}
    result.filter((i)=>i.length === 5).map((item) => {
      finalResult[item[1]] = item[4]
    })
    console.log(JSON.stringify(finalResult));
  } catch (error) {
    console.log("error",error);
  }

  await browser.close();
})();
