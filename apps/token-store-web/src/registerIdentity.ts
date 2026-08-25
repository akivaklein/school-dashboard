export function registerAccountEmail(displayName: string): string {
  const slug = String(displayName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `register-${slug || 'account'}@yeshiva-ketana.local`
}
