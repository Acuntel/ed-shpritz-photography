# Ed Shpritz Photography

A quiet, gallery style photography site. Built with Next.js, TypeScript, and Tailwind. It exports to plain static files and is hosted on Vercel.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How the content works

There is no database. Everything the visitor sees lives in three files:

- `public/data/site.json` — the name, the hero lines, the bio, the ed'isms, the contact email.
- `public/data/collections.json` — the seven collections and their descriptions.
- `public/data/photos.json` — every photograph and its name, title, description, and collection.

Photographs themselves are image files in `public/images`.

## The admin page

Go to `/admin` and enter the password **1111** (there is a small Admin link at the very bottom of every page).

Grandpa can edit names, titles, descriptions, collections, the home page selection, and all of the words. He can also add or replace photographs.

When he is finished he clicks **Export to publish**. The browser downloads:

- `site.json`, `collections.json`, `photos.json`
- any new photo files he added

To publish those changes:

1. Put the three `.json` files into `public/data` (replace the old ones).
2. Put any new photo files into `public/images/uploads`.
3. Commit and push. Vercel redeploys automatically.

## Replacing the placeholder art

The site ships with soft watercolor placeholders so it looks complete. To use real photos, drop the image files into `public/images` (a folder per collection is tidy, for example `public/images/chicago`), then point each photo's `src` at it in the admin page or directly in `photos.json`.

## Deploy

Push to GitHub, import the repo in Vercel, and deploy. No environment variables are needed. The build command is `next build` and the output is static.

## Change the admin password

Edit `PASSWORD` near the top of `app/admin/page.tsx`.
