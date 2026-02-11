export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const digits = normalizeCnpj(value).slice(0, 14);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  const p4 = digits.slice(8, 12);
  const p5 = digits.slice(12, 14);

  let formatted = p1;

  if (p2) {
    formatted += `.${p2}`;
  }

  if (p3) {
    formatted += `.${p3}`;
  }

  if (p4) {
    formatted += `/${p4}`;
  }

  if (p5) {
    formatted += `-${p5}`;
  }

  return formatted;
}
