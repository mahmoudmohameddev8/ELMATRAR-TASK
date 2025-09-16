import Joi from "joi";

export const register = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required()
 
}).required();

export const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
}).required().unknown(true)
