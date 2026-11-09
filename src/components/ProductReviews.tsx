import type { Product } from "@/data/site";

type Review = { author: string; date: string; rating: number; text: string };
type ReviewSet = { rating: string; count: string; recommendation: string; source: string; reviews: Review[] };

const PRODUCT_REVIEWS: Record<string, ReviewSet> = {
  "desod-body-splash-obsessed-deluxe-200-ml---wepink-105": {
    rating: "4,2/5",
    count: "612 avaliações",
    recommendation: "85%",
    source: "https://www.wepink.com.br/desod-body-splash-obsessed-deluxe-200-ml---wepink-105/p?pp=1",
    reviews: [
      { author: "Mônica R.", date: "27/05/2026", rating: 5, text: "Qualidade incrível por um bom preço. Delicioso o aroma!!!! E o fixador muito bom!" },
      { author: "Ana C.", date: "25/05/2026", rating: 5, text: "Amei, super recomendo." },
      { author: "Francisca J.", date: "12/05/2026", rating: 5, text: "Maravilhoso demais. O cheiro é marcante e chama atenção onde passa." },
    ],
  },
  "body-splash-obsessed-gold-200-ml-wepink": {
    rating: "4,5/5",
    count: "3.033 avaliações",
    recommendation: "93%",
    source: "https://www.wepink.com.br/body-splash-obsessed-gold-200-ml-wepink/p",
    reviews: [
      { author: "Jerusa M.", date: "13/05/2026", rating: 5, text: "Maravilhoso, doce na medida certa. Sem ser enjoativo, ideal para usar em dias frios. Comprarei novamente." },
      { author: "Leticia L.", date: "26/05/2026", rating: 5, text: "Cheiro de coisa cara, amei muito as notas dele!" },
      { author: "Isadora T.", date: "13/05/2026", rating: 3, text: "Cheiro bom, porém não fixa muito." },
    ],
  },
  "sabonete-facial-cleanser-essential": {
    rating: "4,8/5",
    count: "12.741 avaliações",
    recommendation: "97%",
    source: "https://www.wepink.com.br/sabonete-facial-cleanser-essential/p?idsku=42537925",
    reviews: [
      { author: "Fernanda P.", date: "20/08/2026", rating: 5, text: "Perfeito. Cheiro maravilhoso, a pele fica macia e limpinha, não fico sem." },
      { author: "Rita A.", date: "18/06/2026", rating: 5, text: "Os produtos são bons. Usei todo o kit todos os dias e estava vendo melhoras da minha pele." },
      { author: "Luciana F.", date: "12/06/2026", rating: 5, text: "O produto é bom e rende muito. Só uso ele e dou de presente pras amigas." },
    ],
  },
  "desod-col-celebrate-relics-100-ml---wepink-310": {
    rating: "4,5/5",
    count: "144 avaliações",
    recommendation: "86%",
    source: "https://www.wepink.com.br/desod-col-celebrate-relics-100-ml---wepink-310/p",
    reviews: [
      { author: "Fernanda D.", date: "01/09/2026", rating: 5, text: "Perfume doce mas não é enjoativo. Amo esse perfume, um dos meus preferidos!" },
      { author: "Renata B.", date: "01/09/2026", rating: 5, text: "Ele é bom, me surpreendeu, com cheirinho muito gostoso." },
      { author: "Danielle A.", date: "01/09/2026", rating: 4, text: "Ótimo. Perfume fixa na pele, cheiro ótimo." },
    ],
  },
};

function Stars({ value }: { value: number }) {
  return <span className="product-review-stars" aria-label={`${value} de 5 estrelas`}>{"★".repeat(value)}{"☆".repeat(5 - value)}</span>;
}

export function ProductReviews({ product }: { product: Product }) {
  const set = PRODUCT_REVIEWS[product.slug];

  return (
    <section className="product-reviews" aria-labelledby="product-reviews-title">
      <div className="product-reviews-heading">
        <div>
          <span className="product-reviews-eyebrow">opiniões de quem comprou</span>
          <h2 id="product-reviews-title">avaliações deste produto</h2>
          <p>Relatos publicados na página oficial deste mesmo produto.</p>
        </div>
        {set && <div className="product-review-score"><strong>{set.rating}</strong><Stars value={Number(set.rating[0])} /><small>{set.count}</small></div>}
      </div>
      {set ? (
        <>
          <div className="product-review-grid">
            {set.reviews.map((review) => (
              <article className="product-review-card" key={`${review.author}-${review.date}`}>
                <Stars value={review.rating} />
                <p>“{review.text}”</p>
                <div className="product-review-author"><strong>{review.author}</strong><span>compra verificada</span></div>
                <time>{review.date}</time>
              </article>
            ))}
          </div>
          <div className="product-reviews-foot">
            <span>{set.recommendation} dos clientes recomendam este produto</span>
            <a href={set.source} target="_blank" rel="noreferrer noopener">ver avaliações na loja oficial ↗</a>
          </div>
        </>
      ) : (
        <div className="product-reviews-empty">
          <p>Ainda não encontramos avaliações públicas verificáveis para este item específico.</p>
          <a href="https://www.wepink.com.br/" target="_blank" rel="noreferrer noopener">consultar a loja oficial ↗</a>
        </div>
      )}
      <p className="product-reviews-disclaimer">As avaliações exibidas são trechos de comentários publicados nas páginas oficiais dos produtos. As notas e quantidades podem mudar na loja original.</p>
    </section>
  );
}
