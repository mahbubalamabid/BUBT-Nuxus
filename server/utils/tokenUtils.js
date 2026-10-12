import crypto from "crypto";

// Generates a random token to send to the user, and its SHA-256 hash to store in the DB.
// Storing only the hash means a leaked/stolen DB doesn't expose usable verification tokens.
export const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
};

export const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");
