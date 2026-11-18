
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import {
  generateInvoiceHash
} from "../src/services/invoice/invoiceHash.service.js";

import {
  submitComplianceInvoice
} from "../src/services/zatca/complianceInvoice.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xmlPath = path.resolve(
  __dirname,
  "../storage/xml/generated/INV-TEST-0001.xml"
);

const fixturePath = path.resolve(
  __dirname,
  "fixtures/standard-invoice.json"
);

async function runTest() {
  console.log("\nZATCA Compliance Invoice Test\n");

  if (!fs.existsSync(xmlPath)) {
    throw new Error("Generated XML file not found.");
  }

  const invoice = JSON.parse(
    fs.readFileSync(fixturePath, "utf8")
  );

  console.log("Invoice:", invoice.id);
  console.log("UUID:", invoice.uuid);

  // Generate invoice hash.
  const hashResult = generateInvoiceHash(xmlPath);

  console.log("Invoice hash generated successfully.");

  // Submit to ZATCA.
  console.log("\nSubmitting invoice to ZATCA Sandbox...\n");

  const result = await submitComplianceInvoice({
    xmlFilePath: xmlPath,
    invoiceHash: hashResult.invoiceHash,
    uuid: invoice.uuid
  });

  console.log("HTTP Status:", result.httpStatus);
  console.log("Success:", result.success);

  console.log(
    "\nZATCA Response:\n",
    JSON.stringify(result.data, null, 2)
  );

  if (!result.success) {
    throw new Error("ZATCA compliance submission failed.");
  }

  console.log("\nCompliance API request completed.");
}

runTest().catch(error => {
  console.error("\nTEST FAILED:", error.message);
  process.exitCode = 1;
});
