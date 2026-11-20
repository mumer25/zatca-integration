
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { decryptCredentials } from "../src/utils/credentialEncryption.js";

const filePath = path.resolve(
  "storage/credentials/compliance-csid.enc"
);

const encrypted = JSON.parse(fs.readFileSync(filePath, "utf8"));
const credentials = decryptCredentials(encrypted);

console.log("Compliance CSID metadata:");
console.log("Request ID:", credentials.requestID ?? "Not stored");
console.log("Token type:", credentials.tokenType ?? "Not stored");
console.log(
  "Binary security token present:",
  Boolean(credentials.binarySecurityToken)
);
console.log("Secret present:", Boolean(credentials.secret));
