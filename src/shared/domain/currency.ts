const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyBrl(value: number): string {
  return brlFormatter.format(value);
}

export function parseCurrencyBrlInput(value: string): number | null {
  const onlyDigits = value.replace(/\D/g, "");

  if (onlyDigits.length === 0) {
    return null;
  }

  return Number(onlyDigits) / 100;
}
