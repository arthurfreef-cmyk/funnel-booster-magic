import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

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
      <span className="newsletter-eyebrow">clube wepink</span>
      <h2>receba ofertas e lançamentos em primeira mão</h2>
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
  const videos = [
    {
      id: "Fyy4a8guutA",
      title: "Resenha Body Splash Obsessed Deluxe",
      creator: "Thati Peliciolli",
      product: "Obsessed Deluxe",
      description: "Resenha dedicada ao Body Splash Obsessed Deluxe, com primeiras impressões da fragrância.",
    },
    {
      id: "MRZK9SiRjag",
      title: "Primeiras impressões Obsessed Gold",
      creator: "Bianca Souza",
      product: "Obsessed Gold",
      description: "Avaliação em vídeo do Body Splash Obsessed Gold.",
    },
    {
      id: "weHUhB4knVs",
      title: "Resenha Body Splash Changes",
      creator: "Cris Nascimento",
      product: "Body Splash Changes",
      description: "Resenha em vídeo sobre o Body Splash Changes da Wepink.",
    },
  ];

  return (
    <section className="reviews-section video-reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-heading">
        <span>resenhas em vídeo</span>
        <h2 id="reviews-title">veja antes de escolher</h2>
        <p>Experiências e opiniões publicadas por criadores independentes sobre produtos Wepink.</p>
      </div>
      <div className="video-reviews-grid">
        {videos.map((video) => (
          <article className="video-review-card" key={video.id}>
            <div className="video-review-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="video-review-content">
              <span>{video.product}</span>
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <small>Vídeo público de {video.creator}</small>
              <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener">assistir no YouTube ↗</a>
            </div>
          </article>
        ))}
      </div>
      <p className="reviews-disclaimer">Conteúdos de terceiros incorporados a partir do YouTube. As opiniões são dos respectivos criadores e não representam publicidade oficial da loja.</p>
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
