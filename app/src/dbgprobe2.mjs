import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: false,
  args: ["--no-sandbox","--disable-gpu","--enable-unsafe-swiftshader","--no-first-run","--disable-extensions"],
});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
try {
  const page = await browser.newPage();
  const logs=[];
  page.on("console", m => logs.push(m.text().slice(0,300)));
  page.on("pageerror", e => logs.push("PAGEERROR: "+e.message.slice(0,300)));
  await page.setViewport({ width: 1440, height:  810 });
  await page.goto("http://localhost:5199/recompass_map/", { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(5000);
  logs.length=0;
  await page.evaluate(() => document.querySelector(".brand .icon-btn").click());
  await sleep(7000);
  console.log("--- after toggle ---");
  logs.filter(l=>l.includes("[dbg]")||l.toLowerCase().includes("error")).forEach(l=>console.log(" ", l));
  const st = await page.evaluate(() => {
    const map = window.__map;
    return JSON.stringify({
      myLayers: map.getStyle().layers.map(l=>l.id).filter(id=>id.includes("plants")||id==="awarded"||["protected_areas","kba","mpa","land_deals","land_deal_sites"].includes(id)),
      sources: Object.keys(map.getStyle().sources),
    });
  });
  console.log("state:", st);
} finally { await browser.close(); }
