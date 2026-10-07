import express from "express";
import * as TermCtrl from "../controller/term.controller.js";

const router = express.Router();

router.get("/", TermCtrl.getAllTerms);
router.get("/active", TermCtrl.getActiveTerms);
router.get("/:id", TermCtrl.getTermById);
router.post("/", TermCtrl.createTerm);
router.put("/:id", TermCtrl.updateTerm);
router.patch("/:id/toggle-status", TermCtrl.toggleTermStatus);
router.delete("/:id", TermCtrl.deleteTerm);

export default router;
