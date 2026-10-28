/* Measure the real layout: viewport, shell, map canvas. CDP via puppeteer-core. */
import puppeteer from "puppeteer-core";

const URL = process.argv[2] || "http://localhost:5174/";
const CHROME = "/usr/bin/google-chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--enable-unsafe-swiftshader",
    "--window-size=1440,900",
    "--no-first-run",
    "--disable-extensions",
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 810 });
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 3500)); // let map settle

  const m = await page.evaluate(() => {
    const g = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        sel,
        w: Math.round(r.width),
        h: Math.round(r.height),
        x: Math.round(r.x),
        y: Math.round(r.y),
        display: getComputedStyle(el).display,
        position: getComputedStyle(el).position,
      };
    };
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      root: g("#root"),
      shell: g(".app-shell"),
      sidebar: g(".sidebar"),
      mapWrap: g(".map-wrap"),
      mapDiv: g(".map"),
      canvas: g(".maplibregl-canvas"),
      canvases: document.querySelectorAll("canvas").length,
    };
  });
  console.log(JSON.stringify(m, null, 2));
  await page.screenshot({ path: "/tmp/recompass-measured.png" });
  console.log("screenshot -> /tmp/recompass-measured.png");

  // narrower window behavior
  await page.setViewport({ width: 700, height: 810 });
  await new Promise((r) => setTimeout(r, 1500));
  const m2 = await page.evaluate(() => {
    const el = document.querySelector(".maplibregl-canvas");
    const wrap = document.querySelector(".map-wrap");
    const r = el?.getBoundingClientRect();
    const wr = wrap?.getBoundingClientRect();
    return { canvas: r && { w: Math.round(r.width), h: Math.round(r.height) }, wrap: wr && { w: Math.round(wr.width), h: Math.round(wr.height) } };
  });
  console.log("narrow:", JSON.stringify(m2));
} finally {
  await browser.close();
}
