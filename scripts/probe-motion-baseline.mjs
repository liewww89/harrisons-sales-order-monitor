import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("artifacts/motion-refinement", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.addInitScript(() => {
    window.__entrances = [];
    document.addEventListener("animationstart", (event) => {
      if (event.animationName === "card-enter")
        window.__entrances.push({
          at: performance.now(),
          loading: Boolean(document.querySelector(".metric-skeleton")),
        });
    });
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let fetched = false;
  await page.route(
    "https://hiring.harrisons.my/api/mock/sales-orders?**",
    async (route) => {
      const response = await route.fetch();
      fetched = true;
      await gate;
      await route.fulfill({ response }).catch(() => {});
    },
  );
  await page.goto(
    "https://harrisons-sales-order-monitor-enhan.vercel.app/#overview",
  );
  await page.waitForFunction(
    () => document.querySelectorAll(".metric-skeleton").length === 5,
  );
  await new Promise((resolve) => setTimeout(resolve, 800)); // Disclosed slow-response reproduction only.
  const before = await page.evaluate(() => ({
    events: window.__entrances,
    activeMetricAnimations: [...document.querySelectorAll(".metric")].flatMap(
      (node) => node.getAnimations(),
    ).length,
  }));
  release();
  await page
    .locator(".metric-value dd")
    .getByText("998,244.30", { exact: true })
    .waitFor();
  const after = await page.evaluate(() => ({
    events: window.__entrances,
    activeMetricAnimations: [...document.querySelectorAll(".metric")].flatMap(
      (node) => node.getAnimations(),
    ).length,
    visibleValues: [...document.querySelectorAll(".metric dd")].map(
      (node) => node.textContent,
    ),
  }));
  await page.screenshot({
    path: "artifacts/motion-refinement/baseline-after-data.png",
  });
  const proof = { forwardedRealApiResponse: fetched, before, after };
  await writeFile(
    "artifacts/motion-refinement/baseline.json",
    JSON.stringify(proof, null, 2),
  );
  console.log(JSON.stringify(proof, null, 2));
} finally {
  await browser.close();
}
