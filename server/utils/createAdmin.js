// Run with: npm run create-admin
// Reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from server/.env and either
// creates a new admin account or promotes an existing user to admin.
// This exists because the public /api/auth/register endpoint deliberately
// refuses to ever create an "admin" role account (see authController.js).
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      "Missing ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD in server/.env - add them, then re-run `npm run create-admin`."
    );
    process.exit(1);
  }

  await connectDB();

  let user = await User.findOne({ email });

  if (user) {
    user.role = "admin";
    user.isVerified = true;
    user.isActive = true;
    user.password = password; // sets/resets the password to match .env
    await user.save();
    console.log(`Existing user "${email}" promoted to admin.`);
  } else {
    user = await User.create({
      name,
      email,
      password,
      role: "admin",
      authProvider: "local",
      isVerified: true,
      isActive: true,
    });
    console.log(`Admin account created: ${email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
