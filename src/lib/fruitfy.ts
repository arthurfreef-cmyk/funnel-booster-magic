import { z } from "zod";

/** Product registered in the Fruitfy panel; one product covers any order value. */
export const FRUITFY_PRODUCT_ID = "a32e191e-0e17-4b25-8ce1-71f49aae8526";

export const fruitfyChargeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    order_id: z.string().uuid(),
    status: z.string(),
    amount: z.number().int().positive(),
    pix: z.object({ code: z.string().startsWith("000201") }),
  }),
});

export const fruitfyOrderSchema = z.object({
  success: z.literal(true),
  data: z.object({ status: z.string() }),
});

export function toFruitfyCents(value: number): number {
  return Math.round(value * 100);
}

/** Fruitfy phones carry the country code (55 + DDD + number). */
export function toFruitfyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
}

export function fruitfyPaymentStatus(status: string): "PAID" | "PENDING" {
  // Only "paid" confirms; refunds/chargebacks must never count as a purchase.
  return status === "paid" ? "PAID" : "PENDING";
}
