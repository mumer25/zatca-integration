
-- =====================================
-- 1. DATABASE MIGRATION TRACKING
-- =====================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- 2. COMPANIES
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    vat_number TEXT NOT NULL UNIQUE,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'SA',
    environment TEXT NOT NULL DEFAULT 'sandbox'
        CHECK(environment IN ('sandbox', 'simulation', 'production')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- 3. EGS UNITS
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_egs_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    egs_name TEXT NOT NULL,
    device_serial TEXT NOT NULL,
    private_key_reference TEXT,
    onboarding_status TEXT NOT NULL DEFAULT 'not_started',
    certificate_status TEXT NOT NULL DEFAULT 'not_issued',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(company_id, device_serial),

    FOREIGN KEY(company_id)
        REFERENCES zatca_companies(id)
);

-- =====================================
-- 4. CREDENTIALS
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    egs_unit_id INTEGER NOT NULL,
    credential_type TEXT NOT NULL
        CHECK(credential_type IN ('compliance', 'production')),
    csid TEXT,
    encrypted_secret TEXT,
    certificate_pem TEXT,
    certificate_expiry TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(egs_unit_id)
        REFERENCES zatca_egs_units(id)
);

-- =====================================
-- 5. INVOICE SEQUENCES
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_invoice_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    egs_unit_id INTEGER NOT NULL UNIQUE,
    current_icv INTEGER NOT NULL DEFAULT 0,
    previous_invoice_hash TEXT,

    FOREIGN KEY(egs_unit_id)
        REFERENCES zatca_egs_units(id)
);

-- =====================================
-- 6. INVOICES
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    egs_unit_id INTEGER NOT NULL,

    source_invoice_id TEXT NOT NULL,
    uuid TEXT NOT NULL UNIQUE,

    invoice_type TEXT NOT NULL
        CHECK(invoice_type IN ('standard', 'simplified')),

    document_type TEXT NOT NULL
        CHECK(document_type IN ('invoice', 'credit_note', 'debit_note')),

    invoice_counter INTEGER NOT NULL,
    previous_hash TEXT,
    invoice_hash TEXT,

    original_invoice_id INTEGER,

    total_amount NUMERIC,
    vat_amount NUMERIC,
    currency TEXT DEFAULT 'SAR',

    status TEXT NOT NULL DEFAULT 'draft',
    issue_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(company_id, source_invoice_id),
    UNIQUE(egs_unit_id, invoice_counter),

    FOREIGN KEY(company_id)
        REFERENCES zatca_companies(id),

    FOREIGN KEY(egs_unit_id)
        REFERENCES zatca_egs_units(id),

    FOREIGN KEY(original_invoice_id)
        REFERENCES zatca_invoices(id)
);

-- =====================================
-- 7. INVOICE DOCUMENTS
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_invoice_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL UNIQUE,

    unsigned_xml TEXT,
    signed_xml TEXT,
    cleared_xml TEXT,
    qr_payload TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(invoice_id)
        REFERENCES zatca_invoices(id)
);

-- =====================================
-- 8. SUBMISSIONS
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,

    submission_type TEXT NOT NULL
        CHECK(submission_type IN ('reporting', 'clearance')),

    request_payload TEXT,
    response_payload TEXT,

    http_status INTEGER,
    api_status TEXT,
    error_message TEXT,

    submitted_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(invoice_id)
        REFERENCES zatca_invoices(id)
);

-- =====================================
-- 9. SUBMISSION QUEUE
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_submission_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL UNIQUE,

    submission_type TEXT NOT NULL
        CHECK(submission_type IN ('reporting', 'clearance')),

    queue_status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_retry_at TEXT,
    last_error TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(invoice_id)
        REFERENCES zatca_invoices(id)
);

-- =====================================
-- 10. AUDIT LOGS
-- =====================================

CREATE TABLE IF NOT EXISTS zatca_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    company_id INTEGER,
    egs_unit_id INTEGER,
    invoice_id INTEGER,

    event_type TEXT NOT NULL,
    event_description TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(company_id)
        REFERENCES zatca_companies(id),

    FOREIGN KEY(egs_unit_id)
        REFERENCES zatca_egs_units(id),

    FOREIGN KEY(invoice_id)
        REFERENCES zatca_invoices(id)
);

-- =====================================
-- INDEXES
-- =====================================

CREATE INDEX IF NOT EXISTS idx_egs_company
ON zatca_egs_units(company_id);

CREATE INDEX IF NOT EXISTS idx_invoice_company
ON zatca_invoices(company_id);

CREATE INDEX IF NOT EXISTS idx_invoice_status
ON zatca_invoices(status);

CREATE INDEX IF NOT EXISTS idx_submission_invoice
ON zatca_submissions(invoice_id);

CREATE INDEX IF NOT EXISTS idx_queue_status
ON zatca_submission_queue(queue_status);

CREATE INDEX IF NOT EXISTS idx_audit_company
ON zatca_audit_logs(company_id);
