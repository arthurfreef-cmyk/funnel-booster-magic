import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { SafeImage } from "@/components/SafeImage";
import { CART_ICON } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { lookupZip, saveAddress, type SavedAddress } from "@/lib/shipping-address";

/** Mini-cesta lateral, aberta ao adicionar um produto. */
export function CartDrawer() {
  const { items, drawerOpen, closeDrawer, setQuantity, remove, subtotal, shipping } = useCart();
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState<SavedAddress | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const simulated = address !== null;

  const total = subtotal + (simulated ? shipping : 0);

  const onZipChange = (value: string) => {
    const d = value.replace(/\D/g, "").slice(0, 8);
    setZip(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
    setZipError(null);
  };

  const simulate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = zip.replace(/\D/g, "");
    if (digits.length !== 8 || zipLoading) return;
    setZipLoading(true);
    setZipError(null);
    try {
      const found = await lookupZip(digits);
      if (!found) {
        setZipError("CEP não encontrado. Confira e tente novamente.");
        return;
      }
      setAddress(found);
      saveAddress(found);
    } catch {
      setZipError("Não foi possível consultar o CEP agora.");
    } finally {
      setZipLoading(false);
    }
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
            <SafeImage alt="" className="cart-icon-image" src={CART_ICON} />
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
                  <SafeImage alt={item.name} height={90} src={item.image} fallbackSources={[item.imageLarge, ...(item.gallery ?? []), ...(item.skus ?? []).map((sku) => sku.image)]} width={90} loading="lazy" />
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
                {simulated && address ? (
                  <>
                    <p>
                      <span>Frete</span>
                      <span>{formatPrice(shipping)}</span>
                    </p>
                    <div className="cart-shipping-address">
                      <strong>entrega em</strong>
                      <span>
                        {[address.street, address.district].filter(Boolean).join(", ")}
                        {address.street || address.district ? <br /> : null}
                        {address.city} - {address.state} · CEP {address.zip}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddress(null);
                          setZip("");
                        }}
                      >
                        alterar CEP
                      </button>
                    </div>
                  </>
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
                        onChange={(event) => onZipChange(event.target.value)}
                      />
                      <button disabled={zipLoading} type="submit">
                        {zipLoading ? "…" : "ok"}
                      </button>
                    </div>
                    {zipError && <em className="cart-shipping-error">{zipError}</em>}
                  </form>
                )}
                <p className="cart-summary-total">
                  <span>Total</span>
                  <strong>{formatPrice(total)}</strong>
                </p>
              </div>
              <Link
                to="/"
                onClick={closeDrawer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  minHeight: 44,
                  marginBottom: 10,
                  border: "1px solid #d9a1b5",
                  borderRadius: 8,
                  color: "#a94f70",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                }}
              >
                + adicionar mais itens
              </Link>
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
