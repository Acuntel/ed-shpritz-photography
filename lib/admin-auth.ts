import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

const ADMIN_PASSWORD = {
  iterations: 310000,
  salt: Buffer.from("UthLEyMaYEUxOqY4ZGRYwQ==", "base64"),
  hash: Buffer.from("rflpocAwxBMa3+7Ex8Ik7ppZAuqu8UyYksk8ROv5Hcs=", "base64"),
} as const;

export function isValidAdminPasscode(passcode: unknown) {
  if (typeof passcode !== "string") return false;
  const candidate = pbkdf2Sync(
    passcode,
    ADMIN_PASSWORD.salt,
    ADMIN_PASSWORD.iterations,
    ADMIN_PASSWORD.hash.length,
    "sha256",
  );
  return timingSafeEqual(candidate, ADMIN_PASSWORD.hash);
}
