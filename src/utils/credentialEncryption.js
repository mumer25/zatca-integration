
import crypto from "crypto";

const algorithm = "aes-256-gcm";

function getEncryptionKey() {
  const key = process.env.ZATCA_CREDENTIALS_KEY;

  if (!key) {
    throw new Error("ZATCA_CREDENTIALS_KEY is missing.");
  }

  const buffer = Buffer.from(key, "base64");

  if (buffer.length !== 32) {
    throw new Error("Encryption key must decode to exactly 32 bytes.");
  }

  return buffer;
}

export function encryptCredentials(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    algorithm,
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    algorithm,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    encryptedData: encrypted.toString("base64")
  };
}

export function decryptCredentials(payload) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedData, "base64")),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
