import { Check, Copy, Loader2, Lock, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { getPixStatus, type PixResult } from "@/lib/pix.functions";
import { formatPrice } from "@/lib/format";

interface Props {
  payment: PixResult;
  amount: number;
  onClose: () => void;
  onPaid: () => void;
}

/** Tela dedicada de pagamento PIX dentro do fluxo de checkout. */
export function PixModal({ payment, amount, onClose, onPaid }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(payment.copypaste, { width: 360, margin: 2, errorCorrectionLevel: "H" }).then((url) => {
      if (active) setQr(url);
    }).catch(() => {
      if (active) setMessage("Não foi possível montar o QR Code. Use o código PIX abaixo.");
    });
    return () => { active = false; };
  }, [payment.copypaste]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payment.copypaste);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage("Não foi possível copiar automaticamente. Selecione o código PIX para copiar.");
    }
  };

  const confirm = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const { status } = await getPixStatus({ data: { id: payment.id } });
      if (status === "PAID") {
        onPaid();
        return;
      }
      setMessage("Pagamento ainda não identificado. Se você acabou de pagar, aguarde alguns instantes e consulte novamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível consultar o pagamento agora.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="pix-payment-page">
      <header className="pix-payment-header">
        <button className="pix-payment-back" type="button" onClick={onClose}>← voltar ao checkout</button>
        <div className="pix-payment-brand" aria-label="wepink">wepink<span>.</span></div>
        <div className="pix-payment-secure"><Lock size={13} /> ambiente seguro</div>
      </header>

      <div className="pix-payment-container">
        <nav className="pix-payment-progress" aria-label="Etapas da compra">
          <span className="complete"><i>✓</i> carrinho</span>
          <b />
          <span className="complete"><i>✓</i> identificação</span>
          <b />
          <span className="complete"><i>✓</i> pagamento</span>
          <b />
          <span><i>4</i> confirmação</span>
        </nav>

        <section className="pix-payment-intro">
          <span className="pix-payment-eyebrow">PAGAMENTO VIA PIX</span>
          <h1>Seu pedido está quase lá<span>!</span></h1>
          <p>Escaneie o QR Code ou copie o código PIX para concluir seu pagamento.</p>
        </section>

        <section className="pix-payment-card">
          <div className="pix-payment-main">
            <div className="pix-payment-status"><span /> aguardando pagamento</div>
            <h2>pague com PIX</h2>
            <p className="pix-payment-instruction">Abra o aplicativo do seu banco e escaneie o código abaixo.</p>
            <div className="pix-payment-qr-frame">
              {qr ? <img alt="QR Code para pagamento PIX" src={qr} /> : <div className="pix-payment-qr-loading"><Loader2 className="pix-spin" size={26} /> gerando QR Code…</div>}
            </div>
            <p className="pix-payment-qr-caption">O QR Code é exclusivo para este pedido.</p>
            <div className="pix-payment-divider"><span>ou pague com o código PIX</span></div>
            <label className="pix-payment-code-label" htmlFor="pix-payment-code">PIX copia e cola</label>
            <textarea id="pix-payment-code" className="pix-payment-code" readOnly value={payment.copypaste} onFocus={(event) => event.currentTarget.select()} />
            <button className="pix-payment-copy" type="button" onClick={copy}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "código copiado!" : "copiar código PIX"}
            </button>
          </div>

          <aside className="pix-payment-side">
            <span className="pix-payment-side-label">RESUMO DO PEDIDO</span>
            <p className="pix-payment-total-label">Total a pagar</p>
            <strong className="pix-payment-total">{formatPrice(amount)}</strong>
            <div className="pix-payment-side-line" />
            <div className="pix-payment-benefit"><ShieldCheck size={18} /><span>Pagamento processado com segurança</span></div>
            <div className="pix-payment-benefit"><Check size={18} /><span>Confirmação após identificação do banco</span></div>
            <div className="pix-payment-help">
              <strong>Como pagar?</strong>
              <ol>
                <li>Abra o app do seu banco.</li>
                <li>Escolha pagar com PIX e escaneie o QR Code ou cole o código.</li>
                <li>Confira o valor e confirme o pagamento.</li>
              </ol>
            </div>
            <button className="pix-payment-confirm" disabled={checking} type="button" onClick={confirm}>
              {checking ? <Loader2 className="pix-spin" size={17} /> : <Check size={17} />}
              {checking ? "consultando pagamento…" : "já fiz o pagamento"}
            </button>
            <p className="pix-payment-note">A confirmação depende do retorno da instituição financeira.</p>
          </aside>
        </section>
        {message && <p className="pix-payment-message" role="status">{message}</p>}
        <footer className="pix-payment-footer"><Lock size={13} /> seus dados e pagamento são tratados em ambiente seguro</footer>
      </div>
    </main>
  );
}
