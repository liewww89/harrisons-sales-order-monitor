import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const API = "https://hiring.harrisons.my/api/mock/sales-orders";
const headers = { "x-assessment-key": "hssb-assessment-mock-2026" };
const amount = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
const count = (value: number) => new Intl.NumberFormat("en-MY").format(value);

async function api(request: APIRequestContext, query = "") {
  const response = await request.get(`${API}${query}`, { headers });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function loaded(page: Page) {
  await expect(page.locator(".order-results")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(
    page.getByRole("button", { name: "Refresh orders" }),
  ).toBeEnabled();
}

async function resultCount(page: Page, total: number) {
  await loaded(page);
  await expect(page.locator(".result-count")).toHaveText(
    `${count(total)} ${total === 1 ? "order" : "orders"}`,
  );
}

test("initial browser integration matches live API rows, metadata and global summary", async ({
  page,
  request,
}) => {
  const [expected, meta] = await Promise.all([
    api(request, "?page=1&pageSize=25"),
    api(request, "/meta"),
  ]);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#orders");
  await resultCount(page, expected.total);
  await expect(page.locator("tbody tr")).toHaveCount(25);
  await expect(page.locator("tbody tr").first()).toContainText(
    expected.data[0].SalesId,
  );
  await expect(page.locator("tbody tr").first()).toContainText(
    amount(expected.data[0].HAR_TotalSOAmount),
  );
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".metric").nth(0)).toContainText(
    count(expected.summary.total_orders),
  );
  await expect(page.locator(".metric").nth(1)).toContainText(
    count(expected.summary.open_orders),
  );
  await expect(page.locator(".metric").nth(2)).toContainText(
    count(expected.summary.invoiced_orders + expected.summary.delivered_orders),
  );
  await expect(page.locator(".metric").nth(3)).toContainText(
    count(expected.summary.cancelled_orders),
  );
  await expect(page.locator(".metric-value")).toContainText(
    amount(expected.summary.total_order_value),
  );
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Sales orders", exact: true })
    .click();
  await expect(
    page.getByLabel("Branch / site", { exact: true }).locator("option"),
  ).toHaveCount(meta.facets.sites.length + 1);
  await expect(
    page.getByLabel("Order status", { exact: true }).locator("option"),
  ).toHaveCount(meta.facets.statuses.length + 1);
  await expect(
    page.getByRole("button", { name: "Previous", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("All orders · unaffected by filters"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("search is debounced and uses q while retaining global dashboard scope", async ({
  page,
  request,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  const searches: string[] = [];
  page.on("request", (r) => {
    if (r.url().startsWith(API + "?") && new URL(r.url()).searchParams.has("q"))
      searches.push(new URL(r.url()).searchParams.get("q")!);
  });
  await page.getByLabel("Search orders", { exact: true }).fill("Si");
  await page.getByLabel("Search orders", { exact: true }).fill("Siti");
  const expected = await api(request, "?page=1&pageSize=25&q=Siti");
  await resultCount(page, expected.total);
  expect(searches).toEqual(["Siti"]);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".metric").first()).toContainText("1,200");
  await expect(page.locator(".metric-value")).toContainText("998,244.30");
});

test("branch, status, combined search and clear filters agree with live API", async ({
  page,
  request,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  await page.getByLabel("Branch / site", { exact: true }).selectOption("B20");
  await resultCount(page, (await api(request, "?site=B20")).total);
  for (const row of await page.locator("tbody tr").all())
    await expect(row.locator(".branch")).toHaveText("B20");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await loaded(page);
  await page
    .getByLabel("Order status", { exact: true })
    .selectOption("Delivered");
  await resultCount(page, (await api(request, "?status=Delivered")).total);
  for (const row of await page.locator("tbody tr").all())
    await expect(row.locator(".status")).toHaveText("Delivered");
  await page.getByLabel("Branch / site", { exact: true }).selectOption("B20");
  await page
    .getByLabel("Order status", { exact: true })
    .selectOption("Open order");
  await page.getByLabel("Search orders", { exact: true }).fill("Siti");
  const expected = await api(
    request,
    "?page=1&pageSize=25&site=B20&status=Open%20order&q=Siti",
  );
  await resultCount(page, expected.total);
  await expect(page.locator("tbody tr")).toHaveCount(expected.total);
  for (const row of await page.locator("tbody tr").all()) {
    await expect(row.locator(".branch")).toHaveText("B20");
    await expect(row.locator(".status")).toHaveText("Open order");
    await expect(row.locator(".customer")).toContainText("Siti");
  }
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await resultCount(page, 1200);
  await expect(page.getByLabel("Search orders", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Branch / site", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Order status", { exact: true })).toHaveValue(
    "",
  );
});

test("pagination, last boundary, and page reset for every filter", async ({
  page,
  request,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await loaded(page);
  await expect(page.getByText("Page 2 of 48", { exact: true })).toBeVisible();
  const secondPage = await api(request, "?page=2&pageSize=25");
  await expect(page.locator("tbody tr").first()).toContainText(
    secondPage.data[0].SalesId,
  );
  await expect(page.getByText("Showing 26–50 of 1,200 orders")).toBeVisible();
  await page.getByLabel("Search orders", { exact: true }).fill("Siti");
  await resultCount(page, (await api(request, "?q=Siti")).total);
  await expect(page.locator(".page-number")).toContainText("Page 1");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await loaded(page);
  await page.getByLabel("Branch / site", { exact: true }).selectOption("B20");
  await loaded(page);
  await expect(page.locator(".page-number")).toContainText("Page 1");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await loaded(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await loaded(page);
  await page
    .getByLabel("Order status", { exact: true })
    .selectOption("Cancelled");
  await resultCount(page, 120);
  await expect(page.getByText("Page 1 of 5", { exact: true })).toBeVisible();
  for (let n = 2; n <= 5; n++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await loaded(page);
    await expect(
      page.getByText(`Page ${n} of 5`, { exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("Showing 101–120 of 120 orders")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(20);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await loaded(page);
  await expect(page.getByText("Page 4 of 5", { exact: true })).toBeVisible();
});

test("empty results provide an effective clear-filters action", async ({
  page,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  await page
    .getByLabel("Search orders", { exact: true })
    .fill("zzzz-no-match-54321");
  await resultCount(page, 0);
  await expect(
    page.getByRole("heading", { name: "No matching orders" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Previous", exact: true }),
  ).toBeDisabled();
  await page
    .locator(".empty-state")
    .getByRole("button", { name: "Clear filters" })
    .click();
  await resultCount(page, 1200);
});

test("simulated HTTP failure is explicit and retry restores real API results", async ({
  page,
}) => {
  let fail = true;
  await page.route(`${API}?**`, (route) =>
    fail
      ? route.fulfill({
          status: 503,
          body: '{"error":"Simulated test failure"}',
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
        })
      : route.continue(),
  );
  await page.goto("/#orders");
  await expect(
    page.getByRole("heading", { name: "Orders could not be loaded" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("HTTP 503");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(page.locator(".result-count")).toHaveText("Unavailable");
  fail = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await resultCount(page, 1200);
});

test("metadata failure disables dependent controls and can be retried independently", async ({
  page,
}) => {
  let fail = true;
  await page.route(`${API}/meta`, (route) =>
    fail
      ? route.fulfill({
          status: 503,
          body: "{}",
          headers: { "access-control-allow-origin": "*" },
        })
      : route.continue(),
  );
  await page.goto("/#orders");
  await resultCount(page, 1200);
  await expect(
    page.getByRole("heading", {
      name: "Branch and status filters unavailable",
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Branch / site", { exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Order status", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Search orders", { exact: true })).toBeEnabled();
  fail = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByLabel("Branch / site", { exact: true })).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("slow earlier search cannot overwrite newer rows, counts or active filters", async ({
  page,
  request,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  let startedSlow = false;
  let slowSettled = false;
  let releaseSlow: () => void = () => {};
  const slowGate = new Promise<void>((resolve) => {
    releaseSlow = resolve;
  });
  await page.route(`${API}?**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("q") === "Siti") {
      // Forward to the real API, but deliberately hold the old response.
      const response = await route.fetch();
      startedSlow = true;
      await slowGate;
      await route.fulfill({ response }).catch(() => {});
      slowSettled = true;
    } else await route.continue();
  });
  await page.getByLabel("Search orders", { exact: true }).fill("Siti");
  await expect.poll(() => startedSlow).toBeTruthy();
  await page.getByLabel("Search orders", { exact: true }).fill("John");
  const expected = await api(request, "?page=1&pageSize=25&q=John");
  await resultCount(page, expected.total);
  releaseSlow();
  await expect.poll(() => slowSettled).toBeTruthy();
  await expect(page.locator("tbody tr").first()).toContainText(
    expected.data[0].SalesId,
  );
  await expect(page.locator(".active-filters")).toContainText("John");
  for (const row of await page.locator("tbody tr").all())
    await expect(row.locator(".customer")).toContainText("John");
});

test("keyboard access and responsive layouts preserve required fields without page overflow", async ({
  page,
}) => {
  await page.goto("/#orders");
  await loaded(page);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to orders" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    const row = page.locator("tbody tr").first();
    for (const field of [
      ".order-id",
      ".customer",
      ".branch",
      ".order-date",
      ".order-status",
      ".amount",
    ])
      await expect(row.locator(field)).toBeVisible();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByLabel("Search orders", { exact: true })).toBeVisible();
});
