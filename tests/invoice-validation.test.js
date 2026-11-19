
import "dotenv/config";

import {
  validateInvoice
} from "../src/services/invoice/invoiceValidation.service.js";

async function runTest() {
  try {
    console.log("\nZATCA Invoice Validation Test\n");

    const result = await validateInvoice({
      xmlFilePath:
        "./storage/xml/generated/INV-SIMPLIFIED-0001-node-signed.xml"
    });

    console.log("Global validation:", result.globalPassed);

    console.log("\nIndividual Results:");

    for (const [name, check] of Object.entries(result.results)) {
      const status = !check.reported
        ? "NOT REPORTED"
        : check.passed
          ? "PASSED"
          : "FAILED";

      console.log(`${name}: ${status}`);
    }

    if (!result.success) {
      console.log("\nSDK Output:\n", result.sdkOutput);
      throw new Error("Invoice validation did not pass.");
    }

    console.log("\nPASS: Automated invoice validation.");

  } catch (error) {
    console.error("\nFAIL:", error.message);
    process.exitCode = 1;
  }
}

runTest();
