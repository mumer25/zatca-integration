
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { encryptCredentials } from "../src/utils/credentialEncryption.js";

// Read the complete API response from a local file.
// Never commit this file to Git.
const responsePath = path.resolve(
  "storage/credentials/production-csid-response.json"
);

const response = JSON.parse(
  fs.readFileSync(responsePath, "utf8")
);

if (
  response.dispositionMessage !== "ISSUED" ||
  !response.binarySecurityToken ||
  !response.secret
) {
  throw new Error("Production CSID response is incomplete.");
}

const credentials = {
  requestID: response.requestID,
  tokenType: response.tokenType,
  binarySecurityToken: response.binarySecurityToken,
  secret: response.secret
};

const encrypted = encryptCredentials(credentials);

const outputPath = path.resolve(
  "storage/credentials/production-csid.enc"
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

fs.writeFileSync(
  outputPath,
  JSON.stringify(encrypted, null, 2),
  { mode: 0o600 }
);

console.log("Production CSID credentials encrypted successfully.");
console.log("Request ID:", response.requestID);
console.log("Saved:", outputPath);
