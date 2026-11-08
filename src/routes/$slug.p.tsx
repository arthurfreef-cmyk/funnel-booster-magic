import { createFileRoute, notFound } from "@tanstack/react-router";

import { ProductDetail } from "@/components/ProductDetail";
import { getProduct } from "@/data/site";

export const Route = createFileRoute("/$slug/p")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Produto indisponível | wepink" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    const title = `${product.name} | wepink`;
    return {
      meta: [
        { title },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "description", content: product.description },
        { property: "og:title", content: title },
        { property: "og:description", content: product.description },
        { property: "og:image", content: product.image },
        { name: "twitter:image", content: product.image },
      ],
    };
  },
  component: ProductRoute,
});

function ProductRoute() {
  const { product } = Route.useLoaderData();
  return <ProductDetail product={product} />;
}
