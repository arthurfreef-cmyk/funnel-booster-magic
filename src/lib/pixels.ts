/**
 * Meta Pixel oficial da loja.
 * Todos os eventos padrão são enviados exclusivamente ao Pixel configurado.
 */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const META_PIXEL_ID = "3347262455471701";
let initialized = false;
const sentPurchaseIds = new Set<string>();

export function initPixels() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      fbq.queue.push(args);
    } as { (...args: unknown[]): void; queue: unknown[][]; loaded: boolean; version: string };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq as unknown as (...args: unknown[]) => void;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    window.fbq("init", META_PIXEL_ID);
  }

  window.fbq?.("track", "PageView");
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params);
}

const money = (value: number) => Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
const productIds = (items: { slug: string }[]) => items.map((item) => item.slug);

export function trackViewContent(product: { name: string; slug: string; price: number; category?: string }) {
  trackEvent("ViewContent", {
    content_name: product.name,
    content_ids: [product.slug],
    content_type: "product",
    content_category: product.category,
    value: money(product.price),
    currency: "BRL",
  });
}

export function trackSearch(query: string, resultCount?: number) {
  const searchString = query.trim();
  if (!searchString) return;
  trackEvent("Search", {
    search_string: searchString,
    ...(typeof resultCount === "number" ? { content_category: `results:${resultCount}` } : {}),
  });
}

export function trackAddToCart(item: { name: string; slug: string; price: number; quantity: number }) {
  trackEvent("AddToCart", {
    content_name: item.name,
    content_ids: [item.slug],
    content_type: "product",
    value: money(item.price * item.quantity),
    currency: "BRL",
    num_items: item.quantity,
  });
}

export function trackInitiateCheckout(total: number, items: { slug: string; quantity: number }[]) {
  trackEvent("InitiateCheckout", {
    content_ids: productIds(items),
    content_type: "product",
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    value: money(total),
    currency: "BRL",
  });
}

export function trackAddPaymentInfo(total: number, items: { slug: string; quantity: number }[], method: string) {
  trackEvent("AddPaymentInfo", {
    content_ids: productIds(items),
    content_type: "product",
    value: money(total),
    currency: "BRL",
    payment_method: method,
  });
}

export function trackPurchase(
  total: number,
  items: { slug: string; quantity: number }[],
  transactionId?: string,
) {
  if (typeof window === "undefined") return;
  if (transactionId) {
    const key = `meta-purchase-${transactionId}`;
    try {
      if (sentPurchaseIds.has(transactionId) || window.sessionStorage.getItem(key)) return;
      sentPurchaseIds.add(transactionId);
      window.sessionStorage.setItem(key, "1");
    } catch {
      if (sentPurchaseIds.has(transactionId)) return;
      sentPurchaseIds.add(transactionId);
    }
  }
  trackEvent("Purchase", {
    ...(transactionId ? { order_id: transactionId } : {}),
    content_ids: productIds(items),
    content_type: "product",
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    value: money(total),
    currency: "BRL",
  });
}
