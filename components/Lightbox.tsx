"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Picture from "@/components/Picture";
import type { Photo } from "@/lib/types";

type Props = {
  photos: Photo[];
  index: number | null;
  email: string;
  onClose: () => void;
  onIndex: (i: number) => void;
  // When true (private client galleries), show a download link instead of the
  // "inquire about a print" link.
  download?: boolean;
};

export default function Lightbox({
  photos,
  index,
  email,
  onClose,
  onIndex,
  download = false,
}: Props) {
  const open = index !== null;
  const photo = open ? photos[index as number] : null;
  // Fill the viewport at the photo's own aspect ratio so an opened picture is
  // always large — small placeholder images scale up to fill rather than
  // floating tiny in the middle; full-resolution photos fill crisply.
  const aspect =
    photo && photo.width && photo.height ? photo.width / photo.height : 3 / 2;
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: number) => {
      if (index === null) return;
      const next = (index + dir + photos.length) % photos.length;
      onIndex(next);
    },
    [index, photos.length, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="protect fixed inset-0 z-[60] flex flex-col bg-paper/97 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={onClose}
        >
          <div className="container-rail flex h-16 items-center justify-between">
            <span className="kicker">
              {(index as number) + 1} of {photos.length}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-ink transition-colors hover:text-ink-muted"
            >
              <X size={24} />
            </button>
          </div>

          <div
            className="flex flex-1 items-center justify-center px-6 pb-6"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              aria-label="Previous"
              onClick={() => go(-1)}
              className="hidden shrink-0 px-3 text-ink-muted transition-colors hover:text-ink sm:block"
            >
              <ChevronLeft size={32} />
            </button>

            <motion.figure
              key={photo.id}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-h-full min-w-0 flex-col items-center"
            >
              <div
                className="mx-auto w-full"
                style={{ width: `min(90vw, calc(74vh * ${aspect}))` }}
              >
                <Picture
                  photo={photo}
                  variant="full"
                  priority
                  sizes="90vw"
                  className="block h-auto w-full object-contain shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]"
                  style={{ aspectRatio: `${aspect}` }}
                />
              </div>
              <figcaption className="mt-6 max-w-prose2 text-center">
                <h2 className="flex items-center justify-center gap-2 font-serif text-2xl text-ink">
                  {photo.name}
                  {photo.award && (
                    <span
                      aria-label="Award-winning"
                      title="Award-winning"
                      className="shrink-0 font-serif text-2xl leading-none text-amber-500"
                    >
                      *
                    </span>
                  )}
                </h2>
                {photo.title && (
                  <p className="mt-1 font-sans text-xs uppercase tracking-widest2 text-ink-soft [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]">
                    {photo.title}
                  </p>
                )}
                {photo.description && (
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
                    {photo.description}
                  </p>
                )}
                {download ? (
                  <a
                    href={photo.src}
                    download
                    className="mt-5 inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
                  >
                    Download this photo
                  </a>
                ) : (
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(
                      "Print inquiry: " + photo.name,
                    )}`}
                    className="mt-5 inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
                  >
                    Inquire about a print
                  </a>
                )}
              </figcaption>
            </motion.figure>

            <button
              type="button"
              aria-label="Next"
              onClick={() => go(1)}
              className="hidden shrink-0 px-3 text-ink-muted transition-colors hover:text-ink sm:block"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
