import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pedido recebido | wepink" },
      { name: "description", content: "Seu pedido wepink foi registrado com sucesso." },
      { property: "og:title", content: "Pedido recebido | wepink" },
      { property: "og:description", content: "Acompanhe os próximos passos do seu pedido." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouRoute,
});

function ThankYouRoute() {
  const { items, total, clear, hydrated } = useCart();
  const [snapshot, setSnapshot] = useState<{ count: number; total: number } | null>(null);

  // Generated only after hydration: a random value rendered during SSR would
  // differ from the client render and break hydration (blank screen).
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    setOrderId(`WP${Math.floor(100000 + Math.random() * 899999)}`);
  }, []);

  useEffect(() => {
    if (!hydrated || snapshot) return;
    setSnapshot({ count: items.reduce((sum, item) => sum + item.quantity, 0), total });
    clear();
  }, [hydrated, items, total, clear, snapshot]);

  return (
    <div className="thank-you-page">
      <div className="thank-you-card">
        <span className="thank-you-symbol approved">✓</span>
        <p className="detail-eyebrow">pedido {orderId ?? "—"}</p>
        <h1>obrigada pela sua compra!</h1>
        <p className="payment-status-label approved">pagamento confirmado</p>
        <div className="thank-you-message">
          <p>
            Recebemos seu pedido e já estamos preparando tudo com carinho. Você vai receber a
            confirmação e o código de rastreio por e-mail.
          </p>
        </div>
        {snapshot && snapshot.count > 0 && (
          <div className="thank-you-summary">
            <div>
              <strong>{snapshot.count}</strong> itens
            </div>
            <div>
              total <strong>{formatPrice(snapshot.total)}</strong>
            </div>
          </div>
        )}
        <Link className="thank-you-primary-link checkout-button" to="/">
          continuar comprando
        </Link>
      </div>
    </div>
  );
}
