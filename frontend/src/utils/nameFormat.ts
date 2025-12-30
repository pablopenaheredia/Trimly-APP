export function normalizeHumanName(value: string): string {
  const trimmed = (value || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const capPart = (part: string) => {
    const lower = part.toLocaleLowerCase('es-ES');
    return lower.charAt(0).toLocaleUpperCase('es-ES') + lower.slice(1);
  };

  return trimmed
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) => (part ? capPart(part) : part))
        .join('-'),
    )
    .join(' ');
}

export function formatFullName(nombre?: string, apellido?: string): string {
  const n = normalizeHumanName(nombre || '');
  const a = normalizeHumanName(apellido || '');
  return [n, a].filter(Boolean).join(' ');
}
