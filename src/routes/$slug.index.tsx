import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { CATEGORIES, INSTITUTIONAL, PRODUCTS, getProduct } from "@/data/site";

type Sort = "relevancia" | "menor" | "maior" | "desconto";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/$slug/")({
  loader: ({ params }) => {
    const { slug } = params;
    if (CATEGORIES.some((c) => c.slug === slug)) return { kind: "category" as const, slug };
    if (INSTITUTIONAL[slug]) return { kind: "institutional" as const, slug };
    if (getProduct(slug)) return { kind: "product" as const, slug };
    throw notFound();
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Página não encontrada | wepink" }, { name: "robots", content: "noindex" }] };
    }
    const label = loaderData.slug.replace(/-/g, " ");
    const title =
      loaderData.kind === "institutional"
        ? `${INSTITUTIONAL[loaderData.slug]!.title} | wepink`
        : `${label} | wepink`;
    const description =
      loaderData.kind === "institutional"
        ? INSTITUTIONAL[loaderData.slug]!.paragraphs[0]!
        : `Compre ${label} wepink com descontos exclusivos e entrega para todo o Brasil.`;
    return {
      meta: [
        { title },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: SlugRoute,
});

function SlugRoute() {
  const data = Route.useLoaderData();
  if (data.kind === "product") return <ProductDetail product={getProduct(data.slug)!} />;
  if (data.kind === "institutional") return <Institutional slug={data.slug} />;
  return <Catalog slug={data.slug} />;
}

function Institutional({ slug }: { slug: string }) {
  const page = INSTITUTIONAL[slug]!;
  const isSupport = slug === "central-de-ajuda";
  const isStores = slug === "nossas-lojas";

  return (
    <div className={`institutional-page ${isSupport ? "support-page" : ""} ${isStores ? "stores-page" : ""}`}>
      <nav className="breadcrumbs">
        <Link to="/">home</Link>
        <span>/</span>
        {page.title}
      </nav>
      <article>
        <p className="detail-eyebrow">wepink</p>
        <h1>{page.title}</h1>
        {isSupport ? (
          <>
            <p>Precisa de ajuda com seu pedido, entrega, pagamento ou produto? Escolha o canal que for melhor para você. Nossa equipe está pronta para atender.</p>
            <div className="institutional-contact-grid">
              <a className="institutional-contact-card primary-contact" href="https://api.whatsapp.com/send/?phone=5511995564258" target="_blank" rel="noreferrer noopener">
                <span className="institutional-card-icon" aria-hidden>✆</span>
                <span className="institutional-card-label">whatsapp</span>
                <strong>(11) 99556-4258</strong>
                <small>Atendimento todos os dias, das 08h às 20h</small>
                <span className="institutional-card-action">conversar agora ↗</span>
              </a>
              <a className="institutional-contact-card" href="tel:08001000146">
                <span className="institutional-card-icon" aria-hidden>☎</span>
                <span className="institutional-card-label">telefone gratuito</span>
                <strong>0800 100 0146</strong>
                <small>Atendimento todos os dias, das 08h às 20h</small>
                <span className="institutional-card-action">ligar agora ↗</span>
              </a>
              <a className="institutional-contact-card" href="mailto:atendimento@wepink.com.br">
                <span className="institutional-card-icon" aria-hidden>✉</span>
                <span className="institutional-card-label">e-mail</span>
                <strong>atendimento@wepink.com.br</strong>
                <small>Envie sua dúvida para nossa equipe</small>
                <span className="institutional-card-action">enviar e-mail ↗</span>
              </a>
            </div>
            <div className="institutional-help-note">
              <strong>Quer consultar respostas antes de falar com a equipe?</strong>
              <p>Acesse a central de ajuda oficial para encontrar orientações sobre pedidos, entregas, pagamentos, trocas e devoluções.</p>
              <a href="https://www.wepink.com.br/central-de-ajuda" target="_blank" rel="noreferrer noopener">acessar central de ajuda ↗</a>
            </div>
          </>
        ) : isStores ? (
          <>
            <p>Encontre uma loja ou quiosque Wepink perto de você. Consulte os endereços e confira as unidades disponíveis diretamente no localizador oficial.</p>
            <div className="institutional-store-panel">
              <div className="store-pin" aria-hidden>⌖</div>
              <div>
                <span className="institutional-card-label">lojas e quiosques</span>
                <h2>Seu mundo rosa, também pertinho de você.</h2>
                <p>Veja as unidades, consulte os endereços e planeje sua visita.</p>
                <a className="institutional-primary-button" href="https://www.wepink.com.br/nossas-lojas" target="_blank" rel="noreferrer noopener">encontrar uma loja ↗</a>
              </div>
            </div>
            <p className="institutional-store-footnote">A disponibilidade de produtos e o estoque podem variar de uma unidade para outra. Para confirmar um item específico, entre em contato com a loja antes da visita.</p>
          </>
        ) : (
          page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        )}
      </article>
    </div>
  );
}

function Catalog({ slug }: { slug: string }) {
  const [sort, setSort] = useState<Sort>("relevancia");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const category = CATEGORIES.find((c) => c.slug === slug)!;

  const products = useMemo(() => {
    const list = PRODUCTS.filter(
      (product) => product.category === slug || product.categories?.includes(slug),
    );
    const sorted = [...list];
    if (sort === "menor") sorted.sort((a, b) => a.price - b.price);
    if (sort === "maior") sorted.sort((a, b) => b.price - a.price);
    if (sort === "desconto")
      sorted.sort((a, b) => b.listPrice - b.price - (a.listPrice - a.price));
    return sorted;
  }, [slug, sort]);

  return (
    <div className="catalog-page">
      <nav className="breadcrumbs">
        <Link to="/">home</Link>
        <span>/</span>
        {category.label}
      </nav>
      <header className="catalog-header">
        <div>
          <p>categoria</p>
          <h1>{category.label}</h1>
        </div>
        <label>
          ordenar por
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="relevancia">relevância</option>
            <option value="menor">menor preço</option>
            <option value="maior">maior preço</option>
            <option value="desconto">maior desconto</option>
          </select>
        </label>
      </header>

      <div className="catalog-layout">
        <aside className="catalog-filters">
          <h2>categorias</h2>
          {CATEGORIES.map((item) => (
            <Link key={item.slug} to="/$slug" params={{ slug: item.slug }}>
              {item.label}
            </Link>
          ))}
        </aside>
        <div>
          <p className="results-total">{products.length} produtos encontrados</p>
          {products.length === 0 ? (
            <div className="no-results">
              <h2>nada por aqui ainda</h2>
              <p>Explore outras categorias da loja.</p>
              <Link to="/">voltar para a home</Link>
            </div>
          ) : (
            <>
              <div className="catalog-grid">
                {products.slice(0, visible).map((product, index) => (
                  <ProductCard key={product.slug} priority={index < 3} product={product} />
                ))}
              </div>
              {visible < products.length && (
                <button
                  className="load-more"
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  carregar mais
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
