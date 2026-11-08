import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { toVelaniCents, velaniPaymentStatus } from "./velani";

describe("Velani payment contract", () => {
  it("sends R$ 100 as 10000 centavos", () => {
    assert.equal(toVelaniCents(100), 10000);
    assert.equal(toVelaniCents(107.8), 10780);
  });
  it("confirms only a paid transaction", () => {
    assert.equal(velaniPaymentStatus("paid"), "PAID");
    for (const status of ["pending", "processing", "failed", "expired", "refunded"]) {
      assert.equal(velaniPaymentStatus(status), "PENDING");
    }
  });
});