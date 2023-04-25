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

  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  await page.goto(process.env.URL);


  const buttonClick = async (selector) => {
    await page.waitForSelector(selector);
    await delay(500);
    await page.evaluate((btnSelector) => {document.querySelector(btnSelector).click();}, selector);
  }

  try {
    await page.waitForSelector(selectors.passwordField);
    await page.type(selectors.passwordField, process.env.PASSWORD);
    await buttonClick(selectors.loginButton);
    try {
      await buttonClick(selectors.confirmButton);
    } catch (error) {
      console.log("no confirm", error);
    }
    await buttonClick(selectors.advancedButton);
    await buttonClick(selectors.button1);
    await buttonClick(selectors.button2);
  
  
    await page.waitForSelector("#traffic-stat > tbody > tr:nth-child(1)");
  
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
