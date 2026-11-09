import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { fruitfyPaymentStatus, toFruitfyCents, toFruitfyPhone } from "./fruitfy";

describe("Fruitfy payment contract", () => {
  it("sends reais as centavos", () => {
    assert.equal(toFruitfyCents(199), 19900);
    assert.equal(toFruitfyCents(107.8), 10780);
  });
  it("prefixes phones with 55", () => {
    assert.equal(toFruitfyPhone("(11) 98765-4321"), "5511987654321");
    assert.equal(toFruitfyPhone("5511987654321"), "5511987654321");
  });
  it("confirms only a paid order", () => {
    assert.equal(fruitfyPaymentStatus("paid"), "PAID");
    for (const s of ["waiting_payment", "pending", "refused", "canceled", "refunded", "chargeback", "failed"]) {
      assert.equal(fruitfyPaymentStatus(s), "PENDING");
    }
  });
});
