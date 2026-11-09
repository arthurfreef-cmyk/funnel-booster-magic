import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { toVelaniCents, velaniPaymentStatus, velaniTransactionSchema } from "./velani";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_velani_pagamentos/api/v1/api-gateway/v1/transactions";

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

async function requestVelani(path: string, body?: unknown): Promise<unknown> {
  const appKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["UDC_VELANI_PAGAMENTOS_API_KEY"];
  if (!appKey || !connectionKey) {
    throw new Error("Pagamento indisponível: conexão Velani não configurada.");
  }
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${appKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`Velani request failed [${response.status}]: ${text}`);
    throw new Error(`Não foi possível processar o PIX (${response.status}). Tente novamente.`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Resposta inesperada da Velani. Tente novamente.");
  }
}

/** Keep the existing checkout contract; Velani receives monetary values in cents. */
export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }): Promise<PixResult> => {
    const json = await requestVelani("", {
      paymentMethod: "pix",
      amount: toVelaniCents(data.amount),
      customer: {
        name: data.payer.name.trim(),
        email: data.payer.email.trim(),
        document: { type: "cpf", number: data.payer.taxId.replace(/\D/g, "") },
      },
      // Only the fields required by Velani's documented example.
      items: data.items.map((item) => ({
        title: item.name,
        unitPrice: toVelaniCents(item.price),
        quantity: item.quantity,
      })),
    });
    const parsed = velaniTransactionSchema.safeParse(json);
    if (!parsed.success || !parsed.data.data.pixQrCode) {
      throw new Error("A Velani não retornou uma cobrança PIX válida. Tente novamente.");
    }
    const transaction = parsed.data.data;
    if (transaction.amount !== toVelaniCents(data.amount)) {
      throw new Error("O valor do PIX difere do pedido. Tente novamente.");
    }
    return {
      id: transaction.id,
      status: transaction.status,
      copypaste: parsed.data.data.pixQrCode,
      amount: transaction.amount,
    };
  });

/** Return only status, never the customer's details from the provider response. */
export const getPixStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<{ status: string }> => {
    const json = await requestVelani(`/${encodeURIComponent(data.id)}`);
    const parsed = velaniTransactionSchema.safeParse(json);
    if (!parsed.success || parsed.data.data.id !== data.id) {
      throw new Error("Não foi possível verificar o pagamento na Velani.");
    }
    return { status: velaniPaymentStatus(parsed.data.data.status) };
  });
