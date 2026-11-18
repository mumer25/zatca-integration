
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateInvoiceHash } from "../src/services/invoice/invoiceHash.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const invoicePath = path.resolve(
  __dirname,
  "../storage/xml/generated/INV-TEST-0001.xml"
);

const expectedHash =
  "Og2tlrtEU6cTYhDO9mpWjKiPuEquhdTlZW/iPaQfWvA=";

console.log("\nZATCA Invoice Hash Tests\n");

try {
  const result = generateInvoiceHash(invoicePath);

  console.log("Generated Hash:", result.invoiceHash);

  console.log(
    "Hash Length:",
    Buffer.from(result.invoiceHash, "base64").length,
    "bytes"
  );

  if (result.invoiceHash === expectedHash) {
    console.log("\nPASS: Hash matches official ZATCA SDK");
  } else {
    console.log("\nFAIL: Hash does not match official ZATCA SDK");
    console.log("Expected:", expectedHash);
    console.log("Actual:  ", result.invoiceHash);
    process.exitCode = 1;
  }

} catch (error) {
  console.error("Invoice hashing failed:", error.message);
  process.exitCode = 1;
}
