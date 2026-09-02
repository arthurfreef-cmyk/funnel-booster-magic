/** Endereço de entrega salvo localmente após a simulação de frete no carrinho. */
export interface SavedAddress {
  zip: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

const KEY = "wepink-address-v1";

export function saveAddress(address: SavedAddress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(address));
  } catch {
    /* armazenamento indisponível */
  }
}

export function readAddress(): SavedAddress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedAddress>;
    if (!parsed || typeof parsed.zip !== "string" || parsed.zip.length < 8) return null;
    return {
      zip: parsed.zip,
      street: parsed.street ?? "",
      district: parsed.district ?? "",
      city: parsed.city ?? "",
      state: parsed.state ?? "",
    };
  } catch {
    return null;
  }
}

/** Consulta o ViaCEP e devolve o endereço, ou null quando o CEP não existe. */
export async function lookupZip(digits: string, signal?: AbortSignal): Promise<SavedAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: signal ?? null });
  const data = (await response.json()) as {
    erro?: boolean | string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (data.erro) return null;
  return {
    zip: `${digits.slice(0, 5)}-${digits.slice(5)}`,
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}
