import { SignJWT } from "jose";

const secret = "dropstore-super-secret-key-2025-local-dev";
const secretKey = new TextEncoder().encode(secret);

const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
const issuedAt = Date.now();
const expiresInMs = ONE_YEAR_MS;
const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

const token = await new SignJWT({
  openId: "local-owner",
  appId: "dropstore-local",
  name: "Admin Local",
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setExpirationTime(expirationSeconds)
  .sign(secretKey);

console.log(token);
