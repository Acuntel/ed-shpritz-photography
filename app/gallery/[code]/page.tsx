import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGallery, getSite } from "@/lib/data";
import PrivateGallery from "@/components/PrivateGallery";

// Rendered on demand from Ed's live content; unknown tokens 404.
export const dynamic = "force-dynamic";

// Never index a private gallery, and don't leak the client's name in the title.
export const metadata: Metadata = {
  title: "Private gallery",
  robots: { index: false, follow: false },
};

export default async function GalleryPage({
  params,
}: {
  params: { code: string };
}) {
  const gallery = await getGallery(params.code);
  if (!gallery) notFound();

  const site = await getSite();
  return (
    <PrivateGallery
      gallery={gallery}
      email={site.contactEmail}
      photographer={site.name}
    />
  );
}
