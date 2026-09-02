import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE = "https://api.masterfypagamentos.com";

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

const cents = (value: number) => Math.round(value * 100);
const digits = (value: string) => value.replace(/\D/g, "");

/** Cria uma cobrança PIX na MasterFy e devolve o código copia e cola. */
export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }): Promise<PixResult> => {
    const apiKey = process.env["MASTERFY_API_KEY"];
    if (!apiKey) throw new Error("Pagamento indisponível: chave da MasterFy não configurada.");

    const origin = process.env["PUBLIC_SITE_URL"] ?? "https://funnel-booster-magic.lovable.app";

    const body = {
      amount: cents(data.amount),
      currency: "BRL",
      method: "PIX",
      description: `Pedido wepink - ${data.items.length} item(ns)`,
      externalRef: `wepink_${Date.now()}`,
      notificationUrl: `${origin}/api/public/masterfy-webhook`,
      payer: {
        name: data.payer.name.trim(),
        taxId: digits(data.payer.taxId),
        email: data.payer.email.trim(),
        phone: digits(data.payer.phone),
      },
      items: data.items.map((item) => ({
        quantity: item.quantity,
        name: item.name,
        price: cents(item.price),
        type: "PHYSICAL",
      })),
      delivery: {
        fee: cents(data.shipping),
        address: {
          country: "BR",
          state: data.address.state.toUpperCase().slice(0, 2),
          city: data.address.city,
          district: data.address.district,
          street: data.address.street,
          number: data.address.number,
          ...(data.address.complement?.trim() ? { complement: data.address.complement.trim() } : {}),
          zipCode: digits(data.address.zipCode),
        },
      },
    };

    const response = await fetch(`${API_BASE}/v1/payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error(`MasterFy payment failed [${response.status}]: ${text}`);
      throw new Error(`Não foi possível gerar o PIX (${response.status}). Tente novamente.`);
    }

    const json = JSON.parse(text) as {
      id: string;
      status: string;
      amount: number;
      data?: { copypaste?: string };
    };

    if (!json.data?.copypaste) {
      console.error(`MasterFy response without copypaste: ${text}`);
      throw new Error("O gateway não retornou o código PIX. Tente novamente.");
    }

    return {
      id: json.id,
      status: json.status,
      copypaste: json.data.copypaste,
      amount: json.amount,
    };
  });

/** Consulta o status de um pagamento (usado só para confirmar manualmente na tela de PIX). */
export const getPixStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<{ status: string }> => {
    const apiKey = process.env["MASTERFY_API_KEY"];
    if (!apiKey) throw new Error("Pagamento indisponível: chave da MasterFy não configurada.");

    const response = await fetch(`${API_BASE}/v1/payment/${data.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`MasterFy status failed [${response.status}]: ${text}`);
      throw new Error(`Não foi possível consultar o pagamento (${response.status}).`);
    }
    const json = JSON.parse(text) as { status: string };
    return { status: json.status };
  });
