
import "dotenv/config";
import fs from "fs";
import path from "path";
import { encryptCredentials } from "../src/utils/credentialEncryption.js";

const baseUrl = process.env.ZATCA_SANDBOX_URL;
const otp = process.env.ZATCA_OTP;

async function testComplianceCSID() {
  try {
    if (!baseUrl || !otp || !process.env.ZATCA_CREDENTIALS_KEY) {
      throw new Error("Required ZATCA environment variables are missing.");
    }

    const csrPath = path.resolve(
      "storage/certificates/csr/egs-2.csr"
    );

    if (!fs.existsSync(csrPath)) {
      throw new Error("CSR file not found.");
    }

    const csrBase64 = Buffer.from(
      fs.readFileSync(csrPath, "utf8"),
      "utf8"
    ).toString("base64");

    console.log("Submitting CSR to ZATCA Sandbox...");

    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/compliance`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "OTP": otp,
          "Accept-Version": "V2"
        },
        body: JSON.stringify({ csr: csrBase64 })
      }
    );

    const result = await response.json();

    console.log("HTTP Status:", response.status);
    console.log("Disposition:", result.dispositionMessage || "Not provided");
    console.log("Request ID:", result.requestID || "Not provided");

    if (result.errors) {
      console.log("ZATCA errors:", JSON.stringify(result.errors, null, 2));
    }

    const issued =
      response.ok &&
      typeof result.dispositionMessage === "string" &&
      result.dispositionMessage.toUpperCase().includes("ISSUED") &&
      result.binarySecurityToken &&
      result.secret;

    if (!issued) {
      throw new Error(
        "Compliance CSID issuance was not confirmed. Credentials were not saved."
      );
    }

    const encrypted = encryptCredentials({
      binarySecurityToken: result.binarySecurityToken,
      secret: result.secret,
      requestID: result.requestID,
      environment: "sandbox",
      issuedAt: new Date().toISOString()
    });

    const outputDir = path.resolve("storage/credentials");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(
      outputDir,
      "compliance-csid.enc"
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(encrypted, null, 2),
      { mode: 0o600 }
    );

    console.log("Compliance CSID issued successfully.");
    console.log("Encrypted credentials saved:", outputPath);

  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  }
}

testComplianceCSID();
