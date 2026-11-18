
import db from "../database/db.js";

export function createEgsUnit(req, res) {
  try {
    const companyId = Number(req.params.companyId);
    const { egs_name, device_serial } = req.body;

    if (!Number.isInteger(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID."
      });
    }

    if (!egs_name?.trim() || !device_serial?.trim()) {
      return res.status(400).json({
        success: false,
        message: "EGS name and device serial are required."
      });
    }

    const company = db.prepare(`
      SELECT id FROM zatca_companies
      WHERE id = ? AND status = 'active'
    `).get(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Active company not found."
      });
    }

    const result = db.prepare(`
      INSERT INTO zatca_egs_units (
        company_id,
        egs_name,
        device_serial,
        onboarding_status,
        certificate_status
      )
      VALUES (?, ?, ?, 'not_started', 'not_issued')
    `).run(
      companyId,
      egs_name.trim(),
      device_serial.trim()
    );

    return res.status(201).json({
      success: true,
      message: "EGS unit registered successfully.",
      egs_unit_id: Number(result.lastInsertRowid)
    });

  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "This device serial is already registered for this company."
      });
    }

    console.error("EGS registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register EGS unit.",
      error: error.message
    });
  }
}

export function getEgsUnits(req, res) {
  try {
    const companyId = Number(req.params.companyId);

    const company = db.prepare(`
      SELECT id FROM zatca_companies WHERE id = ?
    `).get(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found."
      });
    }

    const units = db.prepare(`
      SELECT
        id,
        company_id,
        egs_name,
        device_serial,
        onboarding_status,
        certificate_status
      FROM zatca_egs_units
      WHERE company_id = ?
      ORDER BY id DESC
    `).all(companyId);

    return res.json({
      success: true,
      count: units.length,
      egs_units: units
    });

  } catch (error) {
    console.error("Get EGS units error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve EGS units."
    });
  }
}
