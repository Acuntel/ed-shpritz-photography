import type { CSSProperties } from "react";
import type { Photo } from "@/lib/types";

type Variant = "tile" | "grid" | "full";

// We emit every available width in the srcset and let `sizes` tell the browser
// how much space the image occupies, so it downloads the right resolution for
// the device. (Source widths cap at the original, e.g. 2200 rather than 2560.)
const SIZES: Record<Variant, string> = {
  tile: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  grid: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  full: "100vw",
};

function srcset(base: string, widths: number[], ext: string) {
  return widths.map((w) => `/images/opt/${base}-${w}.${ext} ${w}w`).join(", ");
}

export default function Picture({
  photo,
  variant,
  className = "",
  sizes,
  priority = false,
  style,
}: {
  photo: Photo;
  variant: Variant;
  className?: string;
  sizes?: string;
  priority?: boolean;
  style?: CSSProperties;
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

  // No optimized variants yet — fall back to the original file.
  if (!photo.optBase || !photo.optWidths?.length) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.src} {...common} />;
  }

  const use = photo.optWidths!;
  const s = sizes ?? SIZES[variant];

  return (
    <picture>
      <source
        type="image/avif"
        srcSet={srcset(photo.optBase, use, "avif")}
        sizes={s}
      />
      <source
        type="image/webp"
        srcSet={srcset(photo.optBase, use, "webp")}
        sizes={s}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} {...common} />
    </picture>
  );
}
