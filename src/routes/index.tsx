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
      <h2>receba ofertas e lançamentos em primeira mão</h2>
      <p className="newsletter-subtitle">
        cadastre seu e-mail e whatsapp e fique por dentro de tudo antes de todo mundo
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
      {sent && <p className="form-success">Pronto! Você está na nossa lista. ♥</p>}
    </section>
  );
}

/** Só carrega o embed do Instagram quando ele chega perto da viewport. */
function InstagramEmbed() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <section className="instagram-section" ref={ref}>
      <h2>@wepink</h2>
      {visible && (
        <iframe
          className="instagram-frame"
          loading="lazy"
          src="https://www.instagram.com/wepink/embed"
          title="Instagram wepink"
        />
      )}
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

      <InstagramEmbed />
    </>
  );
}
