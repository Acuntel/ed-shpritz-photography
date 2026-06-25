/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server runtime (NOT static export) so the site can read Ed's content live
  // from Vercel Blob on every request and use Vercel's built-in image
  // optimization. This is what makes the admin publish instantly with no
  // rebuild and no `scripts/optimize.mjs` step on anyone's machine.
  images: {
    // Ed's uploaded photographs live in Vercel Blob; allow the optimizer to
    // fetch them. Local /images/* are always allowed.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    // The exact widths components/Picture.tsx requests from /_next/image. Every
    // requested `w` must appear here (or in imageSizes) or the optimizer 400s.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2048, 2560, 3840],
    imageSizes: [256, 320, 384],
    formats: ["image/avif", "image/webp"],
  },
  trailingSlash: true,
};

export default nextConfig;
