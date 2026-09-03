import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/data/site";
import { SHIPPING_FLAT } from "@/data/site";
import { trackAddToCart } from "@/lib/pixels";

export interface CartItem {
  slug: string;
  name: string;
  image: string;
  price: number;
  listPrice: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  drawerOpen: boolean;
  hydrated: boolean;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const STORAGE_KEY = "wepink-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as CartItem).slug === "string" &&
        typeof (item as CartItem).price === "number" &&
        typeof (item as CartItem).quantity === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // A leitura acontece só após a hidratação para evitar divergência SSR/cliente.
  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* armazenamento indisponível: o carrinho segue apenas em memória */
    }
  }, [items, hydrated]);

  const add = useCallback((product: Product, quantity = 1) => {
    const qty = Math.max(1, Math.trunc(quantity));
    setItems((current) => {
      const existing = current.find((item) => item.slug === product.slug);
      if (existing) {
        return current.map((item) =>
          item.slug === product.slug ? { ...item, quantity: item.quantity + qty } : item,
        );
      }
      return [
        ...current,
        {
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          listPrice: product.listPrice,
          quantity: qty,
        },
      ];
    });
    trackAddToCart({ name: product.name, slug: product.slug, price: product.price, quantity: qty });
    setDrawerOpen(true);
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.slug !== slug)
        : current.map((item) => (item.slug === slug ? { ...item, quantity } : item)),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = items.length > 0 ? SHIPPING_FLAT : 0;
    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      drawerOpen,
      hydrated,
      add,
      setQuantity,
      remove,
      clear: () => setItems([]),
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [items, drawerOpen, hydrated, add, setQuantity, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart precisa estar dentro de <CartProvider>.");
  }
  return context;
}
