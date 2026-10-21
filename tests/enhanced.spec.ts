import { expect, test, type Page } from "@playwright/test";

const API = "https://hiring.harrisons.my/api/mock/sales-orders";
const headers = { "x-assessment-key": "hssb-assessment-mock-2026" };
const nav = (page: Page) =>
  page.getByRole("navigation", { name: "Workspace", exact: true });
const loaded = async (page: Page) => {
  await expect(page.locator(".order-results")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh orders" }),
  ).toBeEnabled();
};

declare global {
  interface Window {
    __draws: number;
    __cancelledDraws: number;
    __motionNames: string[];
  }
}

async function recordMotion(page: Page) {
  await page.addInitScript(() => {
    window.__draws = 0;
    window.__cancelledDraws = 0;
    window.__motionNames = [];
    document.addEventListener("animationstart", (event) =>
      window.__motionNames.push(event.animationName),
    );
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (this instanceof SVGCircleElement) {
        window.__draws++;
        animation.addEventListener("cancel", () => window.__cancelledDraws++);
      }
      return animation;
    };
  });
}

test("overview statistics, distribution shares and preview come from the live API", async ({
  page,
  request,
}) => {
  const response = await request.get(`${API}?page=1&pageSize=25`, { headers });
  expect(response.ok()).toBeTruthy();
  const expected = await response.json();
  await page.goto("/");
  await loaded(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await expect(page.locator(".metric")).toHaveCount(5);
  const values = [
    expected.summary.total_orders,
    expected.summary.open_orders,
    expected.summary.invoiced_orders + expected.summary.delivered_orders,
    expected.summary.cancelled_orders,
  ];
  for (const [index, value] of values.entries()) {
    await expect(page.locator(".metric dd").nth(index)).toHaveText(
      value.toLocaleString("en-MY"),
    );
  }
  await expect(page.locator(".metric-value dd")).toHaveText(
    expected.summary.total_order_value.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  );
  await expect(page.locator("tbody tr")).toHaveCount(4);
  for (const [index, order] of expected.data.slice(0, 4).entries()) {
    await expect(page.locator("tbody tr").nth(index)).toContainText(
      order.SalesId,
    );
  }
  for (const [id, value] of [
    ["open", values[1]],
    ["completed", values[2]],
    ["cancelled", values[3]],
  ] as const) {
    await expect(page.locator(`[data-segment="${id}"]`)).toHaveAttribute(
      "data-value",
      String(value),
    );
    const share = Number(
      await page.locator(`[data-segment="${id}"]`).getAttribute("data-share"),
    );
    expect(share).toBeCloseTo((value / values[0]) * 100);
  }
  await expect(
    page.getByRole("heading", { name: "Order preview" }),
  ).toBeVisible();
  await expect(
    page.getByText("All orders · unaffected by filters"),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("Currency unspecified");
});

test("desktop navigation supports keyboard, history, reload and retained active order query", async ({
  page,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  await page.getByLabel("Search orders", { exact: true }).fill("Siti");
  await expect(page.locator(".result-count")).toHaveText("120 orders");
  await page.getByLabel("Branch / site", { exact: true }).selectOption("B20");
  await page
    .getByLabel("Order status", { exact: true })
    .selectOption("Open order");
  await expect(page.locator(".result-count")).toHaveText("6 orders");
  await nav(page).getByRole("link", { name: "Overview" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await expect(page.locator(".preview-section")).toContainText("Siti");
  await expect(page.locator(".metric").first()).toContainText("1,200");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sales orders",
  );
  await expect(page.getByLabel("Search orders", { exact: true })).toHaveValue(
    "Siti",
  );
  await expect(page.getByLabel("Branch / site", { exact: true })).toHaveValue(
    "B20",
  );
  await expect(page.getByLabel("Order status", { exact: true })).toHaveValue(
    "Open order",
  );
  await expect(page.locator(".result-count")).toHaveText("6 orders");
  await page.goForward();
  await expect(
    nav(page).getByRole("link", { name: "Overview" }),
  ).toHaveAttribute("aria-current", "page");
  await page.reload();
  await loaded(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await nav(page)
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await page.reload();
  await loaded(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sales orders",
  );
});

test("mobile navigation remains visible and works with direct links, back and refresh", async ({
  page,
}) => {
  for (const width of [390, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#orders");
    await loaded(page);
    await expect(nav(page)).toBeVisible();
    await nav(page).getByRole("link", { name: "Overview" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Overview",
    );
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Sales orders",
    );
    await page.reload();
    await loaded(page);
    await expect(
      nav(page).getByRole("link", { name: "Sales orders", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});

test("donut and legend have keyboard and touch selection with real values", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await loaded(page);
  const open = page
    .locator(".legend-item")
    .filter({ hasText: "Open / pending" });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(open).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".donut-center strong")).toHaveText("420");
  await expect(open).toHaveCSS("outline-style", "solid");
  const cancelled = page.locator('[data-segment="cancelled"]');
  await cancelled.focus();
  await page.keyboard.press("Space");
  await expect(cancelled).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".donut-center strong")).toHaveText("120");
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
    baseURL: test.info().project.use.baseURL,
  });
  try {
    const phone = await context.newPage();
    await phone.goto("/");
    await loaded(phone);
    const completed = phone
      .locator(".legend-item")
      .filter({ hasText: "Completed" });
    await completed.tap();
    await expect(completed).toHaveAttribute("aria-pressed", "true");
    await expect(phone.locator(".donut-center strong")).toHaveText("660");
    await phone.getByRole("heading", { level: 1 }).tap();
    await expect(completed).toHaveAttribute("aria-pressed", "true");
    await expect(phone.locator(".donut")).toHaveAttribute(
      "data-active",
      "completed",
    );
    await completed.tap();
    await phone.getByRole("heading", { level: 1 }).tap();
    await expect(completed).toHaveAttribute("aria-pressed", "false");
    await expect(phone.locator(".donut-center strong")).toHaveText("1,200");
  } finally {
    await context.close();
  }
});

test("refresh refetches orders and metadata, spins only pending and reports failure before real retry", async ({
  page,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started = false;
  let metaRequests = 0;
  page.on("request", (request) => {
    if (request.url() === `${API}/meta`) metaRequests++;
  });
  await page.route(`${API}?**`, async (route) => {
    await route.fetch(); // A real GET is performed; only the failure is simulated.
    started = true;
    await gate;
    await route.fulfill({
      status: 503,
      body: "{}",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.getByRole("button", { name: "Refresh orders" }).click();
  await expect.poll(() => started).toBeTruthy();
  await expect(page.locator(".refresh-icon")).toHaveCSS(
    "animation-name",
    "request-spin",
  );
  await expect(page.locator(".updated")).toHaveText("Fetching orders…");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  expect(metaRequests).toBe(1);
  release();
  await expect(
    page.getByRole("heading", { name: "Orders could not be loaded" }),
  ).toBeVisible();
  await expect(page.locator(".updated")).toHaveText("Order update failed");
  await expect(page.locator(".refresh-icon")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.unroute(`${API}?**`);
  const response = page.waitForResponse(
    (r) => r.url().startsWith(`${API}?`) && r.status() === 200,
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await response;
  await loaded(page);
  await expect(page.locator(".updated")).toContainText("Received");
});

test("metadata refresh failure is independent of successful orders and retries independently", async ({
  page,
}) => {
  await page.goto("/");
  await loaded(page);
  await page.route(`${API}/meta`, (route) =>
    route.fulfill({
      status: 503,
      body: "{}",
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.getByRole("button", { name: "Refresh orders" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Branch and status filters unavailable",
    }),
  ).toBeVisible();
  await expect(page.locator(".metric").first()).toContainText("1,200");
  await expect(page.locator(".updated")).toContainText("Filters unavailable");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.unroute(`${API}/meta`);
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("normal motion runs, reduced motion skips JavaScript draw and shows final content immediately", async ({
  page,
}) => {
  await recordMotion(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await loaded(page);
  expect(await page.evaluate(() => window.__draws)).toBe(0);
  await expect(page.locator(".metric").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".view-content")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".nav-indicator")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(page.locator(".metric-value dd")).toHaveText("998,244.30");
  await expect(page.locator(".donut mask circle")).toHaveAttribute(
    "stroke-dashoffset",
    "0",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => page.evaluate(() => window.__draws)).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".donut mask circle")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await nav(page)
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await nav(page).getByRole("link", { name: "Overview" }).click();
  expect(await page.evaluate(() => window.__draws)).toBe(1);
  await expect(page.locator(".view-content")).toHaveCSS("opacity", "1");
});

test("card, row, view, indicator and donut motion execute and survive interruption", async ({
  page,
}) => {
  await recordMotion(page);
  await page.goto("/");
  await loaded(page);
  await expect
    .poll(() => page.evaluate(() => window.__draws))
    .toBeGreaterThan(0);
  const names = await page.evaluate(() => window.__motionNames);
  expect(names).toContain("card-enter");
  expect(names).toContain("view-enter");
  expect(names).toContain("row-enter");
  await page.locator(".metric").first().hover();
  await expect(page.locator(".metric").first()).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, -4)",
  );
  await nav(page)
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await expect(page.locator(".nav-indicator")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 52)",
  );
  await page.locator("tbody tr").first().hover();
  await expect(page.locator("tbody tr").first()).toHaveCSS(
    "background-color",
    "rgb(241, 243, 254)",
  );
  for (let index = 0; index < 8; index++) {
    const view = index % 2 === 0 ? "overview" : "orders";
    await page.evaluate((next) => {
      location.hash = next;
    }, view);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      view === "overview" ? "Overview" : "Sales orders",
    );
  }
  await expect(page.locator(".view-content")).toHaveCSS("opacity", "1");
  await expect(page.locator("tbody tr")).toHaveCount(25);
  await page.evaluate(() => {
    location.hash = "overview";
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .querySelector(".donut mask circle")
            ?.getAnimations()
            .some((a) => a.playState === "running") ?? false,
      ),
    )
    .toBeTruthy();
  await page.evaluate(() => {
    location.hash = "orders";
  });
  await expect
    .poll(() => page.evaluate(() => window.__cancelledDraws))
    .toBeGreaterThan(0);
  await expect(page.locator(".donut")).toHaveCount(0);
  await expect(page.locator(".view-content")).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
});

test("table headers remain positioned inside the scrolling container at desktop and tablet widths", async ({
  page,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    const result = await page.locator(".table-scroll").evaluate((container) => {
      container.scrollTop = 0;
      const header = container.querySelector("thead th")!;
      const row = container.querySelector("tbody tr")!;
      const initialRow = row.getBoundingClientRect().top;
      container.scrollTop = 220;
      return {
        scrollTop: container.scrollTop,
        delta: Math.abs(
          header.getBoundingClientRect().top -
            container.getBoundingClientRect().top,
        ),
        rowTravel: initialRow - row.getBoundingClientRect().top,
      };
    });
    expect(result.scrollTop).toBe(220);
    expect(result.delta).toBeLessThanOrEqual(1);
    expect(result.rowTravel).toBeGreaterThan(200);
  }
});

test("long names, large amounts and narrow layouts remain readable without page clipping", async ({
  page,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  // Disclosed DOM-only stress probes. No generated data enters production code.
  await page
    .locator("tbody tr")
    .first()
    .evaluate((row) => {
      row.querySelector(".customer > span")!.textContent =
        "LongCustomerName".repeat(10) + " Sdn Bhd";
      row.querySelector(".amount")!.textContent = "999,999,999,999.99";
    });
  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const name = page.locator("tbody tr").first().locator(".customer > span");
    expect(
      await name.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBeTruthy();
    if (width < 600) {
      const amount = page.locator("tbody tr").first().locator(".amount");
      expect(
        await amount.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      ).toBeTruthy();
      for (const field of [
        ".order-id",
        ".customer",
        ".branch",
        ".order-date",
        ".order-status",
        ".amount",
      ]) {
        await expect(
          page.locator("tbody tr").first().locator(field),
        ).toBeVisible();
      }
    }
  }
});
