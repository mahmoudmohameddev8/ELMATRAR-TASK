import jwt from "jsonwebtoken";
import { User } from "../../../DB/models/user.model.js";
import { asyncHandler } from "../../../utlis/asyncHandlers.js";
import bcryptjs from "bcryptjs";
import { Token } from "./../../../DB/models/token.model.js";

export const register = asyncHandler(async (req, res, next) => {
  const { email, username, password } = req.body;

  const user = await User.findOne({ email });
  if (user) return next(new Error("user already existed", { cause: 409 }));

  const hashedPassword = bcryptjs.hashSync(
    password,
    parseInt(process.env.SALT_ROUND)
  );

  await User.create({
    email,
    username,
    password: hashedPassword,
    points: parseInt(process.env.REGISTRATION_POINTS),
  });

  const token = jwt.sign({ email }, process.env.TOKEN_SECRET);

  return res.json({
    success: true,
    message:
      "you registered successfully and earned 500 points as registraion gift",
  });
});
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new Error("invalid Email!", { cause: 404 }));

  const match = bcryptjs.compareSync(password, user.password);
  if (!match) return next(new Error("password not match"));

  const token = jwt.sign({ email, id: user._id }, process.env.TOKEN_SECRET);

  await Token.create({ token, user: user._id });

  return res.json({ sucess: true, token });
});
