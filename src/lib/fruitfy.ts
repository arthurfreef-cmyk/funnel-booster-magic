import { z } from "zod";

/**
 * Contrato da API Fruitfy (https://api.fruitfy.io).
 *
 * Toda cobrança PIX é emitida contra um único produto cadastrado na loja
 * Fruitfy ("produto genérico"), no valor exato do pedido. Assim qualquer
 * produto do site gera PIX: o que muda é apenas o valor cobrado.
 */
export const FRUITFY_PRODUCT_ID = "a32e191e-0e17-4b25-8ce1-71f49aae8526";

/** A Fruitfy trabalha com valores em centavos. */
export function toFruitfyCents(value: number): number {
  return Math.round(value * 100);
}

/** Telefone apenas com dígitos, como a Fruitfy espera (DDD + número). */
export function toFruitfyPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export const fruitfyChargeSchema = z.object({
  success: z.boolean(),
  data: z.object({
    order_id: z.string().min(1),
    status: z.string(),
    amount: z.number().int(),
    pix: z.object({
      code: z.string().min(1),
      expires_at: z.string().optional(),
      qr_code_base64: z.string().optional(),
    }),
  }),
});

export const fruitfyOrderSchema = z.object({
  success: z.boolean(),
  data: z.object({
    uuid: z.string().min(1),
    status: z.string(),
    total_gross_amount: z.number().int(),
  }),
});

/** Mensagens de validação da Fruitfy (HTTP 422) para exibir ao cliente. */
export const fruitfyErrorSchema = z.object({
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

/** Normaliza o status da Fruitfy para o contrato do checkout. */
export function fruitfyPaymentStatus(status: string): string {
  return status === "paid" ? "PAID" : "PENDING";
}
