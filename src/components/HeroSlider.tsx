import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { HERO_SLIDES } from "@/data/site";

/**
 * Carrossel do topo da home. Auto-play pausável, imagens responsivas via
 * <picture> e aspect-ratio fixo para evitar CLS.
 */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [wheelCompleted, setWheelCompleted] = useState(false);
  const total = HERO_SLIDES.length;

  useEffect(() => {
    const startBanners = () => setWheelCompleted(true);
    window.addEventListener("wepink-wheel-completed", startBanners);
    return () => window.removeEventListener("wepink-wheel-completed", startBanners);
  }, []);

  useEffect(() => {
    if (!wheelCompleted) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => window.clearInterval(id);
  }, [total, wheelCompleted]);

  const slide = HERO_SLIDES[index]!;

  return (
    <section aria-label="Destaques" className="hero">
      { "campaign" in slide && slide.campaign ? (
        <Link className="hero-black-friday-banner" to="/$slug" params={{ slug: "kits" }}>
          <span className="hero-bf-kicker">BLACK FRIDAY WEPINK</span>
          <strong>ofertas que você estava esperando.</strong>
          <span className="hero-bf-subtitle">seus favoritos com condições especiais por tempo limitado</span>
          <span className="hero-bf-cta">ver ofertas <b>↗</b></span>
          <span className="hero-bf-decoration" aria-hidden="true">W</span>
        </Link>
      ) : (
        <Link to="/$slug" params={{ slug: slide.href.replace(/^\//, "").replace(/\/p$/, "") }}>
          <picture>
            <source media="(max-width: 720px)" srcSet={slide.mobile} />
            <img
              alt={slide.alt}
              src={slide.desktop}
              width={2000}
              height={651}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
            />
          </picture>
        </Link>
      )}
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
