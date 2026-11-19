
import "dotenv/config";

import {
  signInvoice
} from "../src/services/invoice/invoiceSigning.service.js";

import {
  generateInvoiceHash
} from "../src/services/invoice/invoiceHash.service.js";

async function runTest() {
  try {
    console.log("\nZATCA Invoice Signing Test\n");

    const result = await signInvoice({
      xmlFilePath:
        "./storage/xml/generated/INV-SIMPLIFIED-0001.xml",

      signedInvoicePath:
        "./storage/xml/generated/INV-SIMPLIFIED-0001-node-signed.xml"
    });

    console.log("Signing successful:", result.success);
    console.log("Signed XML:", result.signedInvoicePath);
    console.log("SDK Invoice Hash:", result.invoiceHash);

    // Independently verify hash using our Node.js implementation
    const nodeHash = generateInvoiceHash(
      result.signedInvoicePath
    );

    console.log("Node.js Invoice Hash:", nodeHash.invoiceHash);

    const hashMatches =
      nodeHash.invoiceHash === result.invoiceHash;

    console.log("Hash Match:", hashMatches);

    if (!hashMatches) {
      throw new Error("SDK and Node.js invoice hashes do not match.");
    }

    console.log("\nPASS: Automated invoice signing and hash verification.");

  } catch (error) {
    console.error("\nFAIL:", error.message);
    process.exitCode = 1;
  }
}

runTest();