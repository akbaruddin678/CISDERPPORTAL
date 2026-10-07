import express from "express";
import { handleEzPayNotification } from "../controller/ezPayWebhookController.js";
// import { loginWebhookUser } from "../controller/webhookAuthController.js";
// import { verifyWebhookToken } from "../middleware/webhookAuth.js";

const router = express.Router();

// // 1. Public Route: Login to get Token
// router.post("/login", loginWebhookUser);


router.post("/ezpay", handleEzPayNotification);

export default router;
