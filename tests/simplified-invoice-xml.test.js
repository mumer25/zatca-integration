
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import {
  generateStandardInvoiceXml
} from "../src/services/invoice/invoiceXml.service.js";

const require = createRequire(import.meta.url);
const { create } = require("xmlbuilder2");

try {
  const fixturePath = path.resolve(
    "tests/fixtures/simplified-invoice.json"
  );

  const invoiceData = JSON.parse(
    fs.readFileSync(fixturePath, "utf8")
  );

  const xml = generateStandardInvoiceXml(invoiceData);

  // Check that XML is well-formed.
  create(xml);

  const outputDir = path.resolve("storage/xml/generated");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    "INV-SIMPLIFIED-0001.xml"
  );

  fs.writeFileSync(outputPath, xml, "utf8");

  const checks = [
    ["Invoice root", xml.includes("<Invoice")],
    ["UBL version", xml.includes("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>")],
    ["Simplified invoice number", xml.includes("INV-SIMPLIFIED-0001")],
    ["Invoice UUID", xml.includes(invoiceData.uuid)],
    ["Simplified invoice code", xml.includes('name="0200000">388')],
    ["SAR currency", xml.includes('currencyID="SAR"')],
    ["Seller name", xml.includes("Test Seller Company")],
    ["VAT amount", xml.includes("30.00")],
    ["Gross amount", xml.includes("230.00")]
  ];

  console.log("\nSimplified Invoice XML Tests\n");

  let passed = 0;

  for (const [name, success] of checks) {
    console.log(`${success ? "PASS" : "FAIL"}: ${name}`);
    if (success) passed++;
  }

  console.log(`\nResults: ${passed}/${checks.length} checks passed`);

  if (passed !== checks.length) {
    process.exitCode = 1;
  } else {
    console.log("\nXML generated:", outputPath);
  }

} catch (error) {
  console.error("Simplified invoice generation failed:", error.message);
  process.exitCode = 1;
}
