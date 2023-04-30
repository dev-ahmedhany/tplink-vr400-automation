import puppeteer = require("puppeteer");

const delay = (ms:number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async () => {
  const selectors = {
    passwordField: "#pc-login-password",
    loginButton: "#pc-login-btn",
    confirmButton: "#confirm-yes",
    advancedButton: "#advanced",
    button1: "#menuTree > li:nth-child(12) > a",
    button2: "#menuTree > li:nth-child(12) > ul > li:nth-child(7) > a",
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
  await page.setViewport({width: 1024, height: 1024});
  const url = process.env.URL as string;
  if (!url) throw new Error("URL is not defined");
  await page.goto(url);


  const buttonClick = async (selector:string, timeToDelay:number) => {
    await page.waitForSelector(selector);
    await delay(timeToDelay);
    await page.focus(selector);
    await page.click(selector);
  };


  await page.waitForSelector(selectors.passwordField);
  await delay(1000);
  await page.type(selectors.passwordField, process.env.PASSWORD as string,
      {delay: 100});
  await buttonClick(selectors.loginButton, 100);
  try {
    await buttonClick(selectors.confirmButton, 100);
  } catch (error) {
    console.log("no confirm", error);
  }
  await buttonClick(selectors.advancedButton, 1000);
  await buttonClick(selectors.button1, 1000);

  await buttonClick(selectors.button2, 1000);

  await page.waitForSelector("#traffic-stat > tbody > tr:nth-child(1)");

  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll("#traffic-stat tr");
    return Array.from(rows, (row:Element) => {
      const columns = row.querySelectorAll("td");
      return Array.from(columns,
          (column:HTMLTableCellElement) => column.innerText);
    });
  });
  const finalResult = {} as {[key:string]:{usage:string, name:string}};
  result.filter((i)=>i.length === 5).map((item:string[]) => {
    finalResult[item[2]] = {usage: item[4], name: item[1] || "null"};
  });

  await buttonClick(selectors.buttonReset, 100);
  try {
    await buttonClick(selectors.buttonLogout, 100);
  } catch (error) {
    console.log("no reset", error);
  }

  await browser.close();

  return finalResult;
};
