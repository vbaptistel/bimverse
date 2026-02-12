import { expect, test } from "@playwright/test";

test("exclui proposta recebida pela listagem", async ({ page }, testInfo) => {
  const uniqueId = `${testInfo.project.name}-${Date.now()}`;
  const customerName = `E2E Cliente ${uniqueId}`;
  const projectName = `E2E Projeto ${uniqueId}`;

  await page.goto("/clientes");
  await expect(page).toHaveURL(/\/clientes/);

  await page.getByRole("button", { name: "Novo cliente" }).click();

  const customerDialog = page.getByRole("dialog");
  await expect(
    customerDialog.getByRole("heading", { name: "Novo cliente" }),
  ).toBeVisible();
  await customerDialog.getByLabel("Nome do cliente").fill(customerName);
  await customerDialog.getByRole("button", { name: "Criar cliente" }).click();

  await expect(
    page.locator("tbody tr", { hasText: customerName }).first(),
  ).toBeVisible();

  await page.goto("/propostas");
  await page.getByRole("button", { name: "Nova proposta" }).click();

  const proposalDialog = page.getByRole("dialog");
  await expect(
    proposalDialog.getByRole("heading", { name: "Nova Proposta" }),
  ).toBeVisible();

  await proposalDialog.locator("#customerId").click();
  await page.getByRole("option", { name: customerName }).click();

  await proposalDialog.getByLabel("Nome do projeto").fill(projectName);
  await proposalDialog.getByLabel("Valor estimado (BRL)").fill("1000");
  await proposalDialog
    .getByLabel("Descrição do escopo")
    .fill(`Escopo E2E para exclusão ${uniqueId}`);
  await proposalDialog.getByRole("button", { name: "Criar proposta" }).click();

  const proposalRow = page.locator("tbody tr", { hasText: projectName }).first();
  await expect(proposalRow).toBeVisible();

  await proposalRow.getByRole("button").nth(1).click();

  const deleteDialog = page.getByRole("alertdialog");
  await expect(
    deleteDialog.getByRole("heading", { name: "Excluir proposta" }),
  ).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Excluir" }).click();

  await expect(page.locator("tbody tr", { hasText: projectName })).toHaveCount(0);
});
