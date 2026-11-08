import { z } from "zod";

export const velaniTransactionSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "processing", "paid", "failed", "expired", "refunded"]),
    amount: z.number().int().positive(),
    pixQrCode: z.string().startsWith("000201").optional(),
  }),
});

export function toVelaniCents(value: number): number {
  return Math.round(value * 100);
}

export function velaniPaymentStatus(status: string): "PAID" | "PENDING" {
  // Processing is not a confirmation; refunds must never count as a purchase.
  return status === "paid" ? "PAID" : "PENDING";
}