import { chromium } from "playwright";

async function inspect() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  console.log("Navigating to http://localhost:8080/auth");
  const res = await page.goto("http://localhost:8080/auth", { waitUntil: "networkidle" });
  console.log("Status:", res?.status());
  console.log("URL:", page.url());
  console.log("Title:", await page.title());
  const content = await page.content();
  console.log("HTML length:", content.length);
  console.log("Full HTML snippet:\n", content.slice(0, 1500));
  await browser.close();
}

inspect().catch(console.error);
