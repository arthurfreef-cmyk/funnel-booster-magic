import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/** Recebe notificações de pagamento/transferência da MasterFy. */
export const Route = createFileRoute("/api/public/masterfy-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env["MASTERFY_WEBHOOK_SECRET"];

        if (secret) {
          const signature = request.headers.get("x-signature") ?? "";
          const expected = createHmac("sha256", secret).update(raw).digest("base64");
          const a = Buffer.from(signature);
          const b = Buffer.from(expected);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let event: { id?: string; status?: string; method?: string } = {};
        try {
          event = JSON.parse(raw) as typeof event;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        console.log(`MasterFy webhook: ${event.method ?? "?"} ${event.id ?? "?"} -> ${event.status ?? "?"}`);
        return new Response("ok");
      },
    },
  },
});
