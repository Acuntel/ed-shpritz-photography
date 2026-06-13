# MASTER PROMPT — Ed Shpritz Photography

> Single source of truth for the site. Any fresh Claude Code session should read this
> first, then build/update against it. This file wins over older comments, the README,
> or memory if they disagree.
>
> **Project:** `~/Desktop/Client Websites/Ed Shpritz Photography/edspitz-next`
> **Repo:** `Acuntel/ed-shpritz-photography` (private)
> **Live:** https://edspitz-next.vercel.app (Vercel project internally `edspitz-next`)
> **Deploy:** `npx vercel --prod --yes` (acuntel is logged in) — NOT git-auto-deploy
> **Stack:** Next.js 14 static export · TypeScript · Tailwind · framer-motion · no backend
> **Admin:** `/admin`, password `1111` (small link in the footer)

---

## 1. What this site is

A photographer's portfolio for **Ed Shpritz** (optometrist by day, Chicago).
It is **not a traditional gallery**. It is a **visual experience** where the
**images are the menu**. You scroll a quiet wall of pictures on a black background; each
picture is a door; clicking a picture opens the collection behind it.

- **Site title:** Ed Shpritz Photography
- **Primary line (hero):** _Do You See What I See?_
- **Secondary line:** _From Light to Dark_
- **Opening-quote options** (Ed picks one as primary; the rest can rotate quarterly):
  1. Do You See What I See? ← current recommendation
  2. We Look… But Do We See?
  3. Less… So You May See More.
  4. From Light to Dark

**Experience goals**

- Visual experience, not a catalog. Minimal text. The work does the talking.
- Black background, edge-to-edge images, generous quiet, slow gentle motion.
- Phone-first; flawless on tablet and desktop.
- Easy for Ed to swap images and rotate the homepage every quarter without code.

---

## 2. Information architecture

```
Home  ── 24–25 hook images (2–3 per collection) ── each image is a link
  │
  └── click a hook ──► Collection page (8–10 images of that style)
                          │
                          └── click an image ──► Lightbox (full-screen view + caption)
About            (bio · philosophy · contact)
Contact          (email link + inquiry form)   ← can live inside About or stand alone
Prints           (purchase statement · inquiry form · pricing "later")
Admin  /admin    (Ed edits everything, exports JSON, password 1111)
```

**The hook math:** 11 collections × ~2.2 hooks each ≈ **24–25 homepage tiles**.
Each collection page holds **8–10 images**. Total library target ≈ **90–110 photos**.

---

## 3. The 11 collections

Replaces the previous 7. Each needs **8–10 images**; **2–3** of each are flagged
`trigger: true` to appear on the homepage.

| #   | Collection        | slug            | One-line feel                                                      |
| --- | ----------------- | --------------- | ------------------------------------------------------------------ |
| 1   | Minimal White     | `minimal-white` | High-key, almost-empty frames; a lot to feel, very little to see   |
| 2   | Pastels           | `pastels`       | Soft color washes, gentle light                                    |
| 3   | ICM Black & White | `icm-bw`        | Intentional Camera Movement, monochrome — photos that feel painted |
| 4   | ICM Color         | `icm-color`     | Intentional Camera Movement in color                               |
| 5   | Chicago           | `chicago`       | The city, quietly — skyline, river, lakefront                      |
| 6   | Wildlife          | `wildlife`      | Animals being themselves                                           |
| 7   | Birds             | `birds`         | Birds mid-turn                                                     |
| 8   | Dogs              | `dogs`          | Dogs, joy, motion                                                  |
| 9   | Aviation          | `aviation`      | Jets, formation, sky and speed                                     |
| 10  | Balloons          | `balloons`      | Hot-air balloons at first light                                    |
| 11  | Landscapes        | `landscapes`    | Wide places where the light is the subject                         |

**Old → new migration** (when re-sorting the existing 24 photos):

- `less-is-more` → split into **Minimal White** + **Pastels**
- `icm` → split into **ICM Black & White** + **ICM Color**
- `animals-and-birds` → split into **Wildlife** + **Birds** + **Dogs**
- `air-and-water-show` → split into **Aviation** + **Balloons**
- `black-and-white` → fold into **ICM Black & White** (or retire if all are ICM)
- `landscape` → **Landscapes** · `chicago` → **Chicago**

Order is editable from `/admin`. New collections can be added later the same way.

---

## 4. Page specs

### Home

- Black background. A single masonry wall of 24–25 hook images (current `TriggerGrid`,
  retuned for black). No header chrome competing with the pictures — name + line sit
  small at the very top, then get out of the way.
- Each tile is a `<Link>` to `/collections/<slug>/`.
- **Hover/tap reveal:** a one- or two-word title fades up; the collection name in tiny
  uppercase tracking. Never show captions at rest.
- First row loads eagerly (priority); everything below lazy-loads with a blur-up.
- Hero line ("Do You See What I See?") sits above the wall, quiet and serifed.

### Collection (`/collections/[slug]`)

- 8–10 images of one style, same black wall, same hover behavior.
- Small back affordance to Home. Collection name + one-line feel at top, small.
- Click any image → Lightbox.

### Lightbox

- Full-screen, black, the **web-resolution** image (see §5 — never the print master).
- Caption block: **one or two-word title**, then optional place + one sentence.
- Arrow / swipe between images in the collection. Esc / tap-out to close.
- Right-click and drag-save discouraged (deterrent only; real protection is §5).

### About

- Short bio (already written, keep Ed's voice), photography philosophy / "ed-isms",
  portrait, contact info.

### Contact

- `mailto:` email link **and** a simple inquiry form (name, email, message).
- Static-export friendly: form posts to Formspree / Web3Forms / Resend — no server.

### Prints

- Status now: **inquiry only.** A short purchase statement + the inquiry form.
- Pricing page comes **later** (leave a clean slot for it).
- Purchase statement draft (Ed to approve): _"Prints are available on request.
  Each is printed to archival standards and signed. Write to me and tell me which
  picture spoke to you."_

### Admin (`/admin`, pw `1111`)

- Ed edits names, titles, descriptions, collection assignment, order, homepage
  selection, and all words. Adds/replaces photos. Clicks **Export to publish** →
  downloads `site.json`, `collections.json`, `photos.json` + any new images.
- Brady drops those into `public/data` / `public/images/uploads`, commits, redeploys.
- **Quarterly rotation** = Ed re-flags which photos are `trigger: true` and exports.

---

## 5. Images — sizes, quality, protection (the technical answer)

Goal Brady was asked for: _excellent quality while staying fast,_ and _show low-res on
the site but keep full-res off it._

**Rule:** the website **never serves the print-resolution master.** Web gets downsized,
compressed copies. Full-res lives only in the private archive (§9) and is what a buyer
receives after purchase. That single rule is the real download protection.

**Format:** serve **AVIF** with a **WebP** fallback (JPEG as last resort). Convert
everything to **sRGB**. Because this is a static export (no Next image server), pre-bake
the variants at build with a `sharp` script (`scripts/optimize.mjs`) writing into
`public/images/<collection>/`.

| Use                             | Long edge   | Format / quality   | Target weight  |
| ------------------------------- | ----------- | ------------------ | -------------- |
| Homepage hook tile              | **1200 px** | AVIF q55–60        | 80–150 KB      |
| Collection grid                 | **1600 px** | AVIF q60           | 150–250 KB     |
| Lightbox (full-screen)          | **2560 px** | AVIF q65           | 300–600 KB     |
| Blur-up placeholder (LQIP)      | 20 px       | inline base64      | <1 KB          |
| **Print master (archive only)** | original    | keep RAW/full JPEG | not on the web |

- Source files Ed/Brady supply: **full-resolution, longest edge ≥ 3000 px** so we can
  generate everything cleanly. We downsize; we never upscale.
- Current library is already 2200 px JPEGs — fine as a stopgap, but **re-pull full-res**
  for anything destined for prints / the 2560 px lightbox.

**Protection layers** (in order of actual effectiveness):

1. Print master never on the server. _(strong)_
2. Optional **subtle** watermark baked onto the lightbox (2560 px) image. Ed chooses:
   **none / subtle / optional-per-photo**. Recommendation: subtle corner mark on
   lightbox only, never on the small tiles. _(medium)_
3. Disable right-click / drag on images. _(weak — deterrent only, do it anyway)_

**Speed:** lazy-load below the fold, blur-up placeholders, eager-load only row one,
`preconnect`, long-cache headers on `/images/*`, no layout shift (set aspect ratios).

---

## 6. Visual & motion system

- **Background:** black (`#0A0A0A`–`#000`). This is a change from the current "paper"
  light theme — retheme Tailwind tokens accordingly. White/pastel photos pop against it.
- **Type:** one quiet serif for titles/lines, one clean sans for the tiny uppercase
  labels. Minimal text everywhere.
- **Motion:** slow and gentle. Reveal-on-scroll fade/rise (keep `Reveal`), 1.2s ease on
  hover scale (keep current), soft lightbox crossfades. Nothing flashy — the calm is the
  brand. Respect `prefers-reduced-motion`.
- **Captions discipline:** none at rest · one word or two-word title on hover/tap · full
  caption only in the lightbox.

---

## 7. Mobile & tablet

- Phone-first. Masonry collapses to 2 columns on phone, 3 on tablet, 4 on desktop
  (current breakpoints already do this).
- Tap = hover reveal; tap-through = open. Lightbox swipes left/right, pinch-zoom allowed.
- Test real iPhone + iPad before sign-off.

---

## 8. Domain, QR, SEO, analytics

**Domain — DECIDED (2026-06-02): `edshpritzphotography.com`.**
Spelled **Shpritz**, matching the name (name AND domain are both "Shpritz").
A "spitz"-spelled domain was briefly considered and **rejected** — keep it
Shpritz everywhere. WHOIS-checked **available**.

- `edshpritzphotography.com` — ✅ **available, chosen** (matches the name; best SEO; gives a pro email ed@…)
- `doyouseewhatisee.com` — ❌ already registered (taken), so it's out
- `edwardhshpritz.com` — available, but the longer formal spelling
- `fromlighttodark.com` — available brandable alt (could be a cheap redirect later)

> **Buy at Porkbun** (~$10/yr, free WHOIS privacy + free SSL + free email
> forwarding so `ed@edshpritzphotography.com` lands in Ed's Gmail).
> Cloudflare Registrar (~$10.44/yr, at-cost) is the alternative. Set DNS to
> Vercel after purchase. Decide §9 ownership before buying.

**QR code** → homepage URL. Generate once domain is live; use on business cards,
calendars, prints, and gallery displays. Keep an SVG master so it scales on signage.

**SEO** — make searchable: "Ed Shpritz / Edward Shpritz", "Chicago photographer",
"fine art photography Chicago". Per-page `<title>`/meta, Open Graph image, `sitemap.xml`,
`robots.txt`, descriptive `alt` on every photo, `Photograph`/`Person` JSON-LD.

**Analytics** — visitor counts + most-viewed collections. Use Vercel Analytics or
Plausible (privacy-friendly, no cookie banner). Track collection page views.

---

## 9. Ownership & backup (do not skip)

- **Domain owner:** register in an account Ed/the family controls long-term (or Brady's
  Inkept account with credentials documented and handed to Ed). Write down where it lives.
- **Site owner:** Ed owns the content and the deployed site; Brady maintains it.
- **Image backup:** keep print-resolution masters in **two** places (e.g. cloud drive +
  local/external disk). The website is _not_ a backup. Catalog by collection.

---

## 10. Content model (no backend)

Everything visible lives in three JSON files in `public/data`; images in `public/images`.

- `site.json` — name, hero lines, intro, philosophy/ed-isms, bio + portrait, contact email, location.
- `collections.json` — the 11 collections: `slug`, `name`, `kicker`, `blurb`, `cover`.
- `photos.json` — every photo: `id`, `src`, `alt`, `name` (1–2 word title), `title`
  (place), `description`, `collection`, `trigger` (homepage?), `order`.

Admin reads/writes these in the browser and exports them; Brady commits + redeploys.

---

## 11. Private client galleries ("pooch pics")

Ed photographs people with their dogs in the field, hands them a card, and sends
the pictures if they want them. This feature gives **each person a private area**
for their own photos — added **2026-06-02**.

**How it works (static-site model, no backend):**

- Each gallery is one entry in `public/data/galleries.json`: `token`, `client`,
  `dog`, `intro`, optional `passcodeHash`, and a list of `photos`.
- It lives at **`/gallery/<token>/`** where `token` is an **unguessable random
  slug** (e.g. `marley-7f3a9c2b8e`). `generateStaticParams` builds one page per
  token; unknown tokens 404.
- Optional **passcode**: a client-side SHA-256 gate (`components/PrivateGallery`).
  The raw code is never stored — only its hash sits in the JSON. Unlock persists
  in `sessionStorage`.
- Private images live in **`public/images/private/<token>/`**, served **at full
  quality and downloadable** (the opposite of the public site — these are the
  client's own pictures to keep). They are **not** run through the optimize
  pipeline.
- Galleries are **`noindex`** and **disallowed in `robots.txt`** (`/gallery`),
  never linked from nav or sitemap.

**The honest security model:** on a static host, anything served can be fetched
by anyone who has the URL — so "private" here means **unlisted + obscured**, the
same model as a Google Photos / Dropbox share link. The real protections are
(1) the unguessable token and (2) noindex. The passcode is a soft second gate
(a determined person could read the JSON), good for "feels private" + casual
deterrence, not secrets. **True per-user security (login, expiry, signed URLs)
needs a backend** (Supabase / S3) — flagged as an upgrade if Ed ever needs it.

**Managing galleries:**

- **CLI (Brady, primary):** `npm run gallery -- --client "The Johnsons" --dog
Marley --passcode 1234 --intro "..." --images ~/path/to/pics/*.jpg`. It mints
  the token, copies the images into `public/images/private/<token>/`, hashes the
  passcode, appends to `galleries.json`, and prints the share URL + passcode.
  `npm run gallery -- --list` lists them. Then commit + redeploy.
- **Admin (Ed):** the **Galleries** tab at `/admin` lists existing galleries,
  copies each share link, and edits the words / passcode / photo order / captions,
  then **Export** writes `galleries.json` alongside the other files. (New galleries
  with images are easiest via the CLI, since images must be committed + deployed.)

## 12. Future roadmap (build the slots, not the features)

- Prints **pricing page** (currently inquiry-only).
- Print **sales / checkout** (Stripe) if Ed wants commerce later.
- **Blog / journal** and **books** sections.
- More collections (add via admin, no code).

---

## 13. Build / deploy checklist

```bash
cd "~/Desktop/Client Websites/Ed Shpritz Photography/edspitz-next"
npm install
npm run dev        # http://localhost:3000
npm run optimize   # generate AVIF/WebP variants + imeta.json (auto-runs on build)
npm run qr         # regenerate the QR code for the final URL
npm run build      # static export to ./out
npx vercel --prod --yes     # deploy
```

- No env vars needed for the site itself (the Web3Forms key lives in site.json).
- Keep files < 300 lines; functional components; early returns.

---

## 14. Status (built 2026-06-02) & remaining decisions

**Built and shipping now:** black retheme · 11 collections · 24-hook wall (images
are the menu) · collection pages + lightbox (swipe, keyboard) · About · Prints
(inquiry only) · Contact · AVIF/WebP pipeline + blur-up + download protection ·
QR code · SEO (metadata, JSON-LD, sitemap, robots) · admin extended for the new
fields. Build is green (21 static pages).

**Decided:** opening quote = _Do You See What I See?_ (tagline _From Light to
Dark_) · domain = **edshpritzphotography.com** · watermark default **none**
(toggle to subtle in admin) · prints = **inquiry only** · form = **Web3Forms**
(falls back to mailto until a key is set).

**Still needed from Brady / Ed:**

1. **Buy the domain** (Porkbun, ~$10) + decide who owns it, then point DNS at Vercel.
2. **The photos** — 8–10 per collection, full-res, sorted into the 11 buckets
   (ICM Black & White is currently empty and shows "Coming soon").
3. Confirm the **contact email** (`ed@edshpritzphotography.com` placeholder) and
   set up the Porkbun email forward.
4. Approve the **prints statement** and add a **Web3Forms key** if Ed wants form
   submissions emailed (otherwise the form opens the visitor's mail app).
5. Deferred to later (per Ed): prints **pricing page**, checkout, blog, books.
