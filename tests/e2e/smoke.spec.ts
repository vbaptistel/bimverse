import { expect, test } from "@playwright/test";

test("home renderiza arquitetura e formulários", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Dashboard de Propostas")).toBeVisible();
  await expect(page.getByText("Ranking por cliente")).toBeVisible();
});
