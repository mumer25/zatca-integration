
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { encryptCredentials } from "../src/utils/credentialEncryption.js";

const responsePath = path.resolve(
  "storage/credentials/compliance-sandbox-response.json"
);

const response = JSON.parse(
  fs.readFileSync(responsePath, "utf8")
);

if (
  response.dispositionMessage !== "ISSUED" ||
  !response.binarySecurityToken ||
  !response.secret
) {
  throw new Error("Sandbox Compliance CSID response is incomplete.");
}

const credentials = {
  requestID: response.requestID,
  tokenType: response.tokenType,
  binarySecurityToken: response.binarySecurityToken,
  secret: response.secret
};

const encrypted = encryptCredentials(credentials);

const outputPath = path.resolve(
  "storage/credentials/compliance-sandbox-csid.enc"
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

fs.writeFileSync(
  outputPath,
  JSON.stringify(encrypted, null, 2),
  { mode: 0o600 }
);

console.log("Sandbox Compliance CSID encrypted successfully.");
console.log("Request ID:", response.requestID);
console.log("Saved:", outputPath);
