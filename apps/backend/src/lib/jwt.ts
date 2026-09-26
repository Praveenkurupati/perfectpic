import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

export const signToken = (payload: object, expiresIn = "7d") => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};
