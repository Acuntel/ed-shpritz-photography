import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGalleries, getGallery, getSite } from "@/lib/data";
import PrivateGallery from "@/components/PrivateGallery";

// Static export: one page is built per gallery token listed in galleries.json.
// Unknown tokens are not built and simply 404.
export function generateStaticParams() {
  return getGalleries().map((g) => ({ code: g.token }));
}

// Never index a private gallery, and don't leak the client's name in the title.
export const metadata: Metadata = {
  title: "Private gallery",
  robots: { index: false, follow: false },
};

export default function GalleryPage({ params }: { params: { code: string } }) {
  const gallery = getGallery(params.code);
  if (!gallery) notFound();

  const site = getSite();
  return (
    <PrivateGallery
      gallery={gallery}
      email={site.contactEmail}
      photographer={site.name}
    />
  );
}
