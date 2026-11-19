
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function signInvoice({
  xmlFilePath,
  signedInvoicePath
}) {
  if (!xmlFilePath) {
    throw new Error("Invoice XML file path is required.");
  }

  const projectRoot = process.cwd();

  const inputPath = path.resolve(projectRoot, xmlFilePath);

  const outputPath = path.resolve(
    projectRoot,
    signedInvoicePath ||
      path.join(
        path.dirname(inputPath),
        `${path.basename(inputPath, ".xml")}-signed.xml`
      )
  );

  const sdkJar = path.resolve(
    projectRoot,
    process.env.ZATCA_SDK_JAR ||
      "./zatca sdk/Apps/cli-3.0.8-jar-with-dependencies.jar"
  );

  const sdkConfig = path.resolve(
    projectRoot,
    process.env.ZATCA_SDK_CONFIG ||
      "./zatca sdk/Configuration/config.json"
  );

  const fatooraHome = path.resolve(
    projectRoot,
    process.env.FATOORA_HOME || "./zatca sdk/Apps"
  );

  const javaBin = process.env.JAVA_BIN || "java";

  // Check required files
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Invoice XML not found: ${inputPath}`);
  }

  if (!fs.existsSync(sdkJar)) {
    throw new Error(`ZATCA SDK JAR not found: ${sdkJar}`);
  }

  if (!fs.existsSync(sdkConfig)) {
    throw new Error(`SDK configuration not found: ${sdkConfig}`);
  }

  if (inputPath === outputPath) {
    throw new Error("Signed invoice must use a separate output file.");
  }

  // Create output directory
  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true
  });

  // Remove an old output file to avoid treating stale output as success
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  const args = [
    "-jar",
    sdkJar,
    "-invoice",
    inputPath,
    "-sign",
    "-signedInvoice",
    outputPath
  ];

  // Compliance/test certificates use non-production signing mode
  if (process.env.ZATCA_ENV !== "production") {
    args.push("-nonprod");
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      javaBin,
      args,
      {
        cwd: projectRoot,
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          SDK_CONFIG: sdkConfig,
          FATOORA_HOME: fatooraHome
        }
      }
    );

    const sdkOutput = `${stdout || ""}\n${stderr || ""}`;

    if (!fs.existsSync(outputPath)) {
      throw new Error(
        `SDK did not generate signed XML.\n${sdkOutput}`
      );
    }

    const stats = fs.statSync(outputPath);

    if (stats.size === 0) {
      throw new Error("SDK generated an empty signed XML file.");
    }

    const hashMatch = sdkOutput.match(
      /INVOICE HASH\s*=\s*([A-Za-z0-9+/=]+)/i
    );

    if (!hashMatch) {
      throw new Error(
        `Signed XML was generated, but SDK invoice hash was not found.\n${sdkOutput}`
      );
    }

    return {
      success: true,
      signedInvoicePath: outputPath,
      invoiceHash: hashMatch[1],
      sdkOutput
    };

  } catch (error) {
    const details = [
      error.message,
      error.stdout,
      error.stderr
    ].filter(Boolean).join("\n");

    throw new Error(`ZATCA invoice signing failed:\n${details}`);
  }
}
