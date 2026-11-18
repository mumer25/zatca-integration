
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5000";

// Generate a unique serial number for every test run
const deviceSerial = `TEST-EGS-${Date.now()}`;

async function testEgsAPI() {
  console.log("\nStarting EGS API Tests...\n");
  console.log("Test Device Serial:", deviceSerial);

  // Test 1: Register EGS
  const createResponse = await fetch(
    `${BASE_URL}/api/companies/1/egs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        egs_name: "Test EGS Device",
        device_serial: deviceSerial
      })
    }
  );

  const createData = await createResponse.json();
  console.log("\nCreate EGS:", createData);

  assert.equal(createResponse.status, 201);
  assert.equal(createData.success, true);

  console.log("PASS: EGS registration");

  // Test 2: Retrieve EGS units
  const listResponse = await fetch(
    `${BASE_URL}/api/companies/1/egs`
  );

  const listData = await listResponse.json();
  console.log("\nGet EGS Units:", listData);

  assert.equal(listResponse.status, 200);

  assert.ok(
    listData.egs_units.some(
      unit => unit.device_serial === deviceSerial
    )
  );

  console.log("PASS: EGS retrieval");

  // Test 3: Reject duplicate serial
  const duplicateResponse = await fetch(
    `${BASE_URL}/api/companies/1/egs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        egs_name: "Duplicate Device",
        device_serial: deviceSerial
      })
    }
  );

  assert.equal(duplicateResponse.status, 409);

  console.log("PASS: Duplicate EGS rejection");

  // Test 4: Reject invalid company
  const invalidResponse = await fetch(
    `${BASE_URL}/api/companies/999/egs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        egs_name: "Invalid Device",
        device_serial: `INVALID-${Date.now()}`
      })
    }
  );

  assert.equal(invalidResponse.status, 404);

  console.log("PASS: Invalid company rejection");

  console.log("\nAll EGS API Tests Passed!");
}

testEgsAPI().catch(error => {
  console.error("\nTEST FAILED:", error);
  process.exitCode = 1;
});
