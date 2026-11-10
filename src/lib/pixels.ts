/**
 * Meta Pixel oficial da loja.
 * Único pixel de rastreamento ativo no projeto.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const META_PIXEL_ID = "3347262455471701";
let initialized = false;

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

/** Evento padrão enviado somente ao Meta Pixel configurado acima. */
export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params);
}

const toCurrency = (value: number) => value.toFixed(2);

export function trackAddToCart(item: { name: string; slug: string; price: number; quantity: number }) {
  trackEvent("AddToCart", {
    content_name: item.name,
    content_ids: [item.slug],
    content_type: "product",
    value: toCurrency(item.price * item.quantity),
    currency: "BRL",
  });
}

export function trackInitiateCheckout(total: number, items: { slug: string; quantity: number }[]) {
  trackEvent("InitiateCheckout", {
    content_ids: items.map((i) => i.slug),
    content_type: "product",
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: toCurrency(total),
    currency: "BRL",
  });
}

export function trackPurchase(total: number, items: { slug: string; quantity: number }[]) {
  trackEvent("Purchase", {
    content_ids: items.map((i) => i.slug),
    content_type: "product",
    value: toCurrency(total),
    currency: "BRL",
  });
}
