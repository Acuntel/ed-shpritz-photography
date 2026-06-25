import type { CSSProperties } from "react";
import type { Photo } from "@/lib/types";

type Variant = "tile" | "grid" | "full";

// How much screen space each variant occupies — tells the browser which
// resolution to pull from the srcset.
const SIZES: Record<Variant, string> = {
  tile: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  grid: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  full: "100vw",
};

// Widths we ask Vercel's optimizer for, per variant. Every value here MUST be
// listed in next.config images.deviceSizes/imageSizes or the optimizer 400s.
const WIDTHS: Record<Variant, number[]> = {
  tile: [320, 640, 828, 1080],
  grid: [640, 1080, 1600, 2048],
  full: [1080, 1600, 2048, 2560, 3840],
};

const QUALITY = 72;

// Build a Vercel image-optimization URL. Works for both local /images/* paths
// and remote Vercel Blob URLs (allowed via next.config remotePatterns). Vercel
// serves AVIF/WebP automatically based on the browser's Accept header, so we no
// longer pre-bake variants with scripts/optimize.mjs — and we never serve the
// full-resolution print master to the page.
function optUrl(src: string, w: number): string {
  // Trailing slash on the path: next.config has trailingSlash:true, so
  // `/_next/image?…` 308-redirects to `/_next/image/?…`. Point straight at the
  // canonical to avoid a redirect on every single image.
  return `/_next/image/?url=${encodeURIComponent(src)}&w=${w}&q=${QUALITY}`;
}

export default function Picture({
  photo,
  variant,
  className = "",
  sizes,
  priority = false,
  style,
  raw = false,
}: {
  photo: Photo;
  variant: Variant;
  className?: string;
  sizes?: string;
  priority?: boolean;
  style?: CSSProperties;
  // Bypass optimization and serve the original file (used by private client
  // galleries, which are full-quality and downloadable by design).
  raw?: boolean;
}) {
  const aspect =
    photo.width && photo.height
      ? `${photo.width} / ${photo.height}`
      : undefined;

  const imgStyle: CSSProperties = {
    aspectRatio: aspect,
    backgroundImage: photo.lqip ? `url(${photo.lqip})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    ...style,
  };

  const common = {
    alt: photo.alt,
    className,
    draggable: false,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    decoding: "async" as const,
    style: imgStyle,
  };

  // Private galleries (or any missing src) serve the original untouched.
  if (raw || !photo.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.src} {...common} />;
  }

  const widths = WIDTHS[variant];
  const s = sizes ?? SIZES[variant];
  const srcSet = widths.map((w) => `${optUrl(photo.src, w)} ${w}w`).join(", ");

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={optUrl(photo.src, widths[widths.length - 1])}
      srcSet={srcSet}
      sizes={s}
      {...common}
    />
  );
}
