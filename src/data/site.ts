/**
 * Dados estáticos da vitrine wepink (categorias, banners, curadoria e páginas
 * institucionais). Mantidos exatamente como no site original.
 */
import catalog from "./catalog.json";

export interface Sku {
  id: string;
  name: string;
  complement?: string;
  variationName?: string;
  variationValue?: string;
  image?: string;
  listPrice: number;
  price: number;
  available: boolean;
}

export interface Product {
  productId?: string;
  slug: string;
  name: string;
  description: string;
  fullDescription?: string;
  category: string;
  categories?: string[];
  listPrice: number;
  price: number;
  image: string;
  imageLarge?: string;
  gallery?: string[];
  available?: boolean;
  skus?: Sku[];
  badge?: "best-seller" | "lancamento";
}

export const CATEGORIES: { label: string; slug: string }[] = [
  { label: "kits", slug: "kits" },
  { label: "bath&body", slug: "292" },
  { label: "body splash", slug: "body-splash" },
  { label: "perfumaria", slug: "perfumaria" },
  { label: "skincare", slug: "skincare" },
  { label: "body cream", slug: "body-cream" },
  { label: "the cream", slug: "the-cream" },
  { label: "the oil", slug: "the-oil" },
  { label: "make", slug: "make" },
  { label: "hair", slug: "hair" },
  { label: "roll-on", slug: "roll-on" },
  { label: "bem-estar", slug: "bem-estar" },
];

export const HERO_SLIDES = [
  {
    href: "/kits",
    desktop:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/f2f928b4-f06c-4538-9213-bdc2e1a4fd07___225db6eba41f0bb3e83486f82ad17a51.gif",
    mobile:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/64f23f46-978d-4528-86ce-8c7c158e6630___47eac930867b275a4dd53a25f4266764.gif",
    alt: "Promo especial wepink em kits",
  },
  {
    href: "/desod-col-martin-magnetic---wepink-539/p",
    desktop:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/742a85f4-be96-4e3a-b36b-c9d6dbe31e5f___b9533b24d775d460dd2c818b35c61375.webp",
    mobile:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/ae8985ac-3e1c-4864-823c-bf406000b614___0e9ac07b8420776e3b5ae33d06283382.webp",
    alt: "Lançamento Martin Magnetic",
  },
  {
    href: "/perfumaria",
    desktop:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/ded9370a-5004-44b8-9e5f-4bea54c45590___53c6d0926d62fb473ed320ec062fb4f2.webp",
    mobile:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/08522625-c622-4219-b152-d52be01426bf___2a3fd53d54e7c459605dc38be3f67d79.webp",
    alt: "Promo especial em perfumaria",
  },
  {
    href: "/body-splash",
    desktop:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/c5db4690-0d8c-4ecb-8b0c-6eaef988bd01___008fec235dc1c6c53a30ae5ca6bfe2ba.png",
    mobile:
      "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/4403b6ec-e4c0-4f75-bfd1-a56ea47e1968___607deb7f610b139069d2a444784b83ad.png",
    alt: "Ofertas wepink",
  },
] as const;

export const BADGE_BEST_SELLER =
  "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/bc856ed5-1ae1-4fd5-98cd-d78cb296c835___07fc05144a64173b8aa15248b7cf507c.png";
export const BADGE_LANCAMENTO =
  "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/da717c5b-7b91-4583-86de-c453aae60a09___5def4b0ac57a13d909caaf912a1e46e8.png";

export const LOGO_PRIMARY =
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/logo-primary___5bd0e7fa6451ba181395889123dfe00a.svg";
export const LOGO_SECONDARY =
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/logo-secudary___ac59dd41f5f07fd458db11cb2919d3f1.svg";
export const CART_ICON =
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/mini-cart___f661ba60d07110abc8760b46c48d87cf.svg";

export const PAYMENT_ICONS = [
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/visa___e411afdf7f4f5a87e368bb90951f8e21.svg",
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/mastercard___bef22abd904b16a89535383905436dd7.svg",
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/diners-club___d5f0c1f692b4080d769cf5f1502612b4.svg",
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/amex___045d938b33e402cfa188a879eb063008.svg",
  "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/6.0.21/svg/pix___01c4699613640d38300e9f0e7f2a621d.svg",
];

export const SOCIAL_ICONS = {
  instagram:
    "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/4.0.2/svg/instagram___7414c911367adbfb6e2fb8d8ea73c773.svg",
  facebook:
    "https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/4.0.2/svg/facebook___6d7c4858762b8dffde03370b551efd02.svg",
  youtube:
    "https://wepink.vtexassets.com/assets/vtex.file-manager-graphql/images/19861d97-5ddd-4357-a4e7-0b04f868fa88___4bbaca8b5ceb429d7a5b6d4f3e985583.png",
};

/** Curadoria exibida nas prateleiras da home. */
const CURATED: Product[] = [
  {
    slug: "body-splash-vf-golden-desodorante-colonia-200ml---wepink-404",
    name: "Body Splash VF Golden Desodorante Colônia 200ml - Wepink",
    description: "um toque dourado para perfumar sua rotina",
    category: "body-splash",
    listPrice: 115,
    price: 33.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/164489-700-700?v=639147093283200000&width=700&height=700&aspect=true",
    badge: "best-seller",
  },
  {
    slug: "desod-col-ever-strong-100ml---wepink-502",
    name: "Ever Strong Desodorante Colônia 100ml - Wepink",
    description: "a fragrância amadeirada que traduz elegância e sofisticação contemporânea",
    category: "perfumaria",
    listPrice: 329,
    price: 92.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/164596-700-700?v=639153105742630000&width=700&height=700&aspect=true",
  },
  {
    slug: "booster-repair-oleo-capilar-30ml",
    name: "Booster Repair Óleo Capilar 30ml - Wepink",
    description: "fórmula exclusiva para cuidar dos cabelos com potência",
    category: "hair",
    listPrice: 129,
    price: 49.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/163818-700-700?v=639077109413800000&width=700&height=700&aspect=true",
    badge: "best-seller",
  },
  {
    slug: "desod-col-vallora-spell-100ml---wepink-511",
    name: "Vallora Spell Desodorante Colônia 100ml - Wepink",
    description: "o floral oriental frutado que transforma presença em memória",
    category: "perfumaria",
    listPrice: 329,
    price: 92.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/164886-700-700?v=639171462218670000&width=700&height=700&aspect=true",
    badge: "lancamento",
  },
  {
    slug: "body-splash-fatal-black-for-her-200ml---wepink-374",
    name: "Body Splash Fatal Black For Her Desodorante Colônia 200ml - Wepink",
    description: "para mulheres memoráveis",
    category: "body-splash",
    listPrice: 115,
    price: 33.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/162730-700-700?v=638991598255530000&width=700&height=700&aspect=true",
    badge: "best-seller",
  },
  {
    slug: "desod-col-perfect-peach---wepink-541",
    name: "Perfect Pear & Peach Desodorante Colônia 100ml - Wepink",
    description: "criado para mulheres que enxergam beleza nos pequenos momentos",
    category: "perfumaria",
    listPrice: 329,
    price: 92.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/165072-700-700?v=639208346455430000&width=700&height=700&aspect=true",
    badge: "lancamento",
  },
  {
    slug: "body-splash-obsessed",
    name: "Body Splash Obsessed Desodorante Colônia 200ml - Wepink",
    description: "revele a ousadia de uma pele bem perfumada",
    category: "body-splash",
    listPrice: 115,
    price: 33.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/162800-700-700?v=638991694649770000&width=700&height=700&aspect=true",
    badge: "best-seller",
  },
  {
    slug: "body-cream-vf-golden-200-ml---wepink-244",
    name: "Body Cream VF Golden Desodorante Hidratante 200ml - Wepink",
    description: "celebre uma hidratação extraordinária!",
    category: "body-cream",
    listPrice: 115,
    price: 35.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/159980-700-700?v=638756465018770000&width=700&height=700&aspect=true",
    badge: "best-seller",
  },
  {
    slug: "desod-col-heaven-blue-100ml---wepink-396",
    name: "Heaven Blue Desodorante Colônia 100ml - Wepink",
    description: "a paz do paraíso",
    category: "perfumaria",
    listPrice: 329,
    price: 92.9,
    image:
      "https://wepink.vtexassets.com/arquivos/ids/164561-700-700?v=639155042980070000&width=700&height=700&aspect=true",
    badge: "best-seller",
  },
  {
    slug: "desod-col-scarlette-radiance---wepink-535",
    name: "Scarlette Radiance Desodorante Colônia 50ml - Wepink",
    description: "uma fragrância para mulheres que iluminam tudo ao seu redor",
    category: "perfumaria",
    listPrice: 329,
    price: 92.9,
    image: "https://wepink.vtexassets.com/arquivos/ids/165009/Prancheta-2.webp?v=639198075209700000",
    imageLarge:
      "https://wepink.vtexassets.com/arquivos/ids/165009/Prancheta-2.webp?v=639198075209700000",
  },
];

const FULL_CATALOG = catalog as unknown as Product[];

/** Catálogo completo: curadoria enriquecida com os dados completos do produto. */
export const PRODUCTS: Product[] = [
  ...CURATED.map((item) => ({
    ...FULL_CATALOG.find((p) => p.slug === item.slug),
    ...item,
  })),
  ...FULL_CATALOG.filter((p) => !CURATED.some((c) => c.slug === p.slug)),
];

const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return BY_SLUG.get(slug);
}

export const FAVORITES = CURATED.slice(1, 5);
export const BEST_SELLERS = CURATED.slice(5, 9);
export const FEATURED = CURATED[CURATED.length - 1]!;

/** Produto usado como order bump na cesta. */
export const ORDER_BUMP =
  PRODUCTS.find((p) => p.slug.includes("eyeliner")) ??
  PRODUCTS.reduce((cheapest, p) => (p.price < cheapest.price ? p : cheapest), PRODUCTS[0]!);

export interface InstitutionalPage {
  title: string;
  paragraphs: string[];
}

export const INSTITUTIONAL: Record<string, InstitutionalPage> = {
  "sobre-nos": {
    title: "sobre nós",
    paragraphs: [
      "A wepink nasceu para tornar beleza, perfumaria e autocuidado parte de todos os dias.",
      "Nossa essência é criar produtos marcantes, acessíveis e feitos para acompanhar cada versão de você.",
    ],
  },
  "central-de-ajuda": {
    title: "central de ajuda",
    paragraphs: [
      "Encontre respostas sobre pedidos, entregas, pagamentos, produtos, trocas e devoluções.",
      "Se precisar de atendimento, fale com a equipe pelo telefone ou e-mail informados no rodapé.",
    ],
  },
  "solicitaco-de-troca": {
    title: "solicitação de troca",
    paragraphs: [
      "Solicite a troca do seu pedido informando o número da compra e o e-mail usado no checkout.",
    ],
  },
  "solicitaco-de-devoluco-com-reembolso": {
    title: "solicitação de devolução",
    paragraphs: ["Consulte os prazos e registre sua solicitação de devolução e reembolso."],
  },
  regulamentos: {
    title: "regulamentos",
    paragraphs: ["Confira aqui as regras e condições das campanhas promocionais vigentes."],
  },
  franquias: {
    title: "franquias",
    paragraphs: [
      "Conheça o modelo de franquias wepink e envie seu interesse em fazer parte da nossa expansão.",
    ],
  },
  "nossas-lojas": {
    title: "nossas lojas",
    paragraphs: [
      "Encontre a unidade wepink mais próxima e viva a experiência da marca presencialmente.",
    ],
  },
  "politica-de-privacidade": {
    title: "política de privacidade",
    paragraphs: [
      "Esta página reúne as informações sobre tratamento de dados, privacidade e seus direitos.",
    ],
  },
  "termos-de-uso": {
    title: "termos de uso",
    paragraphs: ["Consulte as condições aplicáveis ao uso da loja, compras, promoções e conteúdos."],
  },
  "wepink-savi": {
    title: "SAVI",
    paragraphs: ["Savi Cosméticos é a empresa responsável pela fabricação dos produtos wepink."],
  },
};

export const SHIPPING_FLAT = 14.9;
