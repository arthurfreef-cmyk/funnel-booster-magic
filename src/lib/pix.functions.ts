import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE = "https://api.realtechdev.com.br";

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

function credentials() {
  const token = process.env["BUCKPAY_TOKEN"];
  const userAgent = process.env["BUCKPAY_USER_AGENT"];
  if (!token || !userAgent) {
    throw new Error("Pagamento indisponível: credenciais da BuckPay não configuradas.");
  }
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": userAgent,
    "Content-Type": "application/json",
  };
}

/** Procura o código PIX copia e cola nos formatos conhecidos da resposta. */
function extractPixCode(json: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (node: unknown): string | null => {
    if (!node || typeof node !== "object" || seen.has(node)) return null;
    seen.add(node);
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (typeof value === "string" && value.length > 20) {
        const k = key.toLowerCase();
        if (k.includes("copy") || k.includes("emv") || k === "code" || k === "qrcode" || k === "qr_code") {
          return value;
        }
      }
    }
    for (const value of Object.values(node as Record<string, unknown>)) {
      const found = walk(value);
      if (found) return found;
    }
    return null;
  };
  return walk(json);
}

/** Cria uma transação PIX na BuckPay e devolve o código copia e cola. */
export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }): Promise<PixResult> => {
    const externalId = `wepink_${Date.now()}`;

    const body = {
      external_id: externalId,
      payment_method: "pix",
      amount: cents(data.amount),
      buyer: {
        name: data.payer.name.trim(),
        email: data.payer.email.trim(),
        document: digits(data.payer.taxId),
        phone: digits(data.payer.phone),
      },
      description: `Pedido wepink - ${data.items.length} item(ns)`,
      items: data.items.map((item) => ({
        name: item.name,
        price: cents(item.price),
        quantity: item.quantity,
      })),
      shipping: {
        price: cents(data.shipping),
        address: {
          zip_code: digits(data.address.zipCode),
          street: data.address.street,
          number: data.address.number,
          complement: data.address.complement?.trim() || undefined,
          neighborhood: data.address.district,
          city: data.address.city,
          state: data.address.state.toUpperCase().slice(0, 2),
          country: "BR",
        },
      },
    };

    const response = await fetch(`${API_BASE}/v1/transactions`, {
      method: "POST",
      headers: credentials(),
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error(`BuckPay transaction failed [${response.status}]: ${text}`);
      throw new Error(`Não foi possível gerar o PIX (${response.status}). Tente novamente.`);
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      console.error(`BuckPay response is not JSON: ${text}`);
      throw new Error("Resposta inesperada do gateway. Tente novamente.");
    }

    const root = (json as { data?: Record<string, unknown> }).data ?? (json as Record<string, unknown>);
    const copypaste = extractPixCode(json);
    if (!copypaste) {
      console.error(`BuckPay response without pix code: ${text}`);
      throw new Error("O gateway não retornou o código PIX. Tente novamente.");
    }

    return {
      id: String(root["id"] ?? externalId),
      status: String(root["status"] ?? "pending"),
      copypaste,
      amount: cents(data.amount),
    };
  });

/** Consulta o status da transação (usado só para confirmar manualmente na tela de PIX). */
export const getPixStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE}/v1/transactions/external_id/${data.id}`, {
      headers: credentials(),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`BuckPay status failed [${response.status}]: ${text}`);
      throw new Error(`Não foi possível consultar o pagamento (${response.status}).`);
    }
    const json = JSON.parse(text) as { data?: { status?: string }; status?: string };
    const status = json.data?.status ?? json.status ?? "pending";
    const paid = ["paid", "approved", "processed", "completed"].includes(status.toLowerCase());
    return { status: paid ? "PAID" : "PENDING" };
  });
