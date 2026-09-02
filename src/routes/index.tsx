import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { HeroSlider } from "@/components/HeroSlider";
import { Shelf } from "@/components/Shelf";
import { BEST_SELLERS, FAVORITES, FEATURED } from "@/data/site";
import { discountPercent, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "wepink | perfumaria, body splash e skincare com até 70% OFF" },
      {
        name: "description",
        content:
          "Perfumes, body splash, body cream, skincare e kits wepink com descontos exclusivos e entrega para todo o Brasil.",
      },
      { property: "og:title", content: "wepink | beleza e perfumaria com até 70% OFF" },
      {
        property: "og:description",
        content: "Descontos exclusivos em perfumaria, body splash, skincare e kits wepink.",
      },
    ],
  }),
  component: Home,
});

function Newsletter() {
  const [sent, setSent] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section className="newsletter-section">
      <h2>receba ofertas e lançamentos em primeira mão</h2>
      <form onSubmit={onSubmit}>
        <input aria-label="Seu nome" placeholder="seu nome" required />
        <input aria-label="Seu e-mail" placeholder="seu melhor e-mail" required type="email" />
        <button type="submit">quero receber</button>
      </form>
      {sent && <p className="form-success">Pronto! Você está na nossa lista. ♥</p>}
    </section>
  );
}

function Home() {
  const featuredDiscount = discountPercent(FEATURED.listPrice, FEATURED.price);

  return (
    <>
      <HeroSlider />

      <Shelf priority products={FAVORITES} title="os queridinhos wepink" />

      <section className="featured-section">
        <div className="featured-image">
          <img alt={FEATURED.name} loading="lazy" src={FEATURED.imageLarge ?? FEATURED.image} />
          {featuredDiscount > 0 && (
            <span className="marketing-discount-badge featured-discount-badge">
              <strong>{featuredDiscount}%</strong>
              <small>OFF</small>
            </span>
          )}
        </div>
        <div className="featured-copy">
          <h3>lançamento</h3>
          <h2>{FEATURED.name}</h2>
          <p>{FEATURED.description}</p>
          <strong>{formatPrice(FEATURED.price)}</strong>
          <Link to="/$slug/p" params={{ slug: FEATURED.slug }}>
            comprar agora
          </Link>
        </div>
      </section>

      <Shelf className="best-sellers-section" products={BEST_SELLERS} title="best sellers" />

      <Newsletter />

      <section className="instagram-section">
        <h2>@wepink</h2>
        <iframe
          className="instagram-frame"
          loading="lazy"
          src="https://www.instagram.com/wepink/embed"
          title="Instagram wepink"
        />
      </section>
    </>
  );
}
