import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.APP_URL || "http://127.0.0.1:5174";
await mkdir("artifacts/motion", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const result = animate.apply(this, args);
      if (this instanceof SVGCircleElement)
        window.__capturedDonutAnimation = result;
      return result;
    };
  });
  await page.goto(origin);
  await page.waitForFunction(() => Boolean(window.__capturedDonutAnimation));
  // Scrub the actual browser-created draw animation, using real API summary.
  // This changes QA playback time only; production source adds no waits.
  for (const time of [0, 100, 550]) {
    await page.evaluate((currentTime) => {
      const animation = window.__capturedDonutAnimation;
      animation.pause();
      animation.currentTime = currentTime;
    }, time);
    await page
      .locator(".distribution")
      .screenshot({
        path: `artifacts/motion/donut-${time}ms.png`,
        animations: "allow",
      });
  }
  const proof = await page.evaluate(() => {
    const animation = window.__capturedDonutAnimation;
    return {
      origin: location.origin,
      duration: animation.effect.getTiming().duration,
      frames: animation.effect.getKeyframes(),
      summary: document.querySelector(".distribution-legend").innerText,
    };
  });
  await writeFile(
    "artifacts/motion/proof.json",
    JSON.stringify(proof, null, 2) + "\n",
  );
  console.log(JSON.stringify(proof, null, 2));
} finally {
  await browser.close();
}
