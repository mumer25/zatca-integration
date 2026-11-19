
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import {
  decryptCredentials
} from "../src/utils/credentialEncryption.js";

const encrypted = JSON.parse(
  fs.readFileSync(
    "storage/credentials/compliance-csid.enc",
    "utf8"
  )
);

const credentials = decryptCredentials(encrypted);

const token = credentials.binarySecurityToken;

if (!token) {
  throw new Error("Certificate token not found.");
}

// First Base64 decoding.
const firstDecoded = Buffer.from(token, "base64").toString("utf8");

// Second Base64 decoding.
const certificateDer = Buffer.from(firstDecoded, "base64");

// Basic DER certificate check.
if (
  certificateDer.length === 0 ||
  certificateDer[0] !== 0x30
) {
  throw new Error("Invalid DER certificate data.");
}

const outputDirectory = path.resolve(
  "storage/certificates/public"
);

fs.mkdirSync(outputDirectory, { recursive: true });

const outputPath = path.join(
  outputDirectory,
  "compliance-csid.der"
);

fs.writeFileSync(outputPath, certificateDer);

console.log("\nCertificate Extraction Results\n");
console.log("First decoding: PASS");
console.log("Second decoding: PASS");
console.log("DER certificate structure: PASS");
console.log("Certificate size:", certificateDer.length, "bytes");
console.log("Saved:", outputPath);
