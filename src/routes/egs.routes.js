
import express from "express";

import {
  createEgsUnit,
  getEgsUnits
} from "../controllers/egs.controller.js";

const router = express.Router();

router.post("/companies/:companyId/egs", createEgsUnit);
router.get("/companies/:companyId/egs", getEgsUnits);

export default router;
