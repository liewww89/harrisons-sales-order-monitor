import { expect, test, type Page } from "@playwright/test";

const API = "https://hiring.harrisons.my/api/mock/sales-orders";
declare global {
  interface Window {
    __cardEntries: { at: number; loading: boolean }[];
    __samples: {
      at: number;
      opacity: number;
      y: number;
      donut: number;
      value: string;
    }[];
  }
}

async function observe(page: Page) {
  await page.addInitScript(() => {
    window.__cardEntries = [];
    window.__samples = [];
    document.addEventListener("animationstart", (event) => {
      if (event.animationName === "card-enter")
        window.__cardEntries.push({
          at: performance.now(),
          loading: Boolean(document.querySelector(".metric-skeleton")),
        });
    });
  });
}

test("slow real response starts natural card motion only after data; final layout is stable and replay is controlled", async ({
  page,
}) => {
  await observe(page);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started = false;
  await page.route(`${API}?**`, async (route) => {
    const response = await route.fetch();
    started = true;
    await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.goto("/");
  await expect.poll(() => started).toBeTruthy();
  await expect(page.locator(".metric-skeleton")).toHaveCount(5);
  const loadingHeight = await page
    .locator(".metrics")
    .evaluate((node) => node.getBoundingClientRect().height);
  // A slow network hold is test-only. Animation time is never scrubbed/paused.
  await page.waitForTimeout(850);
  expect(await page.evaluate(() => window.__cardEntries)).toEqual([]);
  await page.evaluate(() => {
    const began = performance.now();
    const sample = () => {
      const metric = document.querySelector(".metric-ready");
      const mask = document.querySelector(".donut mask circle");
      if (metric && mask) {
        const style = getComputedStyle(metric);
        window.__samples.push({
          at: performance.now(),
          opacity: Number(style.opacity),
          y:
            style.transform === "none"
              ? 0
              : new DOMMatrixReadOnly(style.transform).m42,
          donut: Number.parseFloat(getComputedStyle(mask).strokeDashoffset),
          value: document.querySelector(".metric-value dd")!.textContent!,
        });
      }
      if (performance.now() - began < 1600) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  release();
  await expect(page.locator(".metric-value dd")).toHaveText("998,244.30");
  await expect
    .poll(() => page.evaluate(() => window.__cardEntries.length))
    .toBe(5);
  expect(
    await page.evaluate(() =>
      window.__cardEntries.every((entry) => !entry.loading),
    ),
  ).toBeTruthy();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__samples.some(
          (sample) =>
            sample.opacity > 0.61 &&
            sample.opacity < 0.99 &&
            sample.y > 0.1 &&
            sample.donut > 1 &&
            sample.donut < 99,
        ),
      ),
    )
    .toBeTruthy();
  await expect(page.locator(".metric").first()).toHaveCSS("transform", "none");
  await expect(page.locator(".metric").last()).toHaveCSS("opacity", "1");
  await expect(page.locator(".donut mask circle")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  const samples = await page.evaluate(() => window.__samples);
  expect(samples.every((sample) => sample.value === "998,244.30")).toBeTruthy();
  const peak = Math.max(...samples.map((sample) => sample.donut));
  expect(peak).toBeGreaterThan(90);
  expect(samples.at(-1)!.donut).toBe(0);
  const fromPeak = samples.slice(
    samples.findIndex((sample) => sample.donut === peak),
  );
  expect(
    fromPeak.every(
      (sample, index) =>
        index === 0 || sample.donut <= fromPeak[index - 1].donut,
    ),
  ).toBeTruthy();
  const finalHeight = await page
    .locator(".metrics")
    .evaluate((node) => node.getBoundingClientRect().height);
  expect(Math.abs(finalHeight - loadingHeight)).toBeLessThanOrEqual(1);
  await page.locator(".legend-item").first().hover();
  await page.locator(".legend-item").first().focus();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.__cardEntries.length)).toBe(5);
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await page.getByLabel("Search orders", { exact: true }).fill("Siti");
  await expect(page.locator(".result-count")).toHaveText("120 orders");
  expect(await page.evaluate(() => window.__cardEntries.length)).toBe(5);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__cardEntries.length))
    .toBe(10);
  await expect(page.locator(".metric").last()).toHaveCSS("opacity", "1");
});

test("preference change during natural playback cancels draw and reveals all values immediately", async ({
  page,
}) => {
  await observe(page);
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .querySelector(".donut mask circle")
            ?.getAnimations()
            .filter((a) => a.playState === "running").length ?? 0,
      ),
    )
    .toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".metric").last()).toHaveCSS("opacity", "1");
  await expect(page.locator(".metric").first()).toHaveCSS("transform", "none");
  await expect(page.locator(".donut mask circle")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  expect(
    await page
      .locator(".donut mask circle")
      .evaluate((node) => node.getAnimations().length),
  ).toBe(0);
  await expect(page.locator(".metric-value dd")).toHaveText("998,244.30");
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".metric").last()).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("StrictMode effect replay or production mount owns at most one draw; unavailable animation stays usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".metric-value dd")).toHaveText("998,244.30");
  const draws = await page
    .locator(".donut mask circle")
    .evaluate((node) => node.getAnimations().length);
  expect(draws).toBeLessThanOrEqual(1);
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".metric-value dd")).toHaveText("998,244.30");
  await expect(page.locator(".donut mask circle")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await page.addInitScript(() => {
    Element.prototype.animate = () => {
      throw new Error("Test-only unavailable animation engine");
    };
  });
  await page.reload();
  await expect(page.locator(".metric-value dd")).toHaveText("998,244.30");
  await expect(page.locator(".donut mask circle")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await expect(page.locator(".legend-item").first()).toBeEnabled();
  expect(errors).toEqual([]);
});
