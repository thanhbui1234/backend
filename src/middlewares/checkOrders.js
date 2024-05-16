import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const { SECRET_CODE } = process.env;

export const checkCreateOder = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_CODE, (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decodedToken;
    next();
  });
};
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET_CODE, (err, decodedToken) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }
      req.user = decodedToken;
      next();
    });
  } else {
    req.user = null;
    next();
  }
}
