import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { HERO_SLIDES } from "@/data/site";

/**
 * Carrossel do topo da home. Auto-play pausável, imagens responsivas via
 * <picture> e aspect-ratio fixo para evitar CLS.
 */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const total = HERO_SLIDES.length;

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => window.clearInterval(id);
  }, [total]);

  const slide = HERO_SLIDES[index]!;

  return (
    <section aria-label="Destaques" className="hero">
      <Link to="/$slug" params={{ slug: slide.href.replace(/^\/|\/p$/g, "") }}>
        <picture>
          <source media="(max-width: 720px)" srcSet={slide.mobile} />
          <img
            alt={slide.alt}
            src={slide.desktop}
            width={2000}
            height={651}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        {index === 0 && (
          <div className="hero-black-friday-copy" aria-hidden="true">
            <span>BLACK FRIDAY WEPINK</span>
            <strong>seu momento mais rosa começa aqui</strong>
            <small>descubra os kits e ofertas especiais</small>
            <em>explorar ofertas <b>↗</b></em>
          </div>
        )}
      </Link>
      <button
        aria-label="Anterior"
        className="slider-arrow previous"
        type="button"
        onClick={() => setIndex((i) => (i - 1 + total) % total)}
      >
        ‹
      </button>
      <button
        aria-label="Próximo"
        className="slider-arrow next"
        type="button"
        onClick={() => setIndex((i) => (i + 1) % total)}
      >
        ›
      </button>
      <div className="slider-dots">
        {HERO_SLIDES.map((item, i) => (
          <button
            aria-label={`Ir para o banner ${i + 1}`}
            className={i === index ? "active" : undefined}
            key={item.desktop}
            type="button"
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
