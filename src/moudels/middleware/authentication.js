import { User } from "../../../DB/models/user.model.js";
import jwt from "jsonwebtoken";




export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerToken = req.headers.token;

    let rawJwt = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      rawJwt = authHeader.slice(7).trim();
    } else if (headerToken && headerToken.startsWith(process.env.BEARER_KEY)) {
      rawJwt = headerToken.slice(process.env.BEARER_KEY.length).trim();
    }

    if (!rawJwt) {
      const err = new Error("Valid token is required");
      err.status = 401;
      return next(err);
    }

    const payload = jwt.verify(rawJwt, process.env.TOKEN_SECRET);

    const user = await User.findById(payload.id);
    if (!user) {
      const err = new Error("User not found");
      err.status = 401;
      return next(err);
    }

    req.user = user;
    return next();
  } catch {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }
};