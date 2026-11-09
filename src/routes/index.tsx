import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { HeroSlider } from "@/components/HeroSlider";
import { Shelf } from "@/components/Shelf";
import { BEST_SELLERS, FAVORITES, FEATURED } from "@/data/site";
import { discountPercent, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function Newsletter() {
  const [sent, setSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (form.elements.namedItem("newsletter-email") as HTMLInputElement).value.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (phoneDigits.length < 10) {
      setError("Informe um telefone válido com DDD.");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <section className="newsletter-section">
      <span className="newsletter-eyebrow">clube wepink</span>\n      <h2>receba ofertas e lançamentos em primeira mão</h2>
      <p className="newsletter-subtitle">
        novidades, lançamentos e ofertas especiais direto no seu e-mail e WhatsApp.
      </p>
      <form onSubmit={onSubmit}>
        <input
          aria-label="Seu nome"
          name="newsletter-name"
          placeholder="seu nome"
          required
          maxLength={80}
        />
        <input
          aria-label="Seu e-mail"
          name="newsletter-email"
          placeholder="seu melhor e-mail"
          required
          type="email"
          maxLength={120}
        />
        <input
          aria-label="Seu WhatsApp"
          inputMode="tel"
          name="newsletter-phone"
          placeholder="seu whatsapp (ddd)"
          required
          type="tel"
          value={phone}
          onChange={(event) => setPhone(maskPhone(event.target.value))}
        />
        <button type="submit">quero receber</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      {sent && <p className="form-success">Cadastro validado. A ativação do recebimento de novidades ainda precisa ser concluída.</p>}
    </section>
  );
}

function CustomerReviews() {
  return (
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-heading">
        <span>quem usa, conta</span>
        <h2 id="reviews-title">experiências que falam por si</h2>
        <p>Confira opiniões publicadas por clientes na loja oficial Wepink.</p>
      </div>
      <div className="reviews-grid">
        <article className="review-card">
          <div className="review-stars" aria-label="5 de 5 estrelas">★★★★★</div>
          <p className="review-quote">“Delicioso o aroma!!!! E o fixador muito bom!”</p>
          <div className="review-author"><strong>Mônica A.</strong><span>compra verificada</span></div>
          <a href="https://www.wepink.com.br/desod-body-splash-obsessed-deluxe-200-ml---wepink-105/p?pp=1" target="_blank" rel="noreferrer noopener">Body Splash Obsessed Deluxe ↗</a>
        </article>
        <article className="review-card">
          <div className="review-stars" aria-label="5 de 5 estrelas">★★★★★</div>
          <p className="review-quote">“Maravilhoso, doce na medida certa. Sem ser enjoativo.”</p>
          <div className="review-author"><strong>Jerusa M.</strong><span>compra verificada</span></div>
          <a href="https://www.wepink.com.br/body-splash-obsessed-gold-200-ml-wepink/p?sck=1766016000525.269815.91&src=" target="_blank" rel="noreferrer noopener">Body Splash Obsessed Gold ↗</a>
        </article>
        <article className="review-card">
          <div className="review-stars" aria-label="5 de 5 estrelas">★★★★★</div>
          <p className="review-quote">“Cheiro maravilhoso, a pele fica macia e limpinha.”</p>
          <div className="review-author"><strong>Fernanda P.</strong><span>compra verificada</span></div>
          <a href="https://www.wepink.com.br/sabonete-facial-cleanser-essential/p?idsku=42537925" target="_blank" rel="noreferrer noopener">Cleanser Essential ↗</a>
        </article>
      </div>
      <a className="reviews-more" href="https://www.wepink.com.br/" target="_blank" rel="noreferrer noopener">ver produtos e avaliações na loja oficial ↗</a>
      <p className="reviews-disclaimer">Trechos de avaliações de clientes exibidas nas páginas dos respectivos produtos na loja oficial.</p>
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

      <CustomerReviews />
    </>
  );
}
