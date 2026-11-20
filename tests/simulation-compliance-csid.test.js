
import "dotenv/config";
import fs from "node:fs";

const csrPath =
  "./storage/certificates/csr/egs-2-simulation.csr";

const csr = fs.readFileSync(csrPath, "utf8");

const csrBase64 = Buffer.from(csr, "utf8").toString("base64");

const otp = process.env.ZATCA_SIMULATION_OTP;

if (!otp) {
  throw new Error("ZATCA_SIMULATION_OTP is missing from environment.");
}

const baseUrl = process.env.ZATCA_SIMULATION_URL;

if (!baseUrl) {
  throw new Error("ZATCA_SIMULATION_URL is missing.");
}

const response = await fetch(
  `${baseUrl.replace(/\/+$/, "")}/compliance`,
  {
    method: "POST",
    headers: {
      OTP: otp,
      "Accept-Version": "V2",
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      csr: csrBase64
    })
  }
);

const responseText = await response.text();

let result;

try {
  result = JSON.parse(responseText);
} catch {
  result = { message: responseText };
}

console.log("HTTP Status:", response.status);
console.log("Success:", response.ok);

if (response.ok) {
  console.log("Disposition:", result.disposition);
  console.log("Request ID:", result.requestID);
  console.log("Simulation Compliance CSID request completed.");
} else {
  console.error("ZATCA Error:", result);
}
