import { Schema, Types, model } from "mongoose";

const transferSchema = new Schema(
  {
    sender:   { type: Types.ObjectId, ref: "User", required: true },
    receiver: { type: Types.ObjectId, ref: "User", required: true },
    amount:   { type: Number, required: true, min: 1 },
    status:   { type: String, enum: ["pending", "confirmed", "expired"], default: "pending" },
    heldAt:   { type: Date, required: true },       // time of transfer creation
    refunded: { type: Boolean, default: false },    
  },
  { timestamps: true }
);

transferSchema.index({ status: 1, heldAt: 1 });

export const Transfer = model("Transfer", transferSchema);