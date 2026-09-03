const KEY = "wepink-visited-products";

/** Lê os slugs de produtos cuja página o cliente já visitou. */
export function readVisited(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Marca a página do produto como visitada. */
export function markVisited(slug: string): void {
  if (typeof window === "undefined") return;
  const current = readVisited();
  if (current.includes(slug)) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...current, slug]));
  } catch {
    /* storage indisponível: segue sem bloquear a compra */
  }
}

export function hasVisited(slug: string): boolean {
  return readVisited().includes(slug);
}
