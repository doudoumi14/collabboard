import { expect, test, type Page } from "@playwright/test";

// The point of this suite is the multi-client behaviour, so every test drives
// two independent browser contexts — genuinely separate clients, not two tabs
// sharing a session.

async function createBoard(page: Page, name: string) {
  await page.goto("/");
  await page.fill('input[placeholder="Board name"]', name);
  await page.click('button:has-text("Create board")');
  await page.waitForURL(/\/board\//);
  await page.waitForSelector(".column");
  return page.url().split("/board/")[1];
}

async function joinBoard(page: Page, boardId: string) {
  await page.goto("/");
  await page.fill('input[placeholder="Paste a board ID"]', boardId);
  await page.click('button:has-text("Join")');
  await page.waitForURL(/\/board\//);
  await page.waitForSelector(".column");
}

function addCard(page: Page, columnIndex: number, title: string) {
  const input = page
    .locator(".column")
    .nth(columnIndex)
    .locator('input[placeholder="Add a card..."]');
  return input.fill(title).then(() => input.press("Enter"));
}

test.describe("CollabBoard real-time sync", () => {
  test("a new board starts with three default columns", async ({ page }) => {
    await createBoard(page, "Defaults");
    await expect(page.locator(".column")).toHaveCount(3);
    await expect(page.getByText("To do")).toBeVisible();
    await expect(page.getByText("In progress")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();
  });

  test("a card added by one client appears for another without reloading", async ({ browser }) => {
    const alice = await browser.newPage();
    const bob = await browser.newPage();

    const boardId = await createBoard(alice, "Sprint 14");
    await joinBoard(bob, boardId);

    await addCard(alice, 0, "Fix login redirect");

    // No reload anywhere: this must arrive over the socket.
    await expect(bob.locator('.card:has-text("Fix login redirect")')).toBeVisible();

    await alice.close();
    await bob.close();
  });

  test("sync works in both directions", async ({ browser }) => {
    const alice = await browser.newPage();
    const bob = await browser.newPage();

    const boardId = await createBoard(alice, "Two way");
    await joinBoard(bob, boardId);

    await addCard(alice, 0, "From Alice");
    await expect(bob.locator('.card:has-text("From Alice")')).toBeVisible();

    await addCard(bob, 1, "From Bob");
    await expect(alice.locator('.card:has-text("From Bob")')).toBeVisible();

    await alice.close();
    await bob.close();
  });

  test("a new column propagates to other clients", async ({ browser }) => {
    const alice = await browser.newPage();
    const bob = await browser.newPage();

    const boardId = await createBoard(alice, "Columns");
    await joinBoard(bob, boardId);

    await bob.fill('input[placeholder="New column"]', "Blocked");
    await bob.click('button:has-text("Add column")');

    await expect(alice.locator('.column:has-text("Blocked")')).toBeVisible();
    await expect(alice.locator(".column")).toHaveCount(4);

    await alice.close();
    await bob.close();
  });

  test("dragging a card between columns propagates", async ({ browser }) => {
    const alice = await browser.newPage();
    const bob = await browser.newPage();

    const boardId = await createBoard(alice, "Drag");
    await joinBoard(bob, boardId);

    await addCard(alice, 0, "Move me");
    await expect(bob.locator('.card:has-text("Move me")')).toBeVisible();

    await alice.locator('.card:has-text("Move me")').dragTo(alice.locator(".column").nth(2));

    await expect(alice.locator(".column").nth(2).locator(".card")).toHaveCount(1);
    await expect(bob.locator(".column").nth(2).locator(".card")).toHaveCount(1);
    await expect(bob.locator(".column").nth(0).locator(".card")).toHaveCount(0);

    await alice.close();
    await bob.close();
  });

  test("a deletion propagates", async ({ browser }) => {
    const alice = await browser.newPage();
    const bob = await browser.newPage();

    const boardId = await createBoard(alice, "Deletion");
    await joinBoard(bob, boardId);

    await addCard(alice, 0, "Delete me");
    await expect(bob.locator('.card:has-text("Delete me")')).toBeVisible();

    await alice.locator('.card:has-text("Delete me")').locator("button").click();
    await expect(bob.locator('.card:has-text("Delete me")')).toHaveCount(0);

    await alice.close();
    await bob.close();
  });

  test("board state is served from the server, not just held in the client", async ({
    browser,
  }) => {
    const alice = await browser.newPage();
    const boardId = await createBoard(alice, "Durability");
    await addCard(alice, 0, "Persisted card");
    await expect(alice.locator('.card:has-text("Persisted card")')).toBeVisible();

    // A completely fresh client should be handed the same state on join.
    const late = await browser.newPage();
    await joinBoard(late, boardId);
    await expect(late.locator('.card:has-text("Persisted card")')).toBeVisible();

    await alice.close();
    await late.close();
  });

  test("an unknown board id shows a not-found message", async ({ page }) => {
    await page.goto("/board/does-not-exist");
    await expect(page.getByText("Board not found")).toBeVisible();
  });
});
