export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const digits = normalizePhone(value).slice(0, 11);
  if (digits.length === 0) {
    return "";
  }

  const ddd = digits.slice(0, 2);
  const subscriber = digits.slice(2);

  if (digits.length <= 2) {
    return `(${ddd}`;
  }

  if (digits.length <= 6) {
    return `(${ddd}) ${subscriber}`;
  }

  const firstPartLength = digits.length > 10 ? 5 : 4;
  const firstPart = subscriber.slice(0, firstPartLength);
  const secondPart = subscriber.slice(firstPartLength);

  if (!secondPart) {
    return `(${ddd}) ${firstPart}`;
  }

  return `(${ddd}) ${firstPart}-${secondPart}`;
}
