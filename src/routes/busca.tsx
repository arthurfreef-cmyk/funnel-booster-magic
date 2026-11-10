import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS } from "@/data/site";
import { trackSearch } from "@/lib/pixels";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/busca")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Busca | wepink" },
      { name: "description", content: "Encontre perfumes, body splash, skincare e kits wepink." },
      { property: "og:title", content: "Busca | wepink" },
      { property: "og:description", content: "Encontre seus produtos wepink favoritos." },
    ],
  }),
  component: SearchRoute,
});

function SearchRoute() {
  const { q } = Route.useSearch();
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (q.trim()) trackSearch(q, results.length);
  }, [q, results.length]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return PRODUCTS.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.category.includes(term),
    );
  }, [q]);

  return (
    <div className="catalog-page">
      <nav className="breadcrumbs">
        <Link to="/">home</Link>
        <span>/</span>
        busca
      </nav>
      <header className="catalog-header">
        <div>
          <p>resultados para</p>
          <h1>{q || "busca"}</h1>
        </div>
      </header>
      <div className="catalog-layout">
        <aside className="catalog-filters" />
        <div>
          <p className="results-total">{results.length} produtos encontrados</p>
          {results.length === 0 ? (
            <div className="no-results">
              <h2>nenhum resultado</h2>
              <p>Tente buscar por outro nome ou categoria.</p>
              <Link to="/">voltar para a home</Link>
            </div>
          ) : (
            <>
              <div className="catalog-grid">
                {results.slice(0, visible).map((product, index) => (
                  <ProductCard key={product.slug} priority={index < 3} product={product} />
                ))}
              </div>
              {visible < results.length && (
                <button className="load-more" type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
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
