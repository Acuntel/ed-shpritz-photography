import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "crypto";
import { del, list, put } from "@vercel/blob";

const PREFIX = "subscriber-records/";
const VERSION = 1;

export type Subscriber = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  source: "website";
  unsubscribeToken: string;
};

type StoredSubscriber = Subscriber & { blobUrl: string };

function encryptionKey(): Buffer {
  const secret =
    process.env.SUBSCRIBER_SECRET ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.ADMIN_PASSCODE;
  if (!secret) throw new Error("Subscriber storage is not configured.");
  return createHash("sha256")
    .update(`${secret}|ed-shpritz-subscribers-v1`)
    .digest();
}

function encrypt(record: Subscriber): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(record), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, encrypted]);
}

function decrypt(bytes: Buffer): Subscriber {
  if (bytes[0] !== VERSION) throw new Error("Unknown subscriber record.");
  const iv = bytes.subarray(1, 13);
  const tag = bytes.subarray(13, 29);
  const encrypted = bytes.subarray(29);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  const clear = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(clear.toString("utf8")) as Subscriber;
}

async function allRecords(): Promise<StoredSubscriber[]> {
  const records: StoredSubscriber[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: PREFIX, limit: 1000, cursor });
    const loaded = await Promise.all(
      page.blobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url, { cache: "no-store" });
          if (!response.ok) return null;
          const record = decrypt(Buffer.from(await response.arrayBuffer()));
          return { ...record, blobUrl: blob.url };
        } catch {
          return null;
        }
      }),
    );
    records.push(
      ...loaded.filter((record): record is StoredSubscriber => record !== null),
    );
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return records.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return (await allRecords()).map(({ blobUrl: _blobUrl, ...record }) => record);
}

export async function addSubscriber(input: {
  name: string;
  email: string;
}): Promise<{ subscriber: Subscriber; alreadyJoined: boolean }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().replace(/\s+/g, " ");
  const existing = (await allRecords()).find((record) => record.email === email);
  if (existing) {
    const { blobUrl: _blobUrl, ...subscriber } = existing;
    return { subscriber, alreadyJoined: true };
  }

  const subscriber: Subscriber = {
    id: randomUUID(),
    name,
    email,
    joinedAt: new Date().toISOString(),
    source: "website",
    unsubscribeToken: randomBytes(24).toString("hex"),
  };

  await put(`${PREFIX}${subscriber.id}.bin`, encrypt(subscriber), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/octet-stream",
    cacheControlMaxAge: 60,
  });

  return { subscriber, alreadyJoined: false };
}

export async function removeSubscriber(id: string): Promise<boolean> {
  const found = (await allRecords()).find((record) => record.id === id);
  if (!found) return false;
  await del(found.blobUrl);
  return true;
}
