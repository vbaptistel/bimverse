const CNPJ_LENGTH = 14;

/** Pesos para o primeiro dígito verificador (13º). Aplicados aos 12 primeiros dígitos. */
const WEIGHTS_FIRST: readonly number[] = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
/** Pesos para o segundo dígito verificador (14º). Aplicados aos 13 primeiros dígitos. */
const WEIGHTS_SECOND: readonly number[] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida CNPJ pelos dígitos verificadores.
 * @param value - string com 14 dígitos (pode conter formatação)
 * @returns true se o CNPJ é válido
 */
export function validateCnpj(value: string): boolean {
  const digits = normalizeCnpj(value);
  if (digits.length !== CNPJ_LENGTH) {
    return false;
  }

  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  const d = digits.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += d[i] * WEIGHTS_FIRST[i];
  }
  let remainder = sum % 11;
  const firstCheck = remainder < 2 ? 0 : 11 - remainder;
  if (firstCheck !== d[12]) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += d[i] * WEIGHTS_SECOND[i];
  }
  remainder = sum % 11;
  const secondCheck = remainder < 2 ? 0 : 11 - remainder;
  if (secondCheck !== d[13]) {
    return false;
  }

  return true;
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
