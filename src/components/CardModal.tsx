import { CreditCard, Lock, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { formatPrice } from "@/lib/format";

interface CardModalProps {
  amount: number;
  onClose: () => void;
}

/** Modal de pagamento com cartão de crédito. */
export function CardModal({ amount, onClose }: CardModalProps) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onNumber = (value: string) => {
    const d = value.replace(/\D/g, "").slice(0, 16);
    setNumber(d.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
  };

  const onExpiry = (value: string) => {
    const d = value.replace(/\D/g, "").slice(0, 4);
    setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (number.replace(/\D/g, "").length < 13) {
      setError("Informe o número completo do cartão.");
      return;
    }
    if (!holder.trim()) {
      setError("Informe o nome impresso no cartão.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("Validade inválida. Use MM/AA.");
      return;
    }
    if (cvv.length < 3) {
      setError("CVV inválido.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setError(
        "Não foi possível autorizar o cartão no momento. Pague no PIX e garanta o preço promocional.",
      );
    }, 1200);
  };

  return (
    <div className="pix-overlay" role="dialog" aria-modal="true" aria-label="Pagamento com cartão">
      <div className="pix-modal card-modal">
        <button aria-label="Fechar" className="card-modal-close" type="button" onClick={onClose}>
          ×
        </button>
        <h2>
          <CreditCard aria-hidden size={18} /> pagamento com cartão
        </h2>
        <p className="card-modal-amount">
          total <strong>{formatPrice(amount)}</strong>
        </p>

        <form className="card-form" onSubmit={submit}>
          <label>
            <span>número do cartão</span>
            <input
              autoComplete="cc-number"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={number}
              onChange={(event) => onNumber(event.target.value)}
            />
          </label>
          <label>
            <span>nome impresso no cartão</span>
            <input
              autoComplete="cc-name"
              placeholder="Como está no cartão"
              value={holder}
              onChange={(event) => setHolder(event.target.value.toUpperCase())}
            />
          </label>
          <div className="card-form-row">
            <label>
              <span>validade</span>
              <input
                autoComplete="cc-exp"
                inputMode="numeric"
                placeholder="MM/AA"
                value={expiry}
                onChange={(event) => onExpiry(event.target.value)}
              />
            </label>
            <label>
              <span>CVV</span>
              <input
                autoComplete="cc-csc"
                inputMode="numeric"
                maxLength={4}
                placeholder="000"
                value={cvv}
                onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="checkout-button" disabled={loading} type="submit">
            {loading ? <Loader2 className="pix-spin" size={16} /> : null}
            {loading ? "processando…" : "pagar com cartão"}
          </button>
          <p className="card-modal-secure">
            <Lock aria-hidden size={14} /> seus dados são transmitidos com criptografia
          </p>
        </form>
      </div>
    </div>
  );
}
