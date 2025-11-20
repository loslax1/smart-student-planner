const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // we used { userId: ... } when issuing tokens
    req.user = { userId: decoded.userId };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
};
