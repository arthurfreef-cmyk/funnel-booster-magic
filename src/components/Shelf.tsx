import { useRef } from "react";

import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/data/site";

export interface ShelfProps {
  title: string;
  products: Product[];
  className?: string;
  priority?: boolean;
}

/** Prateleira de produtos com setas de rolagem (carrossel no mobile). */
export function Shelf({ title, products, className, priority = false }: ShelfProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: -1 | 1) => {
    const node = trackRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className={className ? `home-section ${className}` : "home-section"}>
      <h2>{title}</h2>
      <div className="shelf-wrap">
        <button
          aria-label="Produtos anteriores"
          className="shelf-arrow shelf-previous"
          type="button"
          onClick={() => scrollBy(-1)}
        >
          ‹
        </button>
        <div className="product-shelf" ref={trackRef}>
          {products.map((product) => (
            <ProductCard key={product.slug} priority={priority} product={product} />
          ))}
        </div>
        <button
          aria-label="Próximos produtos"
          className="shelf-arrow shelf-next"
          type="button"
          onClick={() => scrollBy(1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}
