
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import db from "./database/db.js";
import { runMigrations } from "./database/migrate.js";
import companyRoutes from "./routes/company.routes.js";
import egsRoutes from "./routes/egs.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api/companies", companyRoutes);
app.use("/api", egsRoutes);

// Initialize database
runMigrations();

app.get("/", (req, res) => {
  res.json({
    success: true,
    application: "ZATCA Integration Service",
    version: "1.0.0",
    message: "ZATCA integration API is running"
  });
});

app.get("/api/health", (req, res) => {
  const database = db.prepare(
    "SELECT 1 AS connected"
  ).get();

  res.json({
    success: true,
    status: "healthy",
    database: database.connected === 1
      ? "connected"
      : "disconnected",
    environment: process.env.ZATCA_ENV,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `ZATCA Integration API running on port ${PORT}`
  );
});
