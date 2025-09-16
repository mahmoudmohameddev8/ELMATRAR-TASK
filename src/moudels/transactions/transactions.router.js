
 import { Router } from "express";
 import { validation } from "../middleware/valdiation.middleware.js";
import { isAuthenticated } from "../middleware/authentication.js";
 import * as transactionsController from "./transactions.controller.js";
 import * as transactionsSchema from "./transactions.schema.js";
const router = Router();

router.post(
  "/makeTransfer",
  isAuthenticated,
  validation(transactionsSchema.makeTransfer),
  transactionsController.makeTransfer
);


router.post(
  "/confirmTransfer",
  isAuthenticated,
  validation(transactionsSchema.confirmTransfer),
  transactionsController.confirmTransfer
);

router.get(
  "/getMyPoints",
  isAuthenticated,
  transactionsController.getMyPoints
);


router.get(
  "/getMyTransactions",
  isAuthenticated,
  validation(transactionsSchema.getMyTransactions),
  transactionsController.getMyTransactions
);

export default router;