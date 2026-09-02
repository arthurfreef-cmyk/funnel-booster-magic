import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "wepink-wheel-v1";

/** Rótulo e cor de cada fatia. O ponteiro fica às 12h e o giro é horário. */
interface Prize {
  readonly label: string;
  readonly tone: "light" | "dark" | "win";
}

const PRIZES: readonly Prize[] = [
  { label: "5% OFF", tone: "light" },
  { label: "FRETE GRÁTIS", tone: "dark" },
  { label: "10% OFF", tone: "light" },
  { label: "BRINDE", tone: "dark" },
  { label: "70% OFF", tone: "win" },
  { label: "15% OFF", tone: "dark" },
  { label: "20% OFF", tone: "light" },
  { label: "TENTE DE NOVO", tone: "dark" },
] as const;

const WINNING_INDEX = 4;
const SEGMENT = 360 / PRIZES.length;
const SPIN_MS = 2000;
const OFFER_SECONDS = 10 * 60;

const CX = 110;
const CY = 110;
const R = 100;

const TONE_FILL: Record<Prize["tone"], string> = {
  light: "#ffffff",
  dark: "#ffdfec",
  win: "#ec2d7f",
};

/** Converte ângulo (graus, 0 = topo, sentido horário) em coordenada no disco. */
function point(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
}

function slicePath(index: number): string {
  const start = index * SEGMENT;
  const end = start + SEGMENT;
  const [x1, y1] = point(start, R);
  const [x2, y2] = point(end, R);
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Roleta de presell exibida uma vez por visitante.
 * O resultado é sempre o maior desconto porque os preços da loja já o refletem.
 */
export function PrizeWheel() {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(false);
  const [remaining, setRemaining] = useState(OFFER_SECONDS);
  const discRef = useRef<SVGSVGElement | null>(null);
  const spinAnimationRef = useRef<Animation | null>(null);

  // Abre imediatamente na chegada (clique no anúncio). Uma vez por sessão do navegador,
  // para não travar o usuário que já girou dentro da mesma navegação.
  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      seen = null;
    }
    if (seen) return;
    setOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      spinAnimationRef.current?.cancel();
    };
  }, []);

  // Bloqueia o scroll do body enquanto o modal está aberto (essencial no mobile).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!won) return;
    const id = window.setInterval(() => setRemaining((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [won]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* armazenamento indisponível */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !spinning) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, spinning, close]);

  const spin = () => {
    if (spinning || won) return;
    const disc = discRef.current;
    if (!disc) return;

    setSpinning(true);
    // Pequeno desvio dentro da fatia para o giro não parecer calculado.
    const jitter = (Math.random() - 0.5) * (SEGMENT * 0.5);
    const center = WINNING_INDEX * SEGMENT + SEGMENT / 2;
    // Giro de 2s: 5 voltas completas com desaceleração suave até o prêmio.
    const target = 360 * 5 + (360 - center) + jitter;

    // A Web Animations API mantém todos os quadros no compositor do navegador.
    // Assim, rerenders do React ou regras globais de transição não interrompem o giro.
    const animation = disc.animate(
      [{ transform: "rotate(0deg)" }, { transform: `rotate(${target}deg)` }],
      {
        duration: SPIN_MS,
        easing: "cubic-bezier(.12,.7,.08,1)",
        fill: "forwards",
      },
    );
    spinAnimationRef.current = animation;
    animation.onfinish = () => {
      disc.style.transform = `rotate(${target % 360}deg)`;
      animation.cancel();
      spinAnimationRef.current = null;
      setSpinning(false);
      setWon(true);
    };
    animation.oncancel = () => {
      spinAnimationRef.current = null;
    };
  };

  const slices = useMemo(
    () =>
      PRIZES.map((prize, index) => {
        const center = index * SEGMENT + SEGMENT / 2;
        return { prize, index, center, d: slicePath(index) };
      }),
    [],
  );


  if (!open) return null;

  return (
    <div
      aria-label="Roleta de descontos wepink"
      aria-modal="true"
      className="drawer-layer wheel-layer"
      role="dialog"
    >
      <button aria-label="Fechar roleta" className="drawer-scrim" type="button" onClick={close} />
      <div className="wheel-modal">
        <button aria-label="Fechar" className="wheel-close" type="button" onClick={close}>
          ×
        </button>

        <span className="wheel-trust">✓ promoção oficial wepink</span>
        <h2>{won ? "desconto liberado!" : "gire e garanta seu desconto"}</h2>
        <p className="wheel-subtitle">
          {won
            ? "Aplicado automaticamente em todos os produtos da loja."
            : "Um giro por visitante. O prêmio é aplicado direto no carrinho."}
        </p>

        <div className="wheel-stage">
          <span aria-hidden className="wheel-pointer" />
          <svg
            aria-hidden
            className="wheel-disc"
            ref={discRef}
            viewBox="0 0 220 220"
          >
            <defs>
              {/* Recorte circular: garante que nenhum rótulo ou fatia saia do disco. */}
              <clipPath id="wheel-clip">
                <circle cx={CX} cy={CY} r={R} />
              </clipPath>
            </defs>
            <g clipPath="url(#wheel-clip)">
              {slices.map(({ prize, index, center, d }) => (
                <g key={prize.label}>
                  <path d={d} fill={TONE_FILL[prize.tone]} stroke="#ec2d7f" strokeWidth={1.2} />
                  {/* Rótulo radial: ocupa o comprimento da fatia, nunca invade a vizinha. */}
                  <g transform={`rotate(${center - 90} ${CX} ${CY})`}>
                    <text
                      className={prize.tone === "win" ? "wheel-text wheel-text-win" : "wheel-text"}
                      dominantBaseline="middle"
                      lengthAdjust="spacingAndGlyphs"
                      textAnchor="end"
                      textLength={prize.label.length > 8 ? 62 : undefined}
                      x={CX + R - 12}
                      y={CY}
                    >
                      {prize.label}
                    </text>
                  </g>
                  <circle
                    cx={point(index * SEGMENT, R - 6)[0]}
                    cy={point(index * SEGMENT, R - 6)[1]}
                    fill="#fff"
                    r={2.4}
                  />
                </g>
              ))}
            </g>
            <circle cx={CX} cy={CY} fill="#fff" r={20} stroke="#ec2d7f" strokeWidth={3} />
            <text className="wheel-hub" textAnchor="middle" x={CX} y={CY + 4}>
              wepink
            </text>

          </svg>
        </div>

        {won ? (
          <>
            <p className="wheel-result">
              Você ganhou <strong>{PRIZES[WINNING_INDEX]!.label}</strong> — válido por{" "}
              <strong>{formatClock(remaining)}</strong>.
            </p>
            <button className="checkout-button" type="button" onClick={close}>
              aproveitar agora
            </button>
          </>
        ) : (
          <button className="checkout-button" disabled={spinning} type="button" onClick={spin}>
            {spinning ? "girando..." : "girar a roleta"}
          </button>
        )}

        <p className="wheel-proof">
          <span aria-hidden className="wheel-dot" /> 1.284 pessoas giraram nas últimas 24h
        </p>
        <small>
          Promoção por tempo limitado, válida enquanto durarem os estoques e cumulativa apenas com o
          frete grátis acima de R$ 199.
        </small>
      </div>
    </div>
  );
}
