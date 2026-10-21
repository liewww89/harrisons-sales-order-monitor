import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const origin = process.env.APP_URL || "http://127.0.0.1:5174";
await mkdir("docs/screenshots", { recursive: true });
await mkdir("artifacts/layouts", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto("https://harrisons-sales-order-monitor.vercel.app");
  await page.locator("tbody tr").first().waitFor();
  await page.screenshot({
    path: "docs/screenshots/classic-desktop.png",
    fullPage: true,
  });
  for (const view of ["overview", "orders"]) {
    for (const width of [1440, 1024, 768, 390, 375]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
      await page.goto(`${origin}/#${view}`);
      await page.locator("tbody tr").first().waitFor();
      await page
        .getByRole("button", { name: "Refresh orders", exact: true })
        .waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        );
      });
      const name =
        width === 1440
          ? `docs/screenshots/enhanced-${view}-desktop.png`
          : width === 390
            ? `docs/screenshots/enhanced-${view}-mobile.png`
            : `artifacts/layouts/${view}-${width}.png`;
      await page.screenshot({ path: name, fullPage: true });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw new Error(`${view} overflows at ${width}px`);
      console.log(`${view} ${width}px: captured, no page overflow`);
    }
  }
} finally {
  await browser.close();
}
