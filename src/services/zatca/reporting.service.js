
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { decryptCredentials } from "../../utils/credentialEncryption.js";

export async function reportSimplifiedInvoice({
  signedXmlPath,
  invoiceHash
}) {
  if (!signedXmlPath || !invoiceHash) {
    throw new Error("Signed XML path and invoice hash are required.");
  }

  const credentialsPath = path.resolve(
    process.cwd(),
    "storage/credentials/production-csid.enc"
  );

  const encryptedData = JSON.parse(
    fs.readFileSync(credentialsPath, "utf8")
  );

  const credentials = decryptCredentials(encryptedData);

  const csid = credentials.binarySecurityToken;
  const secret = credentials.secret;

  if (!csid || !secret) {
    throw new Error("Production CSID credentials are incomplete.");
  }

  if (!fs.existsSync(signedXmlPath)) {
    throw new Error(`Signed invoice not found: ${signedXmlPath}`);
  }

  const xml = fs.readFileSync(signedXmlPath, "utf8");
  const invoiceBase64 = Buffer.from(xml, "utf8").toString("base64");

  const auth = Buffer.from(`${csid}:${secret}`).toString("base64");

  const endpoint = process.env.ZATCA_REPORTING_URL;

  if (!endpoint) {
    throw new Error("ZATCA_REPORTING_URL is missing.");
  }

  // Extract UUID from the signed UBL invoice.
const uuidMatch = xml.match(
  /<cbc:UUID(?:\s[^>]*)?>([^<]+)<\/cbc:UUID>/
);

if (!uuidMatch) {
  throw new Error("Invoice UUID not found in signed XML.");
}

const uuid = uuidMatch[1].trim();

console.log("Invoice UUID:", uuid);

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "Accept-Version": "V2",
    "Accept-Language": "en",
    "Content-Type": "application/json",
    Accept: "application/json"
  },
  body: JSON.stringify({
    invoiceHash,
    uuid,
    invoice: invoiceBase64
  })
});

  const responseText = await response.text();

  let responseData;

  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = { message: responseText };
  }

  return {
    httpStatus: response.status,
    success: response.ok,
    data: responseData
  };
}
