import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Shelf } from "@/components/Shelf";
import { BADGE_BEST_SELLER, BADGE_LANCAMENTO, PRODUCTS, type Product } from "@/data/site";
import { useCart } from "@/lib/cart";
import { discountPercent, formatPrice, installment } from "@/lib/format";

export interface ProductDetailProps {
  product: Product;
}

/** Página de produto (PDP) com galeria, seletor de SKU e recomendações. */
export function ProductDetail({ product }: ProductDetailProps) {
  const { add } = useCart();
  const gallery = useMemo(() => {
    const images = [product.imageLarge ?? product.image, ...(product.gallery ?? [])];
    return Array.from(new Set(images.filter(Boolean)));
  }, [product]);

  const [active, setActive] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [sku, setSku] = useState(0);

  const discount = discountPercent(product.listPrice, product.price);
  const badge =
    product.badge === "best-seller"
      ? { src: BADGE_BEST_SELLER, alt: "Best Seller" }
      : product.badge === "lancamento"
        ? { src: BADGE_LANCAMENTO, alt: "Lançamento" }
        : null;

  const related = useMemo(
    () =>
      PRODUCTS.filter((item) => item.category === product.category && item.slug !== product.slug)
        .slice(0, 4),
    [product],
  );

  return (
    <div className="product-page">
      <nav className="breadcrumbs" aria-label="Você está em">
        <Link to="/">home</Link>
        <span>/</span>
        <Link to="/$slug" params={{ slug: product.category }}>
          {product.category.replace(/-/g, " ")}
        </Link>
        <span>/</span>
        {product.name}
      </nav>

      <div className="product-detail">
        <div className="product-gallery">
          <div className="thumbnail-list">
            {gallery.map((image, index) => (
              <button
                aria-label={`Imagem ${index + 1}`}
                className={index === active ? "thumbnail active" : "thumbnail"}
                key={image}
                type="button"
                onClick={() => setActive(index)}
              >
                <img alt="" loading="lazy" src={image} />
              </button>
            ))}
          </div>
          <div className="detail-main-image">
            <img
              alt={product.name}
              decoding="async"
              fetchPriority="high"
              height={900}
              src={gallery[active] ?? product.image}
              width={900}
            />
            {discount > 0 && (
              <span className="marketing-discount-badge detail-discount-badge">
                <strong>{discount}%</strong>
                <small>OFF</small>
              </span>
            )}
            {badge && <img alt={badge.alt} className="detail-badge" loading="lazy" src={badge.src} />}
          </div>
        </div>

        <div className="product-information">
          <p className="detail-eyebrow">wepink</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>
          <p className="detail-list-price">{formatPrice(product.listPrice)}</p>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className="detail-installments">
            ou 6x de {formatPrice(installment(product.price))} sem juros
          </p>

          {product.skus && product.skus.length > 1 && (
            <fieldset className="sku-selector">
              <legend>{product.skus[0]?.variationName ?? "opções"}</legend>
              <div>
                {product.skus.map((option, index) => (
                  <button
                    className={index === sku ? "active" : undefined}
                    disabled={!option.available}
                    key={option.id}
                    type="button"
                    onClick={() => setSku(index)}
                  >
                    {option.variationValue ?? option.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="detail-buy-row">
            <div className="quantity-control detail-quantity">
              <button
                aria-label="Diminuir"
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span>{quantity}</span>
              <button aria-label="Aumentar" type="button" onClick={() => setQuantity((q) => q + 1)}>
                +
              </button>
            </div>
            <button
              className="buy-button detail-buy-button"
              type="button"
              onClick={() => add(product, quantity)}
            >
              adicionar à cesta
            </button>
          </div>

          <div className="purchase-benefits">
            <p>entrega para todo o brasil</p>
            <p>compra 100% segura</p>
            <p>produto original wepink</p>
            <p>até 6x sem juros</p>
          </div>
        </div>
      </div>

      <section className="product-about">
        <h2>sobre o produto</h2>
        <p className="about-lead">{product.fullDescription ?? product.description}</p>

        <div className="about-highlights">
          <div className="about-highlight">
            <span aria-hidden="true">✦</span>
            <strong>fragrância marcante</strong>
            <p>{product.description}</p>
          </div>
          <div className="about-highlight">
            <span aria-hidden="true">✦</span>
            <strong>produto original</strong>
            <p>fabricado pela wepink, com qualidade garantida e lacre de fábrica</p>
          </div>
          <div className="about-highlight">
            <span aria-hidden="true">✦</span>
            <strong>entrega em todo o brasil</strong>
            <p>compre no conforto de casa e receba com rastreio e segurança</p>
          </div>
        </div>

        <div className="about-usage">
          <h3>como usar</h3>
          <p>
            Aplique sobre a pele limpa e seca, em regiões de maior circulação como pulsos, pescoço e
            atrás das orelhas, para uma fixação prolongada. Reaplique ao longo do dia sempre que
            quiser reforçar a fragrância. Uso externo; evite contato com os olhos e mantenha fora
            do alcance de crianças.
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <Shelf className="recommendations" products={related} title="você também vai amar" />
      )}
    </div>
  );
}
