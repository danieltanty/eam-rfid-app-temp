import { verifyToken } from "../lib/jwt.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid or missing token" });
  }

  try {
    const token = header.split(" ")[1];
    req.user = verifyToken(token);

    if (req.context) {
      req.context.username = req.user?.username;
    }
    
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}