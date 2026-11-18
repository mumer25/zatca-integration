
import db from "../database/db.js";

export function createCompany(req, res) {
  try {
    const {
      company_name,
      vat_number,
      address,
      city,
      country = "SA",
      environment = "sandbox"
    } = req.body;

    if (!company_name || !vat_number || !address || !city) {
      return res.status(400).json({
        success: false,
        message: "Company name, VAT number, address and city are required."
      });
    }

    // Saudi VAT number: 15 digits, starting and ending with 3.
    if (!/^3\d{13}3$/.test(vat_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Saudi VAT number format."
      });
    }

    if (!["sandbox", "simulation", "production"].includes(environment)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ZATCA environment."
      });
    }

    const result = db.prepare(`
      INSERT INTO zatca_companies (
        company_name,
        vat_number,
        address,
        city,
        country,
        environment
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      company_name.trim(),
      vat_number,
      address.trim(),
      city.trim(),
      country,
      environment
    );

    return res.status(201).json({
      success: true,
      message: "Company registered successfully.",
      company_id: Number(result.lastInsertRowid)
    });

  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "This VAT number is already registered."
      });
    }

    console.error("Create company error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register company."
    });
  }
}

export function getCompanies(req, res) {
  try {
    const companies = db.prepare(`
      SELECT
        id,
        company_name,
        vat_number,
        address,
        city,
        country,
        environment,
        status
      FROM zatca_companies
      ORDER BY id DESC
    `).all();

    return res.json({
      success: true,
      count: companies.length,
      companies
    });

  } catch (error) {
    console.error("Get companies error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve companies."
    });
  }
}
