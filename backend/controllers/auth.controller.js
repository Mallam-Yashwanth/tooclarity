const InstituteAdmin = require("../models/InstituteAdmin");
const otpService = require("../services/otp.service");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("../utils/appError");
const crypto = require('crypto');

const CookieUtil = require("../utils/cookie.util");
const RedisUtil = require("../utils/redis.util");

const { sendTokens } = require("../utils/token.utils");

exports.register = async (req, res, next, options = {}) => {
  try {
    const {
      name,
      email,
      password,
      contactNumber,
      designation,
      linkedinUrl,
      type,
      googleId,
      profilePicture,
    } = req.body;

    const existingUser = await InstituteAdmin.findOne({ $or: [{ email }] });

    if (existingUser) {
      if (options.returnTokens) {
        const err = new Error("User already exists");
        err.code = "USER_EXISTS";
        throw err;
      }
      return res.status(409).json({
        status: "fail",
        message: "Email already in use.",
      });
    }

    let newUser;

    if (type === "institution") {
      newUser = await InstituteAdmin.create({
        name,
        email,
        password: password || undefined,
        contactNumber: contactNumber || "",
        designation: designation || "",
        linkedinUrl: linkedinUrl || "",
        role: "INSTITUTE_ADMIN",
        isPaymentDone: false,
        isProfileCompleted: false,
        address: undefined,
        profilePicture: profilePicture || "",
        googleId: googleId || undefined,
        isEmailVerified: !!googleId,
        isPhoneVerified: false,
      });

      // ⚠️ Only send OTP in normal email/password flow
      if (!googleId && !options.returnTokens) {
        await otpService.sendVerificationToken(email);
        return res.status(201).json({
          status: "success",
          message: "OTP sent to email. Please verify to complete registration.",
        });
      }
    } else if (type === "admin") {
      newUser = await InstituteAdmin.create({
        name,
        email,
        password,
        contactNumber,
        designation,
        role: "ADMIN",
        googleId: googleId || undefined,
        isEmailVerified: false,
        isPhoneVerified: false,
      });
    } else if (type === "student") {
      newUser = await InstituteAdmin.create({
        name,
        email,
        password: password || undefined,
        contactNumber,
        role: "STUDENT",
        isProfileCompleted: false,
        address: "",
        profilePicture: profilePicture || "",
        googleId: googleId || undefined,
        isEmailVerified: !!googleId,
        isPhoneVerified: false,
      });
    } else {
      if (options.returnTokens) {
        const err = new Error("Invalid user type");
        err.code = "INVALID_USER_TYPE";
        throw err;
      }
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid user type." });
    }

    // ✅ Issue tokens
    const tokenData = await sendTokens(
      newUser,
      res,
      `${type.toUpperCase()} REGISTERED SUCCESSFULLY`,
      options
    );

    // Enqueue welcome notification per role
    try {
      const { addNotificationJob } = require('../jobs/notification.job');
      const title = 'Welcome to TooClarity';
      const description = `Hi ${newUser.name}, your account has been created.`;
      if (newUser.role === 'INSTITUTE_ADMIN') {
        await addNotificationJob({ title, description, category: 'system', recipientType: 'ADMIN', institutionAdmin: newUser._id });
      } else if (newUser.role === 'STUDENT') {
        await addNotificationJob({ title, description, category: 'system', recipientType: 'STUDENT', student: newUser._id });
      } else if (newUser.role === 'ADMIN') {
        await addNotificationJob({ title, description, category: 'system', recipientType: 'ADMIN', institutionAdmin: newUser._id });
      }
    } catch (_) {}

    // Enqueue welcome notification per role
    try {
      const { addNotificationJob } = require('../jobs/notification.job');
      const title = 'Welcome to TooClarity';
      const description = `Hi ${newUser.name}, your account has been created.`;
      if (newUser.role === 'INSTITUTE_ADMIN') {
        await addNotificationJob({ title, description, category: 'system', recipientType: 'ADMIN', institutionAdmin: newUser._id });
      } else if (newUser.role === 'STUDENT') {
        await addNotificationJob({ title, description, category: 'system', recipientType: 'STUDENT', student: newUser._id });
      } else if (newUser.role === 'ADMIN') {
        await addNotificationJob({ title, description, category: 'system', recipientType: 'ADMIN', institutionAdmin: newUser._id });
      }
    } catch (_) {}

    // ✅ If Google OAuth flow → return tokens only
    if (options.returnTokens) return tokenData;

    // ✅ Otherwise → normal response
    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // 1. Validate OTP from Redis
    const isOtpValid = await otpService.checkVerificationToken(email, otp);
    if (!isOtpValid) {
      return res
        .status(400)
        .json({ status: "fail", message: "Incorrect or expired OTP." });
    }

    // 2. Find user by email
    const user = await InstituteAdmin.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found." });
    }

    // 3. Check if already verified
    if (user.isEmailVerified) {
      return res
        .status(400)
        .json({ status: "fail", message: "Email is already verified." });
    }

    // 4. Mark email as verified
    user.isEmailVerified = true;
    await user.save();

    // 5. Issue tokens (login user immediately after verification)
    return await sendTokens(user, res, "Email verified successfully.");
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next, options = {}) => {
  try {
    const { email, password, googleId } = req.body;
    let user;

    if (googleId) {
      // ✅ Google OAuth login
      user = await InstituteAdmin.findOne({ email, googleId });
      if (!user) {
        if (options.returnTokens) {
          const err = new Error("No account found for this Google user.");
          err.code = "USER_NOT_FOUND";
          throw err;
        }
        return res.status(404).json({
          status: "fail",
          message:
            "No account found for this Google user. Please register first.",
        });
      }
    } else {
      // ✅ Normal email + password login
      user = await InstituteAdmin.findOne({ email }).select("+password");
      const invalid = !user || !(await user.comparePassword(password));

      if (invalid) {
        if (options.returnTokens) {
          const err = new Error("Incorrect email or password.");
          err.code = "INVALID_CREDENTIALS";
          throw err;
        }
        return res.status(401).json({
          status: "fail",
          message: "Incorrect email or password.",
        });
      }
    }

    // ✅ Common checks for Institute Admins
    if (user.role === "INSTITUTE_ADMIN" && !user.isEmailVerified && !googleId) {
      if (options.returnTokens) {
        const err = new Error(
          "Account not verified. Please verify your email."
        );
        err.code = "EMAIL_NOT_VERIFIED";
        throw err;
      }
      return res.status(403).json({
        status: "fail",
        message: "Account not verified. Please verify your Email first.",
      });
    }

    // ✅ Issue tokens
    return await sendTokens(user, res, "Login successful.", options);
  } catch (error) {
    next(error);
  }
};


exports.logout = async (req, res, next) => {
  const userId = req.userId;
  try {
    RedisUtil.deleteRefreshToken(userId);
    CookieUtil.clearAllCookies(res);
    return res.status(200).json({
      status: "success",
      message: "Logged out successfully.",
    });
  }
  catch (err) {
    console.log(err.message);
  }
};

/**
 * @desc    Initiate password reset process by sending a link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Please provide an email address.', 400));
    }

    const user = await InstituteAdmin.findOne({ email });

    if (user) {
      // 1. Generate the unhashed token using the model method
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // 2. Create the full reset URL
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      // 3. Send the email with the link
      try {
        await otpService.sendPasswordResetLink(user.email, resetURL);
      } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('Failed to send email. Please try again later.', 500));
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset user's password using the token from the link
 * @route   PATCH /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, passwordConfirm } = req.body;

    // 1. Hash the token from the URL parameter
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2. Find the user by the hashed token and check if it's not expired
    const user = await InstituteAdmin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return next(new AppError('Token is invalid or has expired.', 400));
    }

    if (password !== passwordConfirm) {
      return next(new AppError('Passwords do not match.', 400));
    }

    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long.', 400));
    }
    
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return next(new AppError('Your new password must be different from your old password.', 400));
    }

    // 3. Set the new password
    user.password = password;

    // 4. Invalidate the reset token (CRITICAL for one-time use)
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // The pre-save middleware will automatically hash the new password and set passwordChangedAt
    await user.save();

    // 5. Send confirmation email
    await otpService.sendPasswordChangedConfirmation(user.email);

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};

