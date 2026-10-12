// Must run after `protect`, which attaches req.user from the JWT.
// This just adds the role check on top.
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }
  next();
};
