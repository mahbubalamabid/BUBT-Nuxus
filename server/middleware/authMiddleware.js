import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Protect routes - verifies JWT and attaches user to req
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

// Like protect, but for routes guests are allowed to hit too (public browsing
// of dashboard/projects/profiles). If a valid token is present, req.user is
// attached so the controller can personalize the response; if not, the request
// just continues with req.user left undefined instead of being rejected.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer")) {
    try {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    } catch (error) {
      // Invalid/expired token on a public route - just proceed as a guest
      // rather than blocking the request.
    }
  }

  next();
});
