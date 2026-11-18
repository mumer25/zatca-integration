
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { generateStandardInvoiceXml } from "../src/services/invoice/invoiceXml.service.js";

const require = createRequire(import.meta.url);
const { create } = require("xmlbuilder2");

try {
  const fixturePath = path.resolve(
    "tests/fixtures/standard-invoice.json"
  );

  const invoiceData = JSON.parse(
    fs.readFileSync(fixturePath, "utf8")
  );

  const xml = generateStandardInvoiceXml(invoiceData);

  // Confirm that the generated XML is well-formed.
  create(xml);

  const outputDir = path.resolve("storage/xml/generated");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    "INV-TEST-0001.xml"
  );

  fs.writeFileSync(outputPath, xml, "utf8");

  const checks = [
    ["Invoice root", xml.includes("<Invoice")],
    ["UBL version", xml.includes("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>")],
    ["Invoice number", xml.includes("INV-TEST-0001")],
    ["Invoice UUID", xml.includes(invoiceData.uuid)],
    ["Standard invoice code", xml.includes('name="0100000">388')],
    ["SAR currency", xml.includes("currencyID=\"SAR\"")],
    ["Seller name", xml.includes("Test Seller Company")],
    ["Buyer name", xml.includes("Test Buyer Company")],
    ["VAT amount", xml.includes("30.00")],
    ["Gross amount", xml.includes("230.00")]
  ];

  console.log("\nZATCA XML Generator Tests\n");

  let passed = 0;

  for (const [name, success] of checks) {
    console.log(`${success ? "PASS" : "FAIL"}: ${name}`);
    if (success) passed++;
  }

  console.log(`\nResults: ${passed}/${checks.length} checks passed`);

  if (passed !== checks.length) {
    process.exitCode = 1;
  } else {
    console.log("\nXML file generated:", outputPath);
  }

} catch (error) {
  console.error("XML generation failed:", error.message);
  process.exitCode = 1;
}
