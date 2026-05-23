<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Naming Conventions

| Category                     | Convention                               | Examples                                |
| ---------------------------- | ---------------------------------------- | --------------------------------------- |
| Files & directories          | `kebab-case`                             | `route.ts`, `password.ts`               |
| Exported functions           | `camelCase`                              | `registerUser`, `hashPassword`          |
| Private functions            | `camelCase`                              | `parseDuration`, `required`             |
| Types / Interfaces           | `PascalCase`                             | `AccessTokenPayload`, `RegisterInput`   |
| Zod schemas                  | `PascalCase`                             | `RegisterSchema`                        |
| Constants (primitive/config) | `SCREAMING_SNAKE_CASE`                   | `COOKIE_NAME`, `SALT_ROUNDS`            |
| Route handler exports        | `UPPER_CASE` (HTTP method)               | `POST`                                  |
| JWT operations               | `sign*` / `verify*`                      | `signAccessToken`, `verifyRefreshToken` |
| Repository CRUD              | `create*`, `find*`, `update*`, `delete*` | `createUser`, `findUserByEmail`         |
| Database columns             | `camelCase` (Prisma-managed)             | `passwordHash`, `displayName`           |
