
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5000";

async function testCompanyAPI() {
  console.log("\nStarting Company API Tests...\n");

  // Test 1: Register a company
  const createResponse = await fetch(`${BASE_URL}/api/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      company_name: "Test Company",
      vat_number: "300000000000003",
      address: "King Fahd Road",
      city: "Riyadh",
      country: "SA",
      environment: "sandbox"
    })
  });

  const createData = await createResponse.json();

  console.log("Create Company:", createData);

  assert.equal(createResponse.status, 201);
  assert.equal(createData.success, true);
  assert.ok(createData.company_id);

  console.log("PASS: Company registration");

  // Test 2: Retrieve companies
  const listResponse = await fetch(`${BASE_URL}/api/companies`);
  const listData = await listResponse.json();

  console.log("\nGet Companies:", listData);

  assert.equal(listResponse.status, 200);
  assert.equal(listData.success, true);
  assert.ok(
    listData.companies.some(
      company => company.id === createData.company_id
    )
  );

  console.log("PASS: Company retrieval");

  // Test 3: Reject duplicate VAT number
  const duplicateResponse = await fetch(`${BASE_URL}/api/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      company_name: "Duplicate Company",
      vat_number: "300000000000003",
      address: "Test Address",
      city: "Riyadh",
      country: "SA",
      environment: "sandbox"
    })
  });

  const duplicateData = await duplicateResponse.json();

  console.log("\nDuplicate Test:", duplicateData);

  assert.equal(duplicateResponse.status, 409);

  console.log("PASS: Duplicate VAT rejection");

  console.log("\nAll Company API Tests Passed!");
}

testCompanyAPI().catch(error => {
  console.error("\nTEST FAILED:", error);
  process.exitCode = 1;
});
