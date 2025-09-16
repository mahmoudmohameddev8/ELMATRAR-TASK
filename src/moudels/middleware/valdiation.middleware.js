import { Types } from "mongoose";

export const isValidObjectID = (value, helper) => {
  if (Types.ObjectId.isValid(value)) return true;
  return helper.message("invalid objecid !");
};


export const validation = (schema) => {
  return (req, res, next) => {
    const inputs = { ...req.body, ...req.params, ...req.query };
    const { error } = schema.validate(inputs, { abortEarly: false });

    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(", "));
      err.status = 400;
      return next(err);
    }

    return next();
  };
};
