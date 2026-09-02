const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata valores em Real, no mesmo padrão do site original (R$ 92,90). */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return BRL.format(0);
  return BRL.format(value);
}

/** Percentual de desconto arredondado, usado nos selos "% OFF". */
export function discountPercent(listPrice: number, price: number): number {
  if (!listPrice || listPrice <= price) return 0;
  return Math.round(((listPrice - price) / listPrice) * 100);
}

/** Valor da parcela em 6x sem juros. */
export function installment(price: number, times = 6): number {
  return price / times;
}
