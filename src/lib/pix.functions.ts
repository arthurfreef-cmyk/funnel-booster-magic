import { createServerFn } from "@tanstack/react-start";

/**
 * Proxy seguro para a OmegaPay (https://app.omegapayments.com.br/api/v1).
 *
 * Regras de segurança aplicadas:
 * - As credenciais vivem apenas em `process.env`, lidas dentro do handler (nunca no bundle do cliente).
 * - O cliente recebe somente o necessário para pagar (id da transação, payload Pix e QR Code).
 * - A URL de upsell (quando configurada) só é revelada depois que o gateway confirma o pagamento.
 */
const API_BASE = "https://app.omegapayments.com.br/api/v1";

/** Erro amigável exibido ao usuário final, sem vazar detalhes internos do gateway. */
const GENERIC_ERROR = "Não foi possível gerar o Pix agora. Tente novamente em instantes.";

interface CreatePixInput {
  /** Valor total em centavos. */
  amount: number;
  customer?:
    | {
        name?: string | undefined;
        email?: string | undefined;
        document?: string | undefined;
        phone?: string | undefined;
      }
    | undefined;
}

interface CreatePixResult {
  /** ID da transação na OmegaPay (usado no polling de status). */
  hash: string;
  /** Payload copia-e-cola do Pix (EMV). */
  pixCode: string;
  /** URL/base64 da imagem do QR Code, quando o gateway devolve uma. */
  qrCodeImage: string | null;
  amount: number;
}

/** Dígitos verificadores mod11 — gera um CPF sintaticamente válido para checkout rápido. */
function randomCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const digit = (slice: number[]) => {
    const weightStart = slice.length + 1;
    const sum = slice.reduce((acc, n, i) => acc + n * (weightStart - i), 0);
    const rest = (sum * 10) % 11;
    return rest >= 10 ? 0 : rest;
  };
  const d1 = digit(base);
  const d2 = digit([...base, d1]);
  return [...base, d1, d2].join("");
}

function onlyDigits(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Lê as credenciais da OmegaPay; retorna null quando o ambiente não está configurado. */
function readCredentials(): { publicKey: string; secretKey: string } | null {
  const publicKey = process.env["OMEGAPAY_PUBLIC_KEY"];
  const secretKey = process.env["OMEGAPAY_SECRET_KEY"] ?? process.env["OMEGAPAY_API_KEY"];
  if (!publicKey || !secretKey) return null;
  return { publicKey, secretKey };
}

function authHeaders(creds: { publicKey: string; secretKey: string }): Record<string, string> {
  return {
    Accept: "application/json",
    "x-public-key": creds.publicKey,
    "x-secret-key": creds.secretKey,
  };
}

/** Identificador único da transação do lado da loja (exigido pela OmegaPay). */
function newIdentifier(): string {
  return `wepink-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const createPix = createServerFn({ method: "POST" })
  .inputValidator((input: CreatePixInput): CreatePixInput => {
    if (!input || typeof input.amount !== "number" || !Number.isFinite(input.amount)) {
      throw new Error("Valor inválido.");
    }
    // Limites defensivos: entre R$ 1,00 e R$ 50.000,00 (valor recebido em centavos).
    const amount = Math.round(input.amount);
    if (amount < 100 || amount > 5_000_000) {
      throw new Error("Valor fora do limite permitido.");
    }
    return { amount, customer: input.customer };
  })
  .handler(async ({ data }): Promise<CreatePixResult> => {
    const creds = readCredentials();
    if (!creds) {
      throw new Error("Pagamento indisponível no momento.");
    }

    const document = onlyDigits(data.customer?.document);
    const phone = onlyDigits(data.customer?.phone);
    // A OmegaPay trabalha com valores em reais (número decimal), não em centavos.
    const amountBrl = Math.round(data.amount) / 100;

    const payload = {
      identifier: newIdentifier(),
      amount: amountBrl,
      client: {
        name: data.customer?.name?.trim() || "Cliente Wepink",
        email: data.customer?.email?.trim() || `cliente_${Date.now()}@wepinkstore.com`,
        phone: phone.length >= 10 ? phone : "11999999999",
        document: document.length === 11 || document.length === 14 ? document : randomCpf(),
      },
      products: [
        {
          id: "wepink-pedido",
          name: "Pedido wepink",
          quantity: 1,
          price: amountBrl,
          physical: true,
        },
      ],
    };

    let response: Response;
    let raw = "";
    try {
      response = await fetch(`${API_BASE}/gateway/pix/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(creds) },
        body: JSON.stringify(payload),
      });
      raw = await response.text();
    } catch {
      // Falha de rede / gateway indisponível.
      throw new Error(GENERIC_ERROR);
    }

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    if (!response.ok) {
      console.error("[omegapay] pix/receive failed", response.status, raw.slice(0, 500));
      const detail = typeof parsed["message"] === "string" ? (parsed["message"] as string) : null;
      throw new Error(detail ? `${GENERIC_ERROR} (${detail})` : GENERIC_ERROR);
    }

    const pix = (parsed["pix"] ?? {}) as Record<string, unknown>;
    const hash = typeof parsed["transactionId"] === "string" ? parsed["transactionId"] : "";
    const pixCode = typeof pix["code"] === "string" ? pix["code"] : "";
    const image = typeof pix["image"] === "string" && pix["image"].length > 0 ? pix["image"] : null;

    if (!hash || !pixCode) {
      console.error("[omegapay] unexpected response shape", raw.slice(0, 500));
      throw new Error(GENERIC_ERROR);
    }

    return { hash, pixCode, qrCodeImage: image, amount: data.amount };
  });

interface CheckStatusResult {
  status: "paid" | "pending";
  redirectUrl: string | null;
}

export const checkPixStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { hash: string }) => {
    const hash = typeof input?.hash === "string" ? input.hash.trim() : "";
    if (!hash || hash.length > 128) throw new Error("Transação inválida.");
    return { hash };
  })
  .handler(async ({ data }): Promise<CheckStatusResult> => {
    const creds = readCredentials();
    if (!creds) return { status: "pending", redirectUrl: null };

    try {
      const url = `${API_BASE}/gateway/transactions?id=${encodeURIComponent(data.hash)}`;
      const response = await fetch(url, { method: "GET", headers: authHeaders(creds) });
      if (!response.ok) return { status: "pending", redirectUrl: null };

      const body = (await response.json()) as Record<string, unknown>;
      const status = typeof body["status"] === "string" ? body["status"].toUpperCase() : "";
      if (status !== "COMPLETED") return { status: "pending", redirectUrl: null };

      // A URL de upsell é secreta: só é entregue ao cliente após confirmação de pagamento.
      return { status: "paid", redirectUrl: process.env["OMEGAPAY_UPSELL_URL"] ?? null };
    } catch {
      return { status: "pending", redirectUrl: null };
    }
  });
