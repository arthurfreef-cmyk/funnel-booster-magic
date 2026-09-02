import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { createPix, checkPixStatus } from "@/lib/pix.functions";
import { formatPrice } from "@/lib/format";

export interface PixButtonProps {
  /** Valor total do pedido em reais. */
  amount: number;
  customer?:
    | {
        name?: string | undefined;
        email?: string | undefined;
        document?: string | undefined;
        phone?: string | undefined;
      }
    | undefined;
  onBeforeCreate?: (() => boolean) | undefined;
  onPaid?: (() => void) | undefined;
}

interface PixSession {
  hash: string;
  pixCode: string;
  qrCodeImage: string | null;
}

const POLL_MS = 3000;

/** Preserva UTMs da URL atual no redirecionamento pós-pagamento. */
function withCurrentParams(url: string): string {
  try {
    const target = new URL(url);
    const current = new URLSearchParams(window.location.search);
    current.forEach((value, key) => {
      if (!target.searchParams.has(key)) target.searchParams.set(key, value);
    });
    return target.toString();
  } catch {
    return url;
  }
}

export function PixButton({ amount, customer, onBeforeCreate, onPaid }: PixButtonProps) {
  const create = useServerFn(createPix);
  const check = useServerFn(checkPixStatus);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PixSession | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // Gera a imagem do QR Code localmente quando o gateway não devolve uma.
  useEffect(() => {
    if (!session) {
      setQrImage(null);
      return;
    }
    if (session.qrCodeImage) {
      const src = session.qrCodeImage.startsWith("data:")
        ? session.qrCodeImage
        : `data:image/png;base64,${session.qrCodeImage}`;
      setQrImage(src);
      return;
    }
    let active = true;
    QRCode.toDataURL(session.pixCode, { width: 320, margin: 1 })
      .then((url) => {
        if (active) setQrImage(url);
      })
      .catch(() => {
        if (active) setQrImage(null);
      });
    return () => {
      active = false;
    };
  }, [session]);

  // Polling de status a cada 3s enquanto o modal estiver aberto.
  useEffect(() => {
    if (!session || paid) return;
    pollRef.current = setInterval(() => {
      void check({ data: { hash: session.hash } })
        .then((result) => {
          if (result.status !== "paid") return;
          stopPolling();
          setPaid(true);
          onPaid?.();
          if (result.redirectUrl) {
            window.location.href = withCurrentParams(result.redirectUrl);
          }
        })
        .catch(() => {
          /* falha transitória: mantém o polling */
        });
    }, POLL_MS);
    return stopPolling;
  }, [session, paid, check, stopPolling, onPaid]);

  const handleGenerate = async () => {
    if (onBeforeCreate && !onBeforeCreate()) return;
    setError(null);
    setLoading(true);
    try {
      const result = await create({
        data: { amount: Math.round(amount * 100), customer },
      });
      setSession({ hash: result.hash, pixCode: result.pixCode, qrCodeImage: result.qrCodeImage });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o Pix.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Copie o código manualmente.");
    }
  };

  const close = () => {
    stopPolling();
    setSession(null);
    setPaid(false);
  };

  return (
    <>
      <button className="checkout-button" disabled={loading} type="button" onClick={() => void handleGenerate()}>
        {loading ? "gerando Pix..." : `pagar ${formatPrice(amount)} com Pix`}
      </button>
      {error && <p className="form-error">{error}</p>}

      {session && (
        <div aria-modal="true" className="pix-overlay" role="dialog" onClick={close}>
          <div className="pix-modal" onClick={(event) => event.stopPropagation()}>
            <button aria-label="fechar" className="pix-close" type="button" onClick={close}>
              ×
            </button>
            {paid ? (
              <div className="pix-paid">
                <strong>pagamento confirmado ✓</strong>
                <p>Obrigado! Seu pedido já está em separação.</p>
              </div>
            ) : (
              <>
                <h3>pague com Pix</h3>
                <p className="pix-amount">{formatPrice(amount)}</p>
                {qrImage ? (
                  <img alt="QR Code Pix" className="pix-qr" height={240} src={qrImage} width={240} />
                ) : (
                  <div className="pix-qr pix-qr-loading">gerando QR Code...</div>
                )}
                <p className="pix-hint">Escaneie o QR Code no app do seu banco ou use o código abaixo.</p>
                <textarea readOnly className="pix-code" rows={3} value={session.pixCode} />
                <button className="checkout-button" type="button" onClick={() => void handleCopy()}>
                  {copied ? "código copiado ✓" : "copiar código Pix"}
                </button>
                <p className="pix-status">
                  <span className="pix-dot" /> aguardando pagamento...
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
