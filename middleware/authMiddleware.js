const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      // This is the crucial step where the token is decoded using the JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user from the token payload to the request object
      // We exclude the password field for security
      req.user = await User.findById(decoded.id).select("-password");

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      // Detailed error logging for JWT issues
      if (error.name === "TokenExpiredError") {
        console.error(
          "Token verification failed: Token expired at",
          error.expiredAt
        );
        res.status(401).json({ message: "Not authorized, token expired" });
      } else if (error.name === "JsonWebTokenError") {
        console.error(
          "Token verification failed: Invalid token -",
          error.message
        );
        res.status(401).json({ message: "Not authorized, invalid token" });
      } else {
        console.error("Token verification failed:", error.message);
        res.status(401).json({ message: "Not authorized, token failed" });
      }
    }
  }

  // If no token is found in the headers
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  // Check if the user is authenticated and has the 'admin' role
  if (req.user && req.user.role === "admin") {
    return next(); // If yes, proceed
  }
  // If not an admin, return 403 Forbidden status
  res.status(403).json({ message: "Not authorized as admin" });
};

const verifyAdmin = (req, res, next) => {
  // This is an alternative/redundant check for admin role,
  // ensure consistency with 'admin' middleware if both are used
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
};

module.exports = { protect, admin, verifyAdmin };
