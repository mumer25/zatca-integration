
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function validateInvoice({ xmlFilePath }) {
  if (!xmlFilePath) {
    throw new Error("Invoice XML file path is required.");
  }

  const projectRoot = process.cwd();

  const inputPath = path.resolve(projectRoot, xmlFilePath);

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

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Invoice XML not found: ${inputPath}`);
  }

  if (!fs.existsSync(sdkJar)) {
    throw new Error(`ZATCA SDK JAR not found: ${sdkJar}`);
  }

  if (!fs.existsSync(sdkConfig)) {
    throw new Error(`SDK configuration not found: ${sdkConfig}`);
  }

  const args = [
    "-jar",
    sdkJar,
    "-invoice",
    inputPath,
    "-validate"
  ];

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

    const checks = [
      ["XSD", /\[XSD\]\s+validation result\s*:\s*PASSED/i],
      ["EN", /\[EN\]\s+validation result\s*:\s*PASSED/i],
      ["KSA", /\[KSA\]\s+validation result\s*:\s*PASSED/i],
      ["QR", /\[QR\]\s+validation result\s*:\s*PASSED/i],
      ["SIGNATURE", /\[SIGNATURE\]\s+validation result\s*:\s*PASSED/i],
      ["PIH", /\[PIH\]\s+validation result\s*:\s*PASSED/i]
    ];

    const results = {};

    for (const [name, pattern] of checks) {
      const passed = pattern.test(sdkOutput);

      // Some SDK validation stages may not appear for every invoice type.
      const reported = new RegExp(
        `\\[${name}\\]\\s+validation result\\s*:`,
        "i"
      ).test(sdkOutput);

      results[name] = {
        reported,
        passed: reported ? passed : null
      };
    }

    const globalPassed =
      /GLOBAL VALIDATION RESULT\s*=\s*PASSED/i.test(sdkOutput);

    const globalFailed =
      /GLOBAL VALIDATION RESULT\s*=\s*FAILED/i.test(sdkOutput);

    if (!globalPassed) {
      return {
        success: false,
        globalPassed: false,
        results,
        sdkOutput
      };
    }

    return {
      success: true,
      globalPassed: true,
      results,
      sdkOutput
    };

  } catch (error) {
    const details = [
      error.message,
      error.stdout,
      error.stderr
    ].filter(Boolean).join("\n");

    throw new Error(`ZATCA invoice validation failed:\n${details}`);
  }
}
