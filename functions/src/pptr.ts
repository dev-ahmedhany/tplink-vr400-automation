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
  };
  const timeToDelay = 1000;

  const browser = await puppeteer.launch({
    headless: true,
    timeout: 20000,
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
  await page.goto(process.env.URL as string);


  const buttonClick = async (selector:string) => {
    await page.waitForSelector(selector, {visible: true});
    await delay(timeToDelay);
    await page.focus(selector);
    await page.click(selector);
  };


  await page.waitForSelector(selectors.passwordField);
  await delay(timeToDelay);
  await page.type(selectors.passwordField, process.env.PASSWORD as string,
      {delay: 100});
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
    const rows = document.querySelectorAll("#traffic-stat tr");
    return Array.from(rows, (row:Element) => {
      const columns = row.querySelectorAll("td");
      return Array.from(columns,
          (column:HTMLTableCellElement) => column.innerText);
    });
  });
  const finalResult = {} as {[key:string]:string};
  result.filter((i)=>i.length === 5).map((item:string[]) => {
    finalResult[item[1]] = item[4];
  });

  await browser.close();

  return finalResult;
};
