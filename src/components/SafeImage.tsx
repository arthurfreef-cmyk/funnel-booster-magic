import { useState, type ImgHTMLAttributes } from "react";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23fff4f8'/%3E%3Crect x='185' y='150' width='230' height='300' rx='28' fill='%23f8dce8' stroke='%23e9a9c5' stroke-width='5'/%3E%3Cpath d='M250 150v-35h100v35' fill='none' stroke='%23d87aa3' stroke-width='12'/%3E%3Ctext x='300' y='500' text-anchor='middle' fill='%23b45b82' font-family='Arial,sans-serif' font-size='25' font-weight='bold'%3Ewepink%3C/text%3E%3C/svg%3E";

type Props = ImgHTMLAttributes<HTMLImageElement>;

/** Evita ícones de imagem quebrada quando um CDN externo falha. */
export function SafeImage({ src, alt = "", onError, ...props }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      {...props}
      alt={alt}
      src={failed || !src ? FALLBACK_IMAGE : src}
      onError={(event) => {
        if (!failed) setFailed(true);
        onError?.(event);
      }}
    />
  );
}
