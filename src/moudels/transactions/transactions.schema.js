import Joi from "joi";
import { Types } from "mongoose";

export const makeTransfer = Joi.object({
  amount: Joi.number().positive().required(),
  email: Joi.string().email().required()
}).required();

export const confirmTransfer = Joi.object({
  transferId: Joi.string().custom((v, helper) => {
    return Types.ObjectId.isValid(v) ? v : helper.message("invalid transferId");
  }).required()
}).required();

export const getMyTransactions = Joi.object({
  type: Joi.string().valid("all", "sent", "received").default("all"),
  status: Joi.string().valid("pending", "confirmed", "expired"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid("newest", "oldest").default("newest")
}).required();