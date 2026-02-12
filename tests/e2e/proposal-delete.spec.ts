import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const output: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
}

const localEnv = readEnvFile(path.resolve(process.cwd(), ".env.local"));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? localEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? localEnv.SUPABASE_SERVICE_ROLE_KEY;

test("exclui proposta recebida pela listagem", async ({ page }, testInfo) => {
  test.skip(
    !supabaseUrl || !serviceRoleKey,
    "Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para criar usuário E2E.",
  );

  const uniqueId = `${testInfo.project.name}-${Date.now()}`;
  const email = `e2e-delete-${uniqueId}@example.com`;
  const password = `E2eDelete!${Date.now()}`;
  const customerName = `E2E Cliente ${uniqueId}`;
  const projectName = `E2E Projeto ${uniqueId}`;

  const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let createdUserId: string | null = null;

  try {
    const createUserResult = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "admin",
      },
    });

    if (createUserResult.error || !createUserResult.data.user) {
      throw createUserResult.error ?? new Error("Falha ao criar usuário E2E.");
    }

    createdUserId = createUserResult.data.user.id;

    await page.goto("/login?next=/clientes");
    await page.getByLabel("E-mail").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
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

    page.once("dialog", (dialog) => dialog.accept());
    await proposalRow.getByRole("button").nth(1).click();

    await expect(page.locator("tbody tr", { hasText: projectName })).toHaveCount(0);
  } finally {
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }
  }
});
