import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

export const signToken = (payload: object, expiresIn: string | number = "7d"): string => {
  return jwt.sign(payload, SECRET, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};
