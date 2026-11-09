import { describe, expect, it } from "vitest";

import {
  fruitfyChargeSchema,
  fruitfyOrderSchema,
  fruitfyPaymentStatus,
  toFruitfyCents,
  toFruitfyPhone,
} from "./fruitfy";

describe("toFruitfyCents", () => {
  it("converte reais para centavos", () => {
    expect(toFruitfyCents(10)).toBe(1000);
    expect(toFruitfyCents(49.9)).toBe(4990);
    expect(toFruitfyCents(64.8)).toBe(6480);
  });

  it("arredonda dízimas para o centavo mais próximo", () => {
    expect(toFruitfyCents(0.1 + 0.2)).toBe(30);
    expect(toFruitfyCents(19.999)).toBe(2000);
  });
});

describe("toFruitfyPhone", () => {
  it("remove a máscara do telefone", () => {
    expect(toFruitfyPhone("(11) 99999-8888")).toBe("11999998888");
  });
});

describe("fruitfyPaymentStatus", () => {
  it("confirma apenas quando a Fruitfy marca como pago", () => {
    expect(fruitfyPaymentStatus("paid")).toBe("PAID");
    expect(fruitfyPaymentStatus("waiting_payment")).toBe("PENDING");
    expect(fruitfyPaymentStatus("refunded")).toBe("PENDING");
    expect(fruitfyPaymentStatus("canceled")).toBe("PENDING");
  });
});

describe("fruitfyChargeSchema", () => {
  it("aceita a resposta real de criação de cobrança", () => {
    const parsed = fruitfyChargeSchema.safeParse({
      success: true,
      data: {
        order_id: "a32ee3dc-5321-4bf7-8244-7a8d6db25b93",
        status: "waiting_payment",
        amount: 1000,
        pix: { code: "0002010102122682...", expires_at: "2026-11-09T07:51:08-03:00" },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejeita resposta sem código PIX", () => {
    const parsed = fruitfyChargeSchema.safeParse({
      success: true,
      data: { order_id: "x", status: "waiting_payment", amount: 1000, pix: { code: "" } },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("fruitfyOrderSchema", () => {
  it("aceita a resposta real de consulta de pedido", () => {
    const parsed = fruitfyOrderSchema.safeParse({
      success: true,
      data: { uuid: "a32ee3dc-5321-4bf7-8244-7a8d6db25b93", status: "paid", total_gross_amount: 1000 },
    });
    expect(parsed.success).toBe(true);
  });
});
