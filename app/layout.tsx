import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { getSite } from "@/lib/data";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageGuard from "@/components/ImageGuard";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://edshpritzphotography.com";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const BRAND = `${site.name} Photography`;
  // Home/default title leads with Ed's question; subpages use "%s | Brand".
  const TITLE = `${site.titleQuestion} — ${BRAND}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: TITLE,
      template: `%s | ${BRAND}`,
    },
    description: `${site.heroLine} Fine art photography from Chicago by ${site.name} — skyline, lakefront, wildlife, and intentional camera movement.`,
    keywords: [
      "Ed Shpritz",
      "Ed Shpritz photography",
      "Chicago photographer",
      "fine art photography",
      "Chicago fine art photography",
      "intentional camera movement",
      "wildlife photography",
      "fine art prints",
    ],
    authors: [{ name: site.name }],
    alternates: { canonical: "/" },
    openGraph: {
      title: TITLE,
      description: site.heroSub,
      url: SITE_URL,
      siteName: BRAND,
      type: "website",
      images: [
        {
          url: "/images/gallery/chicago-pavilion.jpg",
          width: 2200,
          height: 1372,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: site.heroSub,
      images: ["/images/gallery/chicago-pavilion.jpg"],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSite();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: "Photographer",
    description: `Fine art photographer based in ${site.location}.`,
    url: SITE_URL,
    email: site.contactEmail,
    address: { "@type": "PostalAddress", addressLocality: site.location },
    knowsAbout: [
      "Fine art photography",
      "Intentional camera movement",
      "Wildlife photography",
    ],
  };
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="grain font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ImageGuard />
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
        {process.env.UMAMI_WEBSITE_ID && (
          <script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.UMAMI_WEBSITE_ID}
          />
        )}
      </body>
    </html>
  );
}
