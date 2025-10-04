const crypto = require("crypto");
const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const AppError = require("../utils/appError");
const RedisUtil = require("../utils/redis.util");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.generateOtp = () => {
  const otpLength = parseInt(process.env.OTP_LENGTH, 10) || 6;
  return crypto
    .randomInt(0, Math.pow(10, otpLength))
    .toString()
    .padStart(otpLength, "0");
};

exports.sendVerificationToken = async (email) => {
  try {
    const otp = this.generateOtp();

    // save OTP to Redis with 15 min expiry
    await RedisUtil.saveOtp(email, otp, 900);

    const mailOptions = {
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification - One Time Password (OTP)",
      text: `Dear User,

Your One Time Password (OTP) is: ${otp}

This code is valid for the next 15 minutes. Please do not share this code with anyone for security reasons.

Note: This is an automated message. Please do not reply to this email.

Best regards,  
The TooClarity Team

---
Note: This is a system-generated message. Please do not reply to this email.`
,
    };

    await transporter.sendMail(mailOptions);

    logger.info({ event: "otp_sent", email }, "OTP sent successfully.");
    return true;
  } catch (error) {
    logger.error(
      { err: error, event: "otp_failed", email },
      "OTP sending failed."
    );
    throw new AppError("Could not send OTP.", 500);
  }
};

exports.checkVerificationToken = async (email, code) => {
  try {
    const isValid = await RedisUtil.validateOtp(email, code);

    if (isValid) {
      logger.info(
        { event: "otp_verified", email },
        "OTP verified successfully."
      );
      return true;
    } else {
      logger.warn({ event: "otp_invalid", email }, "OTP invalid or expired.");
      return false;
    }
  } catch (error) {
    logger.error(
      { err: error, event: "otp_check_error", email },
      "OTP check failed."
    );
    return false;
  }
};

exports.sendPaymentSuccessEmail = async (options) => {
  const { email, planType, amount, orderId, startDate, endDate } = options;

  try {
    const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedAmount = (amount / 100).toFixed(2);

    const mailOptions = {
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Subscription is Confirmed!",
      text: `Dear User,

We are happy to inform you that your payment was successful and your subscription is now active!

Here are the details of your plan:
- Plan: ${planType.charAt(0).toUpperCase() + planType.slice(1)}
- Amount Paid: ₹${formattedAmount}
- Order ID: ${orderId}
- Subscription Start Date: ${formattedStartDate}
- Subscription End Date: ${formattedEndDate}

Thank you for choosing us!

Best regards,
The TooClarity Team`,
    };

    await transporter.sendMail(mailOptions);
    logger.info({ event: "payment_success_email_sent", email, orderId }, "Payment success email sent.");
    return true;

  } catch (error) {
    logger.error(
      { err: error, event: "payment_email_failed", email, orderId },
      "Failed to send payment success email."
    );
    return false;
  }
};

exports.sendPasswordChangeToken = async (email) => {
  try {
    const otp = this.generateOtp();

    // Save OTP to Redis with a different key prefix and 10 min expiry
    await RedisUtil.saveOtp(`password-change:${email}`, otp, 600);

    const mailOptions = {
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Change Request - Verification Code",
     text: `Dear User,

A request has been made to change your password. Please use the verification code below to proceed.

Your verification code is: ${otp}

This code is valid for the next 10 minutes. 
For your security, do NOT share this code with anyone. 
If you did not request a password change, please report it to TooClarity Support immediately so we can help secure your account.

Best regards,
The TooClarity Team

---
Note: This is a system-generated message. Please do not reply to this email.`,
    };

    await transporter.sendMail(mailOptions);
    logger.info({ event: "password_otp_sent", email }, "Password change OTP sent.");
    return true;
  } catch (error) {
    logger.error(
      { err: error, event: "password_otp_failed", email },
      "Password change OTP sending failed."
    );
    throw new AppError("Could not send verification code.", 500);
  }
};

exports.checkPasswordChangeToken = async (email, otp) => {
  try {
    // use the same Redis key prefix as in sendPasswordChangeToken
    const redisKey = `password-change:${email}`;
    const isValid = await RedisUtil.validateOtp(redisKey, otp);

    if (isValid) {
      logger.info({ event: "password_otp_verified", email }, "Password OTP verified successfully.");
      // Delete OTP after successful verification
      await RedisUtil.deleteOtp(redisKey);
      return true;
    } else {
      logger.warn({ event: "password_otp_invalid", email }, "Password OTP invalid or expired.");
      return false;
    }
  } catch (error) {
    logger.error({ err: error, event: "password_otp_check_error", email }, "Password OTP check failed.");
    return false;
  }
};

exports.sendPasswordResetLink = async (email, resetURL) => {
  try {
    const mailOptions = {
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset Link (Valid for 15 Mins)",
      text: `Dear User,

You have requested to reset your password. Please click on the link below to proceed.

${resetURL}

This link is valid for the next 15 minutes.
For your security, please do not share this link with anyone.
If you did not request a password change, please ignore this email and contact TooClarity Support immediately.

Best regards,
The TooClarity Team

---
Note: This is a system-generated message. Please do not reply to this email.`,
    };

    await transporter.sendMail(mailOptions);
    logger.info({ event: "password_reset_link_sent", email }, "Password reset link sent.");
    return true;
  } catch (error) {
    logger.error(
      { err: error, event: "password_reset_link_failed", email },
      "Password reset link sending failed."
    );
    throw new AppError("Could not send the password reset link.", 500);
  }
};

exports.sendPasswordChangedConfirmation = async (email) => {
  try {
    const mailOptions = {
      from: `"Security Alert" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Has Been Changed",
      text: `Dear User,

This is a confirmation that the password for your account has just been changed.

If you did NOT make this change, please contact our support team immediately to secure your account.

Best regards,
The TooClarity Team

---
Note: This is a system-generated message. Please do not reply to this email.`
,
    };

    await transporter.sendMail(mailOptions);
    logger.info({ event: "password_change_confirm_sent", email }, "Password change confirmation email sent.");
  } catch (error) {
    logger.error(
      { err: error, event: "password_change_confirm_failed", email },
      "Failed to send password change confirmation email."
    );
    // Don't throw an error here, as the primary password reset action has already succeeded
  }
};