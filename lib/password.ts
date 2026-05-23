import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  storedHashPassword: string,
): boolean {
  return bcrypt.compareSync(password, storedHashPassword);
}
