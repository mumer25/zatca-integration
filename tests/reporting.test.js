
import "dotenv/config";
import path from "node:path";

import { generateInvoiceHash } from "../src/services/invoice/invoiceHash.service.js";
import { reportSimplifiedInvoice } from "../src/services/zatca/reporting.service.js";

async function runTest() {
  console.log("\nZATCA Reporting API Test\n");

  const signedXmlPath = path.resolve(
    "storage/xml/generated/INV-SIMPLIFIED-0001-node-signed.xml"
  );

  const hashResult = generateInvoiceHash(signedXmlPath);

  console.log("Invoice hash generated.");
  console.log("Submitting simplified invoice to ZATCA Sandbox...\n");

  const result = await reportSimplifiedInvoice({
    signedXmlPath,
    invoiceHash: hashResult.invoiceHash
  });

  console.log("HTTP Status:", result.httpStatus);
  console.log("Success:", result.success);

  console.log("\nZATCA Response:\n");
  console.log(JSON.stringify(result.data, null, 2));

  if (!result.success) {
    throw new Error("ZATCA Reporting API rejected the request.");
  }

  console.log("\nPASS: Reporting API request completed.");
}

runTest().catch(error => {
  console.error("\nReporting API Test Failed:");
  console.error(error.message);
  process.exitCode = 1;
});
