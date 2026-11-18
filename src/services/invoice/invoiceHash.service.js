
import fs from "node:fs";
import crypto from "node:crypto";

import {
  XmlDocument,
  XmlC14NMode
} from "libxml2-wasm";

const NAMESPACES = {
  ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
  cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
};

export function generateInvoiceHash(xmlFilePath) {
  const xmlContent = fs.readFileSync(xmlFilePath, "utf8");

  const document = XmlDocument.fromString(xmlContent);

  try {
    // 1. Remove UBL extensions.
    const extensions = document.find(
      "//ext:UBLExtensions",
      NAMESPACES
    );

    extensions.forEach(node => node.remove());

    // 2. Remove QR code reference.
    const qrReferences = document.find(
      "//cac:AdditionalDocumentReference[cbc:ID='QR']",
      NAMESPACES
    );

    qrReferences.forEach(node => node.remove());

    // 3. Remove UBL signature.
    const signatures = document.find(
      "//cac:Signature",
      NAMESPACES
    );

    signatures.forEach(node => node.remove());

    // 4. Canonicalize using C14N 1.1.
    const canonicalXml = document.canonicalizeToString({
      mode: XmlC14NMode.XML_C14N_1_1,
      withComments: false
    });

    // 5. Generate SHA-256 and encode as Base64.
    const invoiceHash = crypto
      .createHash("sha256")
      .update(canonicalXml, "utf8")
      .digest("base64");

    return {
      invoiceHash,
      canonicalXml
    };

  } finally {
    document.dispose();
  }
}
