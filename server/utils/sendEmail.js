import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  // Only create a real SMTP transporter if credentials are provided.
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};

/**
 * Sends an email, or logs it to the console if SMTP isn't configured.
 * This keeps local development unblocked without requiring real email
 * credentials, while production deployments (with EMAIL_* env vars set)
 * send real mail.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const t = getTransporter();

  if (!t) {
    console.log("\n===== EMAIL (SMTP not configured, printing instead) =====");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log("===========================================================\n");
    return { simulated: true };
  }

  return t.sendMail({
    from: process.env.EMAIL_FROM || '"BUBT Nexus" <no-reply@bubtnexus.edu>',
    to,
    subject,
    html,
    text,
  });
};

export const sendVerificationEmail = async (user, rawToken) => {
  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email/${rawToken}`;

  const result = await sendEmail({
    to: user.email,
    subject: "Verify your BUBT Nexus account",
    text: `Hi ${user.name},\n\nWelcome to BUBT Nexus! Please verify your email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create this account, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to BUBT Nexus, ${user.name}</h2>
        <p>Please verify your email address to activate your account.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;background:#1a6bf5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">
            Verify my email
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Or paste this link into your browser: ${verifyUrl}</p>
        <p style="color:#999;font-size:12px;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  });

  return result; // { simulated: true } if SMTP isn't configured, or the nodemailer send result otherwise
};
