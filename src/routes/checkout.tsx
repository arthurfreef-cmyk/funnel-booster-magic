import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";

import { PixButton } from "@/components/PixButton";
import { ORDER_BUMP } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { trackInitiateCheckout, trackPurchase } from "@/lib/pixels";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | wepink" },
      { name: "description", content: "Finalize seu pedido wepink em poucos passos." },
      { property: "og:title", content: "Checkout | wepink" },
      { property: "og:description", content: "Finalize seu pedido wepink em poucos passos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutRoute,
});

interface FormState {
  name: string;
  email: string;
  document: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  document: "",
  phone: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

function CheckoutRoute() {
  const navigate = useNavigate();
  const { items, subtotal, shipping, total, add, clear, hydrated } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFilled, setCepFilled] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);
  const cepAbortRef = useRef<AbortController | null>(null);
  const bumpAdded = items.some((item) => item.slug === ORDER_BUMP.slug);

  const update = (key: keyof FormState) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  /** Formata o CEP e dispara a busca do endereço ao completar 8 dígitos. */
  const onCepChange = (event: { target: { value: string } }) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm((current) => ({ ...current, zip: masked }));
    setCepFilled(false);
    if (digits.length === 8) void lookupCep(digits);
  };

  /** Máscara de CPF: 000.000.000-00. */
  const onCpfChange = (event: { target: { value: string } }) => {
    const d = event.target.value.replace(/\D/g, "").slice(0, 11);
    const masked = d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    setForm((current) => ({ ...current, document: masked }));
  };

  /** Máscara de telefone: (00) 00000-0000. */
  const onPhoneChange = (event: { target: { value: string } }) => {
    const d = event.target.value.replace(/\D/g, "").slice(0, 11);
    const masked =
      d.length > 6
        ? `(${d.slice(0, 2)}) ${d.slice(2, d.length > 10 ? 7 : 6)}-${d.slice(d.length > 10 ? 7 : 6)}`
        : d.length > 2
          ? `(${d.slice(0, 2)}) ${d.slice(2)}`
          : d;
    setForm((current) => ({ ...current, phone: masked }));
  };

  /** Consulta o ViaCEP e preenche rua, bairro, cidade e UF automaticamente. */
  const lookupCep = async (cep: string) => {
    cepAbortRef.current?.abort();
    const controller = new AbortController();
    cepAbortRef.current = controller;
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (controller.signal.aborted) return;
      if (data.erro) {
        setError("CEP não encontrado. Confira e tente novamente.");
        return;
      }
      setForm((current) => ({
        ...current,
        street: data.logradouro ?? current.street,
        district: data.bairro ?? current.district,
        city: data.localidade ?? current.city,
        state: data.uf ?? current.state,
      }));
      setCepFilled(true);
      // Leva o cliente direto ao campo que falta: número.
      numberRef.current?.focus();
    } catch {
      if (!controller.signal.aborted) {
        setError("Não foi possível buscar o CEP. Preencha o endereço manualmente.");
      }
    } finally {
      if (!controller.signal.aborted) setCepLoading(false);
    }
  };

  /** Valida os dados mínimos antes de acionar o gateway. */
  const validate = (): boolean => {
    setError(null);
    if (items.length === 0) {
      setError("Sua cesta está vazia.");
      return false;
    }
    if (!form.name.trim() || !form.email.includes("@") || form.document.replace(/\D/g, "").length < 11) {
      setError("Confira nome, e-mail e CPF antes de continuar.");
      return false;
    }
    return true;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    validate();
  };

  if (hydrated && items.length === 0) {
    return (
      <div className="checkout-page removed-page">
        <nav className="breadcrumbs">
          <Link to="/">home</Link>
          <span>/</span>
          checkout
        </nav>
        <h1>sua cesta está vazia</h1>
        <p>Adicione produtos para concluir sua compra.</p>
        <Link className="checkout-button" to="/">
          continuar comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <nav className="breadcrumbs">
        <Link to="/">home</Link>
        <span>/</span>
        checkout
      </nav>
      <h1>checkout</h1>

      <div className="checkout-layout">
        <div>
          {items.map((item) => (
            <div className="checkout-line" key={item.slug}>
              <img alt={item.name} height={130} loading="lazy" src={item.image} width={130} />
              <div>
                <h2>{item.name}</h2>
                <p>{formatPrice(item.price)}</p>
              </div>
              <strong>x{item.quantity}</strong>
            </div>
          ))}

          <section className="order-bump">
            <div className="order-bump-heading">
              <span>oferta única</span>
              <strong>só nesta compra</strong>
            </div>
            <div className="order-bump-content">
              <img alt={ORDER_BUMP.name} loading="lazy" src={ORDER_BUMP.image} />
              <div>
                <h3>{ORDER_BUMP.name}</h3>
                <p>{ORDER_BUMP.description}</p>
                <strong>{formatPrice(ORDER_BUMP.price)}</strong>
              </div>
            </div>
            <button
              className={bumpAdded ? "added" : undefined}
              disabled={bumpAdded}
              type="button"
              onClick={() => add(ORDER_BUMP)}
            >
              {bumpAdded ? "adicionado à cesta ✓" : "sim, quero adicionar"}
            </button>
          </section>

          <form className="checkout-form" onSubmit={onSubmit}>
            <section className="checkout-form-section">
              <div className="checkout-form-heading">
                <span>1</span>
                <div>
                  <h3>dados pessoais</h3>
                  <p>Usamos seus dados apenas para emitir e entregar o pedido.</p>
                </div>
              </div>
              <label>
                <span>nome completo</span>
                <input autoComplete="name" placeholder="Seu nome completo" value={form.name} onChange={update("name")} />
              </label>
              <label>
                <span>e-mail</span>
                <input autoComplete="email" placeholder="voce@email.com" type="email" value={form.email} onChange={update("email")} />
              </label>
              <div className="checkout-field-row city-state">
                <label>
                  <span>CPF</span>
                  <input
                    autoComplete="off"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={form.document}
                    onChange={onCpfChange}
                  />
                </label>
                <label>
                  <span>celular com DDD</span>
                  <input
                    autoComplete="tel-national"
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={onPhoneChange}
                  />
                </label>
              </div>
            </section>

            <section className="checkout-form-section">
              <div className="checkout-form-heading">
                <span>2</span>
                <div>
                  <h3>endereço de entrega</h3>
                  <p>Enviamos para todo o Brasil.</p>
                </div>
              </div>
              <label>
                <span>CEP {cepLoading && <em>buscando endereço…</em>}</span>
                <input
                  autoComplete="postal-code"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={form.zip}
                  onChange={onCepChange}
                />
              </label>
              <label>
                <span>rua</span>
                <input
                  autoComplete="address-line1"
                  className={cepFilled ? "autofilled" : undefined}
                  value={form.street}
                  onChange={update("street")}
                />
              </label>
              <div className="checkout-field-row number-complement">
                <label>
                  <span>número</span>
                  <input ref={numberRef} inputMode="numeric" placeholder="123" value={form.number} onChange={update("number")} />
                </label>
                <label>
                  <span>complemento</span>
                  <input placeholder="opcional" value={form.complement} onChange={update("complement")} />
                </label>
              </div>
              <label>
                <span>bairro</span>
                <input
                  autoComplete="address-level3"
                  className={cepFilled ? "autofilled" : undefined}
                  value={form.district}
                  onChange={update("district")}
                />
              </label>
              <div className="checkout-field-row city-state">
                <label>
                  <span>cidade</span>
                  <input
                    autoComplete="address-level2"
                    className={cepFilled ? "autofilled" : undefined}
                    value={form.city}
                    onChange={update("city")}
                  />
                </label>
                <label>
                  <span>UF</span>
                  <input
                    autoComplete="address-level1"
                    className={cepFilled ? "autofilled" : undefined}
                    maxLength={2}
                    value={form.state}
                    onChange={update("state")}
                  />
                </label>
              </div>
            </section>

            <section className="checkout-form-section checkout-payment-section">
              <div className="checkout-form-heading">
                <span>3</span>
                <div>
                  <h3>pagamento</h3>
                  <p>Aprovação imediata e desconto já aplicado nos preços.</p>
                </div>
              </div>
              {error && <p className="form-error">{error}</p>}
              <PixButton
                amount={total}
                customer={{
                  name: form.name,
                  email: form.email,
                  document: form.document,
                  phone: form.phone,
                }}
                onBeforeCreate={() => {
                  const ok = validate();
                  if (ok) trackInitiateCheckout(total, items);
                  return ok;
                }}
                onPaid={() => {
                  trackPurchase(total, items);
                  clear();
                  void navigate({ to: "/obrigado" });
                }}
              />
            </section>

          </form>
        </div>

        <aside className="order-summary">
          <h2>resumo do pedido</h2>

          <ul className="summary-items">
            {items.map((item) => (
              <li key={item.slug}>
                <img alt={item.name} loading="lazy" src={item.image} width={56} height={56} />
                <div>
                  <p>{item.name}</p>
                  <span>quantidade: {item.quantity}</span>
                </div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>

          <p>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </p>
          {savings > 0 && (
            <p className="summary-savings">
              <span>você economiza</span>
              <span>-{formatPrice(savings)}</span>
            </p>
          )}
          <p>
            <span>Frete</span>
            <span>{formatPrice(shipping)}</span>
          </p>
          <div>
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <p className="summary-installments">ou em até 6x de {formatPrice(total / 6)} sem juros</p>

          <ul className="summary-trust">
            <li><span aria-hidden>⚡</span> pix com aprovação imediata</li>
            <li><span aria-hidden>🔒</span> compra 100% segura</li>
            <li><span aria-hidden>↩</span> troca fácil em até 7 dias</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
