import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.APP_URL || "http://127.0.0.1:5174";
const directory = "docs/motion";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: {
    dir: "artifacts/motion-refinement/video",
    size: { width: 1440, height: 1000 },
  },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.addInitScript(() => {
    window.__naturalFrames = [];
    const started = performance.now();
    const sample = () => {
      const metric = document.querySelector(".metric-ready");
      const mask = document.querySelector(".donut mask circle");
      if (metric && mask) {
        const style = getComputedStyle(metric);
        window.__naturalFrames.push({
          at: performance.now(),
          opacity: style.opacity,
          transform: style.transform,
          donutOffset: getComputedStyle(mask).strokeDashoffset,
          value: document.querySelector(".metric-value dd").textContent,
        });
      }
      if (performance.now() - started < 2500) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto(origin);
  await page.locator(".metric-ready").first().waitFor();
  // Timed screenshots observe wall-clock playback; no pause/currentTime/seek.
  const t0 = Date.now();
  const frames = [];
  for (const target of [0, 180, 450, 1050]) {
    const remaining = t0 + target - Date.now();
    if (remaining > 0)
      await new Promise((resolve) => setTimeout(resolve, remaining));
    const path = `${directory}/natural-${target}ms.png`;
    await page.screenshot({ path, animations: "allow" });
    frames.push({ path, elapsedMs: Date.now() - t0 });
  }
  await page.locator(".metric").first().hover();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Refresh orders" }).hover();
  await page.waitForTimeout(700);
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await page.waitForTimeout(400);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page.waitForTimeout(1100);
  await page.locator(".legend-item").filter({ hasText: "Completed" }).hover();
  await page.waitForTimeout(350);
  const samples = await page.evaluate(() => window.__naturalFrames);
  const progressed = samples.some(
    (sample) =>
      Number(sample.opacity) > 0.6 &&
      Number(sample.opacity) < 0.99 &&
      Number.parseFloat(sample.donutOffset) > 0,
  );
  if (!progressed)
    throw new Error(
      "Natural intermediate card/donut progression was not observed.",
    );
  if (errors.length) throw new Error(errors.join("; "));
  await writeFile(
    `${directory}/natural-motion-proof.json`,
    JSON.stringify(
      {
        origin,
        capturedAt: new Date().toISOString(),
        frames,
        naturalIntermediateObserved: progressed,
        pageErrors: errors,
        samples,
      },
      null,
      2,
    ) + "\n",
  );
  const video = page.video();
  await context.close();
  await video.saveAs(`${directory}/enhanced-motion.webm`);
  console.log(
    JSON.stringify({
      origin,
      frames,
      naturalIntermediateObserved: progressed,
      video: `${directory}/enhanced-motion.webm`,
      pageErrors: errors,
    }),
  );
} finally {
  await context.close();
  await browser.close();
}
