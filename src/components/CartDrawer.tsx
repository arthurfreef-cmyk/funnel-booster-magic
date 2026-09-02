import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { CART_ICON } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

/** Mini-cesta lateral, aberta ao adicionar um produto. */
export function CartDrawer() {
  const { items, drawerOpen, closeDrawer, setQuantity, remove, subtotal, shipping } = useCart();
  const [zip, setZip] = useState("");
  const [simulated, setSimulated] = useState(false);

  const total = subtotal + (simulated ? shipping : 0);

  const simulate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (zip.replace(/\D/g, "").length !== 8) return;
    setSimulated(true);
  };

  if (!drawerOpen) return null;

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Sua cesta">
      <button aria-label="Fechar cesta" className="drawer-scrim" type="button" onClick={closeDrawer} />
      <aside className="cart-drawer">
        <div className="cart-drawer-title">
          <h2>sua cesta</h2>
          <button aria-label="Fechar" type="button" onClick={closeDrawer}>
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <img alt="" className="cart-icon-image" src={CART_ICON} />
            <p>Sua cesta está vazia.</p>
            <button type="button" onClick={closeDrawer}>
              continuar comprando
            </button>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {items.map((item) => (
                <div className="cart-line" key={item.slug}>
                  <img alt={item.name} height={90} src={item.image} width={90} loading="lazy" />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{formatPrice(item.price * item.quantity)}</p>
                    <div className="quantity-control">
                      <button
                        aria-label="Diminuir quantidade"
                        type="button"
                        onClick={() => setQuantity(item.slug, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label="Aumentar quantidade"
                        type="button"
                        onClick={() => setQuantity(item.slug, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>{" "}
                    <button
                      className="catalog-filters-remove"
                      type="button"
                      onClick={() => remove(item.slug)}
                      style={{ background: "none", border: 0, fontSize: 12, color: "#777" }}
                    >
                      remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="cart-summary-lines">
                <p>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </p>
                {simulated ? (
                  <p>
                    <span>Frete</span>
                    <span>{formatPrice(shipping)}</span>
                  </p>
                ) : (
                  <form className="cart-shipping-sim" onSubmit={simulate}>
                    <label htmlFor="cart-zip">simular frete</label>
                    <div>
                      <input
                        id="cart-zip"
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="00000-000"
                        value={zip}
                        onChange={(event) => setZip(event.target.value)}
                      />
                      <button type="submit">ok</button>
                    </div>
                  </form>
                )}
                <p className="cart-summary-total">
                  <span>Total</span>
                  <strong>{formatPrice(total)}</strong>
                </p>
              </div>
              <Link className="checkout-button" to="/checkout" onClick={closeDrawer}>
                finalizar compra
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
