
import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    username:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    points:   { type: Number},
    pending:  { type: Number, default: 0, min: 0 },   
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
