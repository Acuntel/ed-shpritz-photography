# Ed Shpritz Photography

A quiet, gallery-style photography site on a **black** background, where the
images are the menu. Built with Next.js, TypeScript, and Tailwind. It exports to
plain static files and is hosted on Vercel.

> **`MASTER_PROMPT.md` is the source of truth** for the concept, the collections,
> image sizes, the domain, and the open decisions. Read it first.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How the content works

There is no database. Everything the visitor sees lives in three files:

- `public/data/site.json` — name, hero line + tagline, bio, ed'isms, prints
  statement, contact email, watermark + form settings.
- `public/data/collections.json` — the **eleven** collections and their descriptions.
- `public/data/photos.json` — every photograph and its name, title, description,
  collection, and whether it appears on the home page (`trigger`).

Photographs are image files in `public/images/gallery` (and `/uploads` for
admin-added ones).

## Images: optimization, sizes, and protection

`npm run optimize` (which also runs automatically as `prebuild` before
`next build`) reads every photo and writes responsive **AVIF + WebP** variants to
`public/images/opt`, plus a blur-up placeholder, into `public/data/imeta.json`.

- Tiles ~1200px, collection grids ~1600px, full-screen ~2560px (capped at the
  source width).
- The print-resolution master is **never** served — that is the real download
  protection. Right-click/drag is also deterred on `.protect` images.
- Watermark is controlled by `site.json` → `watermark` (`none` | `subtle`); a
  subtle one is baked onto the full-size image at optimize time.

## QR code

`npm run qr [url]` writes `public/qr-edshpritz.svg` (for print) and `.png` (for
screens) pointing at the site. Re-run with the final URL once the domain is live.

## The admin page

Go to `/admin` and enter the password **1111** (small Admin link at the bottom of
every page). Ed can edit names, titles, descriptions, collections, the home-page
selection (quarterly rotation), and all of the words. He can add or replace
photographs, then click **Export to publish** to download the `.json` files
(`site`, `collections`, `photos`, `galleries`) plus any new images.

To publish those changes:

1. Put the `.json` files into `public/data` (replace the old ones).
2. Put any new photo files into `public/images/uploads`.
3. Commit and push, then redeploy.

## Private client galleries ("pooch pics")

Each person Ed photographs with their dog can get a **private, unlisted gallery**
at `/gallery/<token>/` — full-quality, downloadable photos behind an unguessable
link and an optional passcode. They are `noindex` and excluded from `robots.txt`.
See **MASTER_PROMPT.md §11** for the full model (and the honest security caveats).

Create one with the CLI:

```bash
npm run gallery -- --client "The Johnsons" --dog Marley --passcode 1234 \
  --intro "Lovely meeting Marley..." --images ~/Desktop/marley/*.jpg
npm run gallery -- --list
```

It mints the token, copies the images into `public/images/private/<token>/`,
hashes the passcode, appends to `public/data/galleries.json`, and prints the
share URL + passcode. Then commit + redeploy and share the link. Ed can edit the
words, passcode, and photo order from the **Galleries** tab in `/admin`.

## Pages

`/` (the wall + collections), `/collections/[slug]`, `/about`, `/prints`
(inquiry only — pricing is intentionally deferred), `/contact`, `/admin`,
`/gallery/[token]` (private). Plus `sitemap.xml` and `robots.txt` for SEO.

## Contact form

Both `/contact` and `/prints` use `InquiryForm`. Set a free
[Web3Forms](https://web3forms.com) access key in `site.json` → `formEndpoint` to
receive submissions by email; if it is blank, the form falls back to a `mailto:`
link.

## Deploy

```bash
npx vercel --prod --yes
```

No environment variables are required. The build command is `next build` and the
output is static (`output: export`).

## Change the admin password

Edit `PASSWORD` near the top of `app/admin/page.tsx`.
