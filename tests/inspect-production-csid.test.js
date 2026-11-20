
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { decryptCredentials } from "../src/utils/credentialEncryption.js";

const encryptedPath = path.resolve(
  "storage/credentials/production-csid.enc"
);

const encrypted = JSON.parse(
  fs.readFileSync(encryptedPath, "utf8")
);

const credentials = decryptCredentials(encrypted);

const token = credentials.binarySecurityToken;

if (!token) {
  throw new Error("Production CSID token is missing.");
}

// Decode the certificate from the CSID token.
const firstDecode = Buffer.from(token, "base64");
const certificateDer = Buffer.from(
  firstDecode.toString("utf8"),
  "base64"
);

if (certificateDer[0] !== 0x30) {
  throw new Error("Decoded certificate is not valid DER data.");
}

const outputPath = path.resolve(
  "storage/certificates/public/production-csid.der"
);

fs.writeFileSync(outputPath, certificateDer);

console.log("Production CSID certificate extracted.");
console.log("Certificate size:", certificateDer.length, "bytes");
console.log("Saved:", outputPath);
