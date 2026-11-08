import { describe, expect, it } from "bun:test";
import { toVelaniCents, velaniPaymentStatus } from "./velani";

describe("Velani payment contract", () => {
  it("sends R$ 100 as 10000 centavos", () => {
    expect(toVelaniCents(100)).toBe(10000);
    expect(toVelaniCents(107.8)).toBe(10780);
  });
  it("confirms only a paid transaction", () => {
    expect(velaniPaymentStatus("paid")).toBe("PAID");
    for (const status of ["pending", "processing", "failed", "expired", "refunded"]) {
      expect(velaniPaymentStatus(status)).toBe("PENDING");
    }
  });
});