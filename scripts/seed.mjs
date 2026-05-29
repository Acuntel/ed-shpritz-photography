// Generates seed photos.json and matching watercolor-style SVG placeholders.
// Run from the project root: node scripts/seed.mjs
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const phDir = path.join(root, "public", "images", "placeholders");
const dataDir = path.join(root, "public", "data");
fs.mkdirSync(phDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

// Each collection has a palette and a placeholder "mood".
const collections = [
  {
    slug: "chicago",
    palette: ["#cdd7dc", "#9fb3bd", "#6f8893", "#3c4d56"],
    mood: "wash",
    triggers: 4,
    extra: 4,
    names: ["Morning on Wacker", "Lake Street Light", "The Bean, Empty", "River Bridges", "Harbor at Dawn", "El Tracks", "Quiet Loop", "Lakefront Fog"],
    desc: "Chicago in a softer key, found on an ordinary walk.",
  },
  {
    slug: "animals-and-birds",
    palette: ["#e7dcc6", "#cdb98f", "#a98f5d", "#6b5836"],
    mood: "wash",
    triggers: 4,
    extra: 4,
    names: ["Heron Turning", "First Light Finch", "Watchful", "Wing and Water", "Still Crane", "Field Hare", "Egret Step", "Sparrow Pause"],
    desc: "A small life caught in the moment just before it moves.",
  },
  {
    slug: "landscape",
    palette: ["#d9e0cf", "#aebf9b", "#7e9468", "#48583a"],
    mood: "wash",
    triggers: 3,
    extra: 4,
    names: ["Long Field", "Horizon Line", "Dune Grass", "After the Rain", "Low Hills", "Open Sky", "Quiet Shore"],
    desc: "Wide open places where the light does most of the talking.",
  },
  {
    slug: "icm",
    palette: ["#e8d7e2", "#c8a9c6", "#9b7aa6", "#5f4a72"],
    mood: "streak",
    triggers: 4,
    extra: 4,
    names: ["Forest Pass", "City Blur", "Reeds in Wind", "Tide Lines", "Birch Motion", "Evening Streak", "Water Drift", "Color Walk"],
    desc: "The camera moved on purpose and the world turned to paint.",
  },
  {
    slug: "black-and-white",
    palette: ["#e3e3e3", "#b4b4b4", "#6f6f6f", "#1f1f1f"],
    mood: "wash",
    triggers: 3,
    extra: 4,
    names: ["Shadow Stair", "Two Trees", "Stone and Light", "Lone Figure", "Window Light", "Dark Water", "White Wall"],
    desc: "Color set aside, so shape and shadow can speak.",
  },
  {
    slug: "watercolor",
    palette: ["#eef0ec", "#dbe3df", "#c6d2d6", "#aebcc4"],
    mood: "bleed",
    triggers: 3,
    extra: 4,
    names: ["Almost Nothing", "Soft Morning", "Pale Field", "Whisper", "Faint Shore", "Quiet White", "Barely There"],
    desc: "Soft, washed, and nearly empty. Less is more.",
  },
  {
    slug: "sets-of-three",
    palette: ["#ddd6cb", "#c2b8a6", "#9c8f78", "#5e5443"],
    mood: "triptych",
    triggers: 3,
    extra: 4,
    names: ["Three Birds", "Air and Water Show", "Three Butterflies", "Three Dogs", "In Threes", "A Small Series", "Told in Three"],
    desc: "A story that needed more than one frame to tell.",
  },
];

// Vary the canvas shape so the grid breathes.
const shapes = [
  { w: 1000, h: 1250 },
  { w: 1000, h: 800 },
  { w: 1000, h: 1000 },
  { w: 1000, h: 1100 },
];

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function blob(rand, palette) {
  const cx = (0.15 + rand() * 0.7) * 1000;
  const cy = (0.15 + rand() * 0.7) * 1000;
  const r = (0.18 + rand() * 0.3) * 1000;
  const fill = palette[Math.floor(rand() * palette.length)];
  const o = (0.25 + rand() * 0.4).toFixed(2);
  return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${fill}" opacity="${o}"/>`;
}

function svg(seed, palette, mood, w, h) {
  const rand = rng(seed);
  const [a, b, c, d] = palette;
  let body = "";
  if (mood === "streak") {
    for (let i = 0; i < 7; i++) {
      const x = (i / 7 + rand() * 0.05) * w;
      const col = palette[Math.floor(rand() * palette.length)];
      body += `<rect x="${x.toFixed(0)}" y="-20" width="${(w / 9).toFixed(0)}" height="${h + 40}" fill="${col}" opacity="${(0.3 + rand() * 0.4).toFixed(2)}"/>`;
    }
  } else if (mood === "triptych") {
    for (let i = 0; i < 3; i++) {
      const col = palette[1 + (i % 3)];
      body += `<rect x="${((i * w) / 3 + 8).toFixed(0)}" y="8" width="${(w / 3 - 16).toFixed(0)}" height="${h - 16}" fill="${col}" opacity="0.55"/>`;
    }
  } else {
    const n = mood === "bleed" ? 4 : 6;
    for (let i = 0; i < n; i++) body += blob(rand, palette);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${c}"/>
</linearGradient>
<filter id="b${seed}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${mood === "streak" ? 26 : 60}"/></filter>
<filter id="n${seed}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer><feComposite operator="over" in2="SourceGraphic"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#g${seed})"/>
<g filter="url(#b${seed})">${body}</g>
<rect width="${w}" height="${h}" fill="${d}" opacity="0.04"/>
<rect width="${w}" height="${h}" filter="url(#n${seed})" opacity="0.5"/>
</svg>`;
}

const photos = [];
let order = 0;
let seed = 7;

for (const col of collections) {
  const total = col.triggers + col.extra;
  for (let i = 0; i < total; i++) {
    const shape = shapes[(seed + i) % shapes.length];
    const id = `${col.slug}-${i + 1}`;
    const file = `${id}.svg`;
    fs.writeFileSync(path.join(phDir, file), svg(seed, col.palette, col.mood, shape.w, shape.h));
    const name = col.names[i % col.names.length];
    photos.push({
      id,
      src: `/images/placeholders/${file}`,
      alt: `${name}, from the ${col.slug.replace(/-/g, " ")} collection`,
      name,
      title: `${col.slug.replace(/-/g, " ")} ${String(i + 1).padStart(2, "0")}`,
      description: col.desc,
      collection: col.slug,
      trigger: i < col.triggers,
      order: order++,
    });
    seed += 13;
  }
}

// A soft neutral portrait placeholder for the about block.
fs.writeFileSync(
  path.join(phDir, "portrait.svg"),
  svg(999, ["#e7e3d9", "#cfc8b8", "#a89e89", "#6f6757"], "wash", 1000, 1250),
);

fs.writeFileSync(path.join(dataDir, "photos.json"), JSON.stringify(photos, null, 2));
console.log(`Wrote ${photos.length} photos and ${photos.length + 1} placeholders.`);
