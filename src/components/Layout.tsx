import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";

import { SafeImage } from "@/components/SafeImage";
import { CartDrawer } from "@/components/CartDrawer";
import { PrizeWheel } from "@/components/PrizeWheel";
import {
  CART_ICON,
  CATEGORIES,
  LOGO_PRIMARY,
  LOGO_SECONDARY,
  PAYMENT_ICONS,
  SOCIAL_ICONS,
} from "@/data/site";
import { useCart } from "@/lib/cart";

const FOOTER_LINKS: { label: string; slug: string }[] = [
  { label: "sobre nós", slug: "sobre-nos" },
  { label: "central de ajuda", slug: "central-de-ajuda" },
  { label: "solicitação de troca", slug: "solicitaco-de-troca" },
  { label: "devolução com reembolso", slug: "solicitaco-de-devoluco-com-reembolso" },
  { label: "regulamentos", slug: "regulamentos" },
  { label: "franquias", slug: "franquias" },
  { label: "nossas lojas", slug: "nossas-lojas" },
  { label: "política de privacidade", slug: "politica-de-privacidade" },
  { label: "termos de uso", slug: "termos-de-uso" },
  { label: "wepink savi", slug: "wepink-savi" },
];

function SearchForm({ className = "search-form" }: { className?: string }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = term.trim();
    if (!q) return;
    void navigate({ to: "/busca", search: { q } });
  };

  return (
    <form className={className} role="search" onSubmit={onSubmit}>
      <span aria-hidden className="search-glyph">
        ⌕
      </span>
      <input
        aria-label="Buscar produtos"
        placeholder="o que você procura?"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
    </form>
  );
}

/** Casca da loja: anúncio, header, navegação, drawers e rodapé. */
export function Layout({ children }: { children: ReactNode }) {
  const { count, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // O checkout é uma sessão isolada: sem menu, busca, cesta ou rodapé da loja.
  if (pathname.startsWith("/checkout")) {
    return (
      <div className="checkout-shell">
        <header className="checkout-shell-header">
          <Link className="brand" to="/">
            <SafeImage alt="wepink" src={LOGO_PRIMARY} width={120} height={32} />
          </Link>
          <Link className="checkout-exit" to="/">
            sair do checkout
          </Link>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="storefront-shell">
      <p className="announcement desktop-announcement">
        <span>frete grátis acima de R$ 199</span>
        <span>
          até 6x sem juros <Link to="/$slug" params={{ slug: "kits" }}>ver kits</Link>
        </span>
        <span>parceria oficial wepink</span>
      </p>
      <p className="announcement mobile-announcement">frete grátis acima de R$ 199</p>

      <header className="site-header">
        <div className="desktop-header-row">
          <Link className="brand" to="/">
            <SafeImage alt="wepink" src={LOGO_PRIMARY} width={130} height={34} />
          </Link>
          <SearchForm />
          <Link className="service-link" to="/$slug" params={{ slug: "central-de-ajuda" }}>
            <span aria-hidden>☎</span> atendimento
          </Link>
          <Link className="service-link" to="/$slug" params={{ slug: "nossas-lojas" }}>
            <span aria-hidden>◎</span> nossas lojas
          </Link>
          <button
            aria-label="Abrir cesta"
            className="icon-button cart-button"
            type="button"
            onClick={openDrawer}
          >
            <SafeImage alt="" className="cart-icon-image" src={CART_ICON} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>
        </div>

        <div className="mobile-header-row">
          <button
            aria-label="Abrir menu"
            className="hamburger"
            type="button"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <Link className="mobile-brand" to="/">
            <SafeImage alt="wepink" src={LOGO_PRIMARY} width={90} height={24} />
          </Link>
          <div className="mobile-actions">
            <button
              aria-label="Abrir cesta"
              className="icon-button cart-button"
              type="button"
              onClick={openDrawer}
            >
              <SafeImage alt="" className="cart-icon-image" src={CART_ICON} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
          </div>
        </div>
        <SearchForm className="search-form mobile-search" />

        <nav className="category-nav" aria-label="Categorias">
          {CATEGORIES.map((category) => (
            <Link key={category.slug} to="/$slug" params={{ slug: category.slug }}>
              {category.label}
            </Link>
          ))}
        </nav>
      </header>

      {menuOpen && (
        <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            aria-label="Fechar menu"
            className="drawer-scrim"
            type="button"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="mobile-menu">
            <div className="drawer-heading">
              <SafeImage alt="wepink" src={LOGO_PRIMARY} />
              <button aria-label="Fechar" type="button" onClick={() => setMenuOpen(false)}>
                ×
              </button>
            </div>
            <nav>
              {CATEGORIES.map((category) => (
                <Link
                  key={category.slug}
                  to="/$slug"
                  params={{ slug: category.slug }}
                  onClick={() => setMenuOpen(false)}
                >
                  {category.label} <span aria-hidden>›</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main>{children}</main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#top">
              <SafeImage alt="wepink" src={LOGO_SECONDARY} width={150} height={40} loading="lazy" />
            </a>
            <div className="social-links">
              <a aria-label="Instagram" href="https://www.instagram.com/wepink/" rel="noreferrer noopener" target="_blank">
                <SafeImage alt="" src={SOCIAL_ICONS.instagram} loading="lazy" width={42} height={42} />
              </a>
              <a aria-label="Facebook" href="https://www.facebook.com/wepinkoficial" rel="noreferrer noopener" target="_blank">
                <SafeImage alt="" src={SOCIAL_ICONS.facebook} loading="lazy" width={42} height={42} />
              </a>
              <a aria-label="YouTube" href="https://www.youtube.com/@wepink" rel="noreferrer noopener" target="_blank">
                <SafeImage alt="" src={SOCIAL_ICONS.youtube} loading="lazy" width={42} height={42} />
              </a>
            </div>
          </div>
          <div className="footer-links">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.slug} to="/$slug" params={{ slug: link.slug }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="footer-payment">
            <button
              className="back-to-top"
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              voltar ao topo <span aria-hidden>↑</span>
            </button>
            <h3>formas de pagamento</h3>
            <div className="payment-icons">
              {PAYMENT_ICONS.map((icon) => (
                <SafeImage alt="" key={icon} loading="lazy" src={icon} width={48} height={36} />
              ))}
            </div>
          </div>
        </div>
        <div className="footer-policies">
          <Link to="/$slug" params={{ slug: "politica-de-privacidade" }}>
            política de privacidade
          </Link>
          <Link to="/$slug" params={{ slug: "termos-de-uso" }}>
            termos de uso
          </Link>
        </div>
        <div className="legal-copy">
          <p>
            wepink | Savi Cosméticos LTDA — CNPJ 42.359.211/0001-05. Preços e condições exclusivos
            para a loja online, podendo variar nas lojas físicas.
          </p>
          <p>Imagens meramente ilustrativas.</p>
        </div>
      </footer>

      <CartDrawer />
      <PrizeWheel />
    </div>
  );
}
