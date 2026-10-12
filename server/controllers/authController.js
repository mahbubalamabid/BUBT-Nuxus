import asyncHandler from "express-async-handler";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { generateVerificationToken, hashToken } from "../utils/tokenUtils.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, studentOrEmployeeId } =
    req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const { rawToken, hashedToken } = generateVerificationToken();

  // Never trust a client-supplied role for anything privileged - the public
  // registration endpoint can only ever create ordinary accounts.
  const ALLOWED_PUBLIC_ROLES = ["student", "researcher", "faculty"];
  const safeRole = ALLOWED_PUBLIC_ROLES.includes(role) ? role : "student";

  const user = await User.create({
    name,
    email,
    password,
    role: safeRole,
    department,
    studentOrEmployeeId,
    isVerified: false,
    verificationToken: hashedToken,
    verificationTokenExpires: Date.now() + VERIFICATION_TOKEN_TTL_MS,
  });

  const emailResult = await sendVerificationEmail(user, rawToken);

  // No JWT is issued here - the account is unusable until the email is verified.
  res.status(201).json({
    success: true,
    message: emailResult.simulated
      ? "Account created. SMTP isn't configured on this server, so no real email was sent — check the backend terminal for the verification link."
      : "Account created. Please check your email (including spam/junk) to verify your account before logging in.",
    data: {
      email: user.email,
      emailSimulated: !!emailResult.simulated,
    },
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (user && user.authProvider === "google" && !user.password) {
    res.status(400);
    throw new Error(
      "This account uses Google sign-in. Please continue with Google instead."
    );
  }

  if (user && (await user.matchPassword(password))) {
    if (!user.isVerified) {
      res.status(403);
      throw new Error(
        "Please verify your email before logging in. Check your inbox for the verification link."
      );
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error(
        "Your account has been suspended. Contact an administrator if you believe this is a mistake."
      );
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// @desc    Verify a user's email using the token from their verification link
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = hashToken(req.params.token);

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  }).select("+verificationToken +verificationTokenExpires");

  if (!user) {
    res.status(400);
    throw new Error("This verification link is invalid or has expired");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Email verified successfully. You can now log in.",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    },
  });
});

// @desc    Resend the verification email if the previous link expired or was lost
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });

  // Don't reveal whether the account exists - respond the same way either way.
  if (!user || user.isVerified) {
    return res.json({
      success: true,
      message:
        "If an unverified account exists for this email, a new verification link has been sent.",
    });
  }

  const { rawToken, hashedToken } = generateVerificationToken();
  user.verificationToken = hashedToken;
  user.verificationTokenExpires = Date.now() + VERIFICATION_TOKEN_TTL_MS;
  await user.save();

  const emailResult = await sendVerificationEmail(user, rawToken);

  res.json({
    success: true,
    message: emailResult.simulated
      ? "SMTP isn't configured on this server, so no real email was sent — check the backend terminal for the verification link."
      : "If an unverified account exists for this email, a new verification link has been sent.",
  });
});

// @desc    Sign in (or sign up) using a Google ID token from Google Identity Services
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required");
  }

  // Verify the ID token server-side rather than trusting anything the client sends.
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error("Invalid Google credential");
  }

  const { sub: googleId, email, name, picture, email_verified: emailVerified } = payload;

  if (!emailVerified) {
    res.status(401);
    throw new Error("Your Google account's email is not verified");
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] }).select(
    "+password +googleId"
  );

  if (user) {
    if (!user.isActive) {
      res.status(403);
      throw new Error(
        "Your account has been suspended. Contact an administrator if you believe this is a mistake."
      );
    }
    // Link an existing local account to Google on first Google sign-in.
    if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true; // Google already verified this email address
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }
  } else {
    user = await User.create({
      name,
      email,
      googleId,
      avatar: picture,
      authProvider: "google",
      isVerified: true,
    });
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      token: generateToken(user._id),
    },
  });
});
