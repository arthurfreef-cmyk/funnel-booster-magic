import { Check, Copy, Loader2, X } from "lucide-react";
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

export function PixModal({ payment, amount, onClose, onPaid }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(payment.copypaste, { width: 320, margin: 1 }).then((url) => {
      if (active) setQr(url);
    });
    return () => {
      active = false;
    };
  }, [payment.copypaste]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payment.copypaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage("Não foi possível copiar. Selecione o código manualmente.");
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
      setMessage("Ainda não identificamos o pagamento. Se você já pagou, aguarde alguns segundos e tente de novo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao consultar o pagamento.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="pix-overlay" role="dialog" aria-modal="true" aria-label="Pagamento via PIX">
      <div className="pix-modal">
        <button aria-label="fechar" className="pix-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <h3>pague com pix</h3>
        <p className="pix-amount">{formatPrice(amount)}</p>
        {qr ? <img alt="QR Code PIX" className="pix-qr" src={qr} /> : <div className="pix-qr-skeleton" />}
        <p className="pix-hint">Escaneie o QR Code no app do seu banco ou copie o código abaixo.</p>
        <code className="pix-code">{payment.copypaste}</code>
        <button className="pix-copy" type="button" onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "código copiado" : "copiar código pix"}
        </button>
        <button className="checkout-button" disabled={checking} type="button" onClick={confirm}>
          {checking ? <Loader2 className="pix-spin" size={16} /> : null}
          {checking ? "verificando…" : "já fiz o pagamento"}
        </button>
        {message && <p className="form-error">{message}</p>}
      </div>
    </div>
  );
}
