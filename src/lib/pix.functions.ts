import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  FRUITFY_PRODUCT_ID,
  fruitfyChargeSchema,
  fruitfyOrderSchema,
  fruitfyPaymentStatus,
  toFruitfyCents,
  toFruitfyPhone,
} from "./fruitfy";

const FRUITFY_URL = "https://api.fruitfy.io/api";

const payloadSchema = z.object({
  amount: z.number().positive(),
  shipping: z.number().min(0).default(0),
  payer: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    taxId: z.string().min(11),
    phone: z.string().min(10),
  }),
  address: z.object({
    zipCode: z.string().min(8),
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().optional(),
    district: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2),
  }),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type PixPayload = z.input<typeof payloadSchema>;

export interface PixResult {
  id: string;
  status: string;
  copypaste: string;
  amount: number;
}

async function requestFruitfy(path: string, body?: unknown): Promise<unknown> {
  const token = process.env["FRUITFY_API_TOKEN"];
  const storeId = process.env["FRUITFY_STORE_ID"];
  if (!token || !storeId) {
    throw new Error("Pagamento indisponível: Fruitfy não configurada.");
  }
  const response = await fetch(`${FRUITFY_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Store-Id": storeId,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`Fruitfy request failed [${response.status}]: ${text}`);
    let message = "";
    try {
      const parsed = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };
      message = Object.values(parsed.errors ?? {})[0]?.[0] ?? parsed.message ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(message || `Não foi possível processar o PIX (${response.status}). Tente novamente.`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Resposta inesperada da Fruitfy. Tente novamente.");
  }
}

/** Fruitfy receives values in cents; the whole order is one item of the store's product. */
export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }): Promise<PixResult> => {
    const cents = toFruitfyCents(data.amount);
    const json = await requestFruitfy("/pix/charge", {
      name: data.payer.name.trim(),
      email: data.payer.email.trim(),
      cpf: data.payer.taxId.replace(/\D/g, ""),
      phone: toFruitfyPhone(data.payer.phone),
      amount: cents,
      items: [{ id: FRUITFY_PRODUCT_ID, value: cents, quantity: 1 }],
    });
    const parsed = fruitfyChargeSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("A Fruitfy não retornou uma cobrança PIX válida. Tente novamente.");
    }
    const charge = parsed.data.data;
    if (charge.amount !== cents) {
      throw new Error("O valor do PIX difere do pedido. Tente novamente.");
    }
    return { id: charge.order_id, status: charge.status, copypaste: charge.pix.code, amount: charge.amount };
  });

/** Return only status, never the customer's details from the provider response. */
export const getPixStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<{ status: string }> => {
    const json = await requestFruitfy(`/order/${encodeURIComponent(data.id)}`);
    const parsed = fruitfyOrderSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("Não foi possível verificar o pagamento na Fruitfy.");
    }
    return { status: fruitfyPaymentStatus(parsed.data.data.status) };
  });
