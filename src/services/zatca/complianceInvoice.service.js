
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { decryptCredentials } from "../../utils/credentialEncryption.js";

export async function submitComplianceInvoice({
  xmlFilePath,
  invoiceHash,
  uuid
}) {
  if (!xmlFilePath || !invoiceHash || !uuid) {
    throw new Error("XML path, invoice hash, and UUID are required.");
  }

  // Load encrypted Compliance CSID credentials.
  const credentialsPath = path.resolve(
    process.cwd(),
    "storage/credentials/compliance-csid.enc"
  );

  const encryptedData = JSON.parse(
    fs.readFileSync(credentialsPath, "utf8")
  );

  const credentials = decryptCredentials(encryptedData);

  const csid = credentials.binarySecurityToken;
  const secret = credentials.secret;

  if (!csid || !secret) {
    throw new Error("Compliance CSID credentials are incomplete.");
  }

  // Read the generated invoice XML.
  const xml = fs.readFileSync(xmlFilePath, "utf8");

  // Encode XML as Base64.
  const invoiceBase64 = Buffer.from(xml, "utf8").toString("base64");

  // Prepare Basic Authentication.
  const auth = Buffer.from(`${csid}:${secret}`).toString("base64");

  const baseUrl = process.env.ZATCA_SANDBOX_URL;

  if (!baseUrl) {
    throw new Error("ZATCA_SANDBOX_URL is missing.");
  }

  const endpoint =
    `${baseUrl.replace(/\/+$/, "")}/compliance/invoices`;

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
