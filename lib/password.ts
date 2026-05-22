import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedHashPassword: string,
): boolean {
  const [salt, hash] = storedHashPassword.split(":");
  const hashToVerify = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST)
    .toString("hex");
  return hash === hashToVerify;
}
