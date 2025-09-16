import { Router } from "express";
import { validation } from "../../moudels/middleware/valdiation.middleware.js";
import * as authController from "./auth.controller.js";
import * as authSchema from "./auth.schema.js";

const router = Router();


router.post(
  "/register",
  validation(authSchema.register),
  authController.register
);
;

router.post("/login", validation(authSchema.login), authController.login);
export default router;