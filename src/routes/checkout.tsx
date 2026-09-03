import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bolt, Loader2, Lock, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { CardModal } from "@/components/CardModal";
import { PixModal } from "@/components/PixModal";
import { hasVisited } from "@/lib/product-visit";
import { readAddress, saveAddress } from "@/lib/shipping-address";
import { ORDER_BUMP } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { createPixPayment, type PixResult } from "@/lib/pix.functions";
import { trackInitiateCheckout, trackPurchase } from "@/lib/pixels";


export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout seguro | wepink" },
      { name: "description", content: "Finalize seu pedido wepink em poucos passos, com pagamento PIX aprovado na hora." },
      { property: "og:title", content: "Checkout seguro | wepink" },
      { property: "og:description", content: "Finalize seu pedido wepink em poucos passos, com pagamento PIX aprovado na hora." },
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

type FieldErrors = { [K in keyof FormState]?: string | undefined };

/** Tempo de reserva do preço promocional, em segundos. */
const RESERVE_SECONDS = 15 * 60;

function CheckoutRoute() {
  const { items, subtotal, shipping, add, setQuantity, remove, clear, hydrated } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFilled, setCepFilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PixResult | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [remaining, setRemaining] = useState(RESERVE_SECONDS);
  const numberRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cepAbortRef = useRef<AbortController | null>(null);
  const bumpAdded = items.some((item) => item.slug === ORDER_BUMP.slug);


  // Reaproveita o CEP/endereço simulado no carrinho.
  useEffect(() => {
    const saved = readAddress();
    if (!saved) return;
    setForm((current) =>
      current.zip
        ? current
        : {
            ...current,
            zip: saved.zip,
            street: saved.street,
            district: saved.district,
            city: saved.city,
            state: saved.state,
          },
    );
    setCepFilled(true);
  }, []);

  // Ninguém finaliza sem antes conhecer o produto: leva à PDP do primeiro item.
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    const pending = items.find((item) => item.slug !== ORDER_BUMP.slug && !hasVisited(item.slug));
    if (pending) void navigate({ to: "/$slug/p", params: { slug: pending.slug } });
  }, [hydrated, items, navigate]);

  // Reserva do preço promocional (urgência real e visível).
  useEffect(() => {
    const id = window.setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  /** Método de pagamento: PIX tem preço promocional; cartão volta ao preço normal. */
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const cardSubtotal = items.reduce(
    (sum, item) => sum + (item.listPrice > item.price ? item.listPrice : item.price) * item.quantity,
    0,
  );
  const effectiveSubtotal = method === "card" ? cardSubtotal : subtotal;
  const effectiveTotal = effectiveSubtotal + shipping;
  const savings = cardSubtotal - subtotal;
  const itemPrice = (item: (typeof items)[number]) =>
    method === "card" && item.listPrice > item.price ? item.listPrice : item.price;

  const update = (key: keyof FormState) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  /** Formata o CEP e dispara a busca do endereço ao completar 8 dígitos. */
  const onCepChange = (event: { target: { value: string } }) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm((current) => ({ ...current, zip: masked }));
    setFieldErrors((current) => ({ ...current, zip: undefined }));
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
    setFieldErrors((current) => ({ ...current, document: undefined }));
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
    setFieldErrors((current) => ({ ...current, phone: undefined }));
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
        erro?: boolean | string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (controller.signal.aborted) return;
      if (data.erro) {
        setFieldErrors((current) => ({ ...current, zip: "CEP não encontrado. Confira o número." }));
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
      saveAddress({
        zip: `${cep.slice(0, 5)}-${cep.slice(5)}`,
        street: data.logradouro ?? "",
        district: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      });
      // Leva o cliente direto ao campo que falta: número.
      numberRef.current?.focus();
    } catch {
      if (!controller.signal.aborted) {
        // Não trava a compra: deixa o cliente preencher manualmente.
        setCepFilled(true);
      }
    } finally {
      if (!controller.signal.aborted) setCepLoading(false);
    }
  };

  /** Valida os dados mínimos e aponta exatamente o campo com problema. */
  const validate = (): boolean => {
    setError(null);
    if (items.length === 0) {
      setError("Sua cesta está vazia.");
      return false;
    }
    const next: FieldErrors = {};
    if (form.name.trim().split(" ").filter(Boolean).length < 2) next.name = "Informe nome e sobrenome.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "E-mail inválido.";
    if (form.document.replace(/\D/g, "").length < 11) next.document = "CPF incompleto.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Celular com DDD.";
    if (form.zip.replace(/\D/g, "").length < 8) next.zip = "CEP incompleto.";
    if (!form.street.trim()) next.street = "Informe a rua.";
    if (!form.number.trim()) next.number = "Informe o número.";
    if (!form.city.trim()) next.city = "Informe a cidade.";
    if (!form.state.trim()) next.state = "UF.";
    setFieldErrors(next);

    const first = Object.keys(next)[0];
    if (first) {
      const el = formRef.current?.querySelector<HTMLInputElement>(`[data-field="${first}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return false;
    }
    return true;
  };

  /** Avança de etapa validando somente o que a etapa exige. */
  const goTo = (next: 1 | 2 | 3 | 4) => {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextFromStep = () => {
    if (step === 1) {
      if (items.length === 0) {
        setError("Sua cesta está vazia.");
        return;
      }
      trackInitiateCheckout(effectiveTotal, items);
      goTo(2);
      return;
    }
    if (step === 2) {
      if (!validate()) return;
      goTo(3);
      return;
    }
    if (step === 3) {
      goTo(4);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== 4) {
      nextFromStep();
      return;
    }
    if (loading) return;
    if (!validate()) {
      setStep(2);
      return;
    }


    if (method === "card") {
      setCardOpen(true);
      return;
    }
    trackInitiateCheckout(effectiveTotal, items);
    setLoading(true);
    try {
      const result = await createPixPayment({
        data: {
          amount: effectiveTotal,
          shipping,
          payer: {
            name: form.name,
            email: form.email,
            taxId: form.document,
            phone: form.phone,
          },
          address: {
            zipCode: form.zip,
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            district: form.district,
            city: form.city,
            state: form.state,
          },
          items: items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });
      setPayment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const onPaid = () => {
    trackPurchase(effectiveTotal, items);
    clear();
    void navigate({ to: "/obrigado" });
  };

  const submitFromBar = () => formRef.current?.requestSubmit();

  const err = (key: keyof FormState) => fieldErrors[key];
  const cls = (key: keyof FormState, autofilled = false) =>
    err(key) ? "field-invalid" : autofilled && cepFilled ? "autofilled" : undefined;

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
    <div className="checkout-page has-sticky-bar">
      <nav className="breadcrumbs">
        <Link to="/">home</Link>
        <span>/</span>
        checkout
      </nav>

      <div className="checkout-head">
        <h1>checkout seguro</h1>
        <p className="checkout-steps-hint">
          <Lock aria-hidden size={14} /> ambiente criptografado · leva menos de 1 minuto
        </p>
      </div>

      <ol className="checkout-stepper">
        {(["carrinho", "identificação", "pagamento", "confirmação"] as const).map((label, index) => {
          const value = (index + 1) as 1 | 2 | 3 | 4;
          const state = step === value ? "current" : step > value ? "done" : "todo";
          return (
            <li key={label} className={`step-${state}`}>
              <button
                disabled={state === "todo"}
                type="button"
                onClick={() => state === "done" && goTo(value)}
              >
                <em>{state === "done" ? "✓" : value}</em>
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>


      {remaining > 0 && (
        <div className="checkout-reserve" role="status">
          <strong>preço promocional reservado</strong>
          <span>
            expira em <b>{clock}</b>
          </span>
        </div>
      )}

      <div className="checkout-layout">
        <div>
          <form className="checkout-form" ref={formRef} onSubmit={onSubmit}>
            {step === 1 && (
            <section className="checkout-form-section">
              <div className="checkout-form-heading">
                <span>1</span>
                <div>
                  <h3>sua cesta</h3>
                  <p>Confira os itens antes de continuar.</p>
                </div>
              </div>
              <ul className="step-cart">
                {items.map((item) => (
                  <li key={item.slug}>
                    <img alt={item.name} loading="lazy" src={item.image} width={64} height={64} />
                    <div>
                      <p>{item.name}</p>
                      <strong>{formatPrice(itemPrice(item) * item.quantity)}</strong>
                    </div>
                    <div className="step-cart-qty">
                      <button
                        aria-label="Diminuir"
                        type="button"
                        onClick={() => setQuantity(item.slug, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label="Aumentar"
                        type="button"
                        onClick={() => setQuantity(item.slug, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button className="step-cart-remove" type="button" onClick={() => remove(item.slug)}>
                      remover
                    </button>
                  </li>
                ))}
              </ul>
              {error && <p className="form-error">{error}</p>}
              <button className="checkout-button checkout-cta" type="submit">
                continuar para identificação
              </button>
              <Link className="step-back" to="/">
                continuar comprando
              </Link>
            </section>
            )}

            {step === 2 && (
            <>
            <section className="checkout-form-section">

              <div className="checkout-form-heading">
                <span>2</span>
                <div>
                  <h3>identificação</h3>
                  <p>Usamos seus dados apenas para emitir e entregar o pedido.</p>
                </div>

              </div>
              <label>
                <span>nome completo</span>
                <input
                  autoComplete="name"
                  className={cls("name")}
                  data-field="name"
                  placeholder="Seu nome completo"
                  value={form.name}
                  onChange={update("name")}
                />
                {err("name") && <em className="field-error">{err("name")}</em>}
              </label>
              <label>
                <span>e-mail</span>
                <input
                  autoComplete="email"
                  className={cls("email")}
                  data-field="email"
                  inputMode="email"
                  placeholder="voce@email.com"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                />
                {err("email") && <em className="field-error">{err("email")}</em>}
              </label>
              <div className="checkout-field-row city-state">
                <label>
                  <span>CPF</span>
                  <input
                    autoComplete="off"
                    className={cls("document")}
                    data-field="document"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={form.document}
                    onChange={onCpfChange}
                  />
                  {err("document") && <em className="field-error">{err("document")}</em>}
                </label>
                <label>
                  <span>celular com DDD</span>
                  <input
                    autoComplete="tel-national"
                    className={cls("phone")}
                    data-field="phone"
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={onPhoneChange}
                  />
                  {err("phone") && <em className="field-error">{err("phone")}</em>}
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
                  className={cls("zip")}
                  data-field="zip"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={form.zip}
                  onChange={onCepChange}
                />
                {err("zip") && <em className="field-error">{err("zip")}</em>}
              </label>
              <label>
                <span>rua</span>
                <input
                  autoComplete="address-line1"
                  className={cls("street", true)}
                  data-field="street"
                  placeholder="Rua / avenida"
                  value={form.street}
                  onChange={update("street")}
                />
                {err("street") && <em className="field-error">{err("street")}</em>}
              </label>
              <div className="checkout-field-row number-complement">
                <label>
                  <span>número</span>
                  <input
                    className={cls("number")}
                    data-field="number"
                    inputMode="numeric"
                    placeholder="123"
                    ref={numberRef}
                    value={form.number}
                    onChange={update("number")}
                  />
                  {err("number") && <em className="field-error">{err("number")}</em>}
                </label>
                <label>
                  <span>complemento <small>(opcional)</small></span>
                  <input placeholder="apto, bloco…" value={form.complement} onChange={update("complement")} />
                </label>
              </div>
              <label>
                <span>bairro</span>
                <input
                  autoComplete="address-level3"
                  className={cls("district", true)}
                  data-field="district"
                  placeholder="Bairro"
                  value={form.district}
                  onChange={update("district")}
                />
              </label>
              <div className="checkout-field-row city-state">
                <label>
                  <span>cidade</span>
                  <input
                    autoComplete="address-level2"
                    className={cls("city", true)}
                    data-field="city"
                    placeholder="Cidade"
                    value={form.city}
                    onChange={update("city")}
                  />
                  {err("city") && <em className="field-error">{err("city")}</em>}
                </label>
                <label>
                  <span>UF</span>
                  <input
                    autoComplete="address-level1"
                    className={cls("state", true)}
                    data-field="state"
                    maxLength={2}
                    placeholder="UF"
                    value={form.state}
                    onChange={update("state")}
                  />
                  {err("state") && <em className="field-error">{err("state")}</em>}
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="checkout-button checkout-cta" type="submit">
                continuar para pagamento
              </button>
              <button className="step-back" type="button" onClick={() => goTo(1)}>
                voltar para a cesta
              </button>
            </section>

            </>
            )}

            {step === 3 && (
            <section className="checkout-form-section checkout-payment-section">
              <div className="checkout-form-heading">
                <span>3</span>

                <div>
                  <h3>pagamento</h3>
                  <p>O desconto promocional é válido somente no PIX.</p>
                </div>
              </div>

              <div className="pay-methods" role="radiogroup" aria-label="Método de pagamento">
                <label className={method === "pix" ? "pay-method active" : "pay-method"}>
                  <input
                    checked={method === "pix"}
                    name="payment-method"
                    type="radio"
                    onChange={() => setMethod("pix")}
                  />
                  <div>
                    <strong>PIX</strong>
                    <span>aprovação imediata · desconto mantido</span>
                  </div>
                  <em>recomendado</em>
                </label>
                <label className={method === "card" ? "pay-method active" : "pay-method"}>
                  <input
                    checked={method === "card"}
                    name="payment-method"
                    type="radio"
                    onChange={() => setMethod("card")}
                  />
                  <div>
                    <strong>cartão de crédito</strong>
                    <span>preço normal, sem o desconto do PIX</span>
                  </div>
                </label>
              </div>
              {method === "card" && savings > 0 && (
                <p className="pay-warning">
                  No cartão você perde {formatPrice(savings)} de desconto. Pagando no PIX o total fica{" "}
                  <strong>{formatPrice(subtotal + shipping)}</strong>.
                </p>
              )}

              {error && <p className="form-error">{error}</p>}

              <button className="checkout-button checkout-cta" type="submit">
                revisar pedido
              </button>
              <button className="step-back" type="button" onClick={() => goTo(2)}>
                voltar para identificação
              </button>

              <ul className="checkout-assurances">
                <li>
                  <ShieldCheck aria-hidden size={16} /> pagamento processado com criptografia
                </li>
                <li>
                  <Truck aria-hidden size={16} /> envio em até 24h após a confirmação
                </li>
                <li>
                  <RefreshCcw aria-hidden size={16} /> 7 dias para troca ou devolução
                </li>
              </ul>
            </section>
            )}

            {step === 4 && (
            <section className="checkout-form-section">
              <div className="checkout-form-heading">
                <span>4</span>
                <div>
                  <h3>confirmação</h3>
                  <p>Revise os dados e finalize o pagamento.</p>
                </div>
              </div>

              <div className="confirm-block">
                <div>
                  <strong>dados</strong>
                  <span>{form.name}</span>
                  <span>{form.email}</span>
                  <span>
                    {form.document} · {form.phone}
                  </span>
                  <button type="button" onClick={() => goTo(2)}>
                    alterar
                  </button>
                </div>
                <div>
                  <strong>entrega</strong>
                  <span>
                    {form.street}, {form.number}
                    {form.complement ? ` · ${form.complement}` : ""}
                  </span>
                  <span>
                    {form.district} · {form.city}/{form.state} · {form.zip}
                  </span>
                  <button type="button" onClick={() => goTo(2)}>
                    alterar
                  </button>
                </div>
                <div>
                  <strong>pagamento</strong>
                  <span>{method === "pix" ? "PIX · aprovação imediata" : "cartão de crédito"}</span>
                  <span>total {formatPrice(effectiveTotal)}</span>
                  <button type="button" onClick={() => goTo(3)}>
                    alterar
                  </button>
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button className="checkout-button checkout-cta" disabled={loading} type="submit">
                {loading ? <Loader2 className="pix-spin" size={16} /> : <Lock aria-hidden size={16} />}
                {loading
                  ? "gerando pix…"
                  : method === "pix"
                    ? `pagar ${formatPrice(effectiveTotal)} com pix`
                    : `pagar ${formatPrice(effectiveTotal)} com cartão`}
              </button>
              <button className="step-back" type="button" onClick={() => goTo(3)}>
                voltar para pagamento
              </button>

              <ul className="checkout-assurances">
                <li>
                  <ShieldCheck aria-hidden size={16} /> pagamento processado com criptografia
                </li>
                <li>
                  <Truck aria-hidden size={16} /> envio em até 24h após a confirmação
                </li>
                <li>
                  <RefreshCcw aria-hidden size={16} /> 7 dias para troca ou devolução
                </li>
              </ul>
            </section>
            )}
          </form>


          {step === 3 && (
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
          )}

        </div>
      </div>

      {cardOpen && <CardModal amount={effectiveTotal} onClose={() => setCardOpen(false)} />}

      {payment && (
        <PixModal amount={effectiveTotal} payment={payment} onClose={() => setPayment(null)} onPaid={onPaid} />
      )}
    </div>

  );
}
