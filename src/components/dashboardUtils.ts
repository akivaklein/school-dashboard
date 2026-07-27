export function getLookupValue<T extends Record<string, unknown>>(
  map: T,
  key: string | number | undefined | null,
): T[keyof T] | undefined {
  if (key === undefined || key === null) return undefined

  const normalizedKey = typeof key === 'number' ? String(key) : key
  return map[normalizedKey as keyof T]
}
