import { Link } from "@tanstack/react-router";
import { memo } from "react";

import { BADGE_BEST_SELLER, BADGE_LANCAMENTO, CART_ICON, type Product } from "@/data/site";
import { discountPercent, formatPrice, installment } from "@/lib/format";

export interface ProductCardProps {
  product: Product;
  /** A primeira dobra carrega imagem com prioridade; o resto é lazy. */
  priority?: boolean;
}

function badgeSrc(badge: Product["badge"]): { src: string; alt: string } | null {
  if (badge === "best-seller") return { src: BADGE_BEST_SELLER, alt: "Best Sellers" };
  if (badge === "lancamento") return { src: BADGE_LANCAMENTO, alt: "Lançamento" };
  return null;
}

function ProductCardBase({ product, priority = false }: ProductCardProps) {
  const discount = discountPercent(product.listPrice, product.price);
  const badge = badgeSrc(product.badge);

  return (
    <article className="product-card">
      <Link className="product-image-link" to="/$slug/p" params={{ slug: product.slug }}>
        <img
          alt={product.name}
          className="product-image"
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          width={700}
          height={700}
          src={product.image}
        />
        {discount > 0 && (
          <span aria-label={`${discount}% de desconto`} className="marketing-discount-badge">
            <strong>{discount}%</strong>
            <small>OFF</small>
          </span>
        )}
        {badge && <img alt={badge.alt} className="product-badge" loading="lazy" src={badge.src} />}
      </Link>
      <div className="product-copy">
        <Link to="/$slug/p" params={{ slug: product.slug }}>
          <h3>{product.name}</h3>
        </Link>
        <p className="product-description">{product.description}</p>
        <p className="list-price">{formatPrice(product.listPrice)}</p>
        <p className="selling-price">
          {formatPrice(product.price)} <span>ou 6x {formatPrice(installment(product.price))}</span>
        </p>
      </div>
      <div className="product-actions">
        <Link className="buy-button" to="/$slug/p" params={{ slug: product.slug }}>
          Comprar
        </Link>
        <Link
          aria-label={`Ver detalhes de ${product.name}`}
          className="quick-add"
          to="/$slug/p"
          params={{ slug: product.slug }}
        >
          + <img alt="" className="cart-icon-image" loading="lazy" src={CART_ICON} />
        </Link>
      </div>

    </article>
  );
}

export const ProductCard = memo(ProductCardBase);
