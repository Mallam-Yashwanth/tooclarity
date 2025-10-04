const { verifyToken, generateToken, decodeToken, refreshAccessTokenIfNeeded, refreshRefreshTokenIfNeeded } = require("../utils/jwt.util");
const CookieUtil = require("../utils/cookie.util");
const {
  getRefreshToken,
  saveRefreshToken,
  deleteRefreshToken,
} = require("../utils/redis.util");
const User = require("../models/InstituteAdmin"); // 👈 import your User model
const { decode } = require("jsonwebtoken");

const globalAuthMiddleware = async (req, res, next) => {
  try {
    console.log("➡️ Incoming request:", req.method, req.path);

    const publicPaths = ["/login", "/register", "/otp", "/verify-email","/payment/verify", "/forgot-password", "/reset-password" ];
    if (publicPaths.includes(req.path)) {
      console.log("✅ Public path, skipping auth");
      return next();
    }

    // 1️⃣ Extract cookies
    const accessToken = CookieUtil.getCookie(req, "access_token");
    const usernameCookie = CookieUtil.getCookie(req, "username");
    // const usernameCookie = rawUsername ? decodeURIComponent(rawUsername) : null;
    
    console.log("🔹 Access token from cookie:", accessToken);
    console.log("🔹 Username cookie:", usernameCookie);

    let userId;
    let refreshToken;

    if (accessToken) {
      try {
        // normal verify
        const decoded = verifyToken(accessToken);
        console.log("✅ Access token valid:", decoded);
        refreshAccessTokenIfNeeded(req, res);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        return next(); // valid access token
      } catch (err) {
        if (err.name !== "TokenExpiredError") {
          console.log("❌ Invalid access token:", err.message);
          return res.status(401).json({ message: "Invalid access token" });
        }
        console.log("⚠️ Access token expired, will try refresh flow");

        // decode expired access token for userId
        try {
          const decodedAccess = decodeToken(accessToken);
          userId = decodedAccess?.id;
          console.log("🔹 Decoded expired access token:", decodedAccess);
        } catch (decodeErr) {
          console.log("❌ Could not decode expired access token:", decodeErr.message);
        }
      }
    } else {
      console.log("⚠️ No access token found in cookie, fallback to username cookie");
      if (usernameCookie) {
        try {
          const user = await User.findOne({ name: usernameCookie }).select("_id role");
          if (user) {
            userId = user._id.toString();
            console.log("✅ Found userId from username cookie:", userId);
            // Short-circuit for dev usage when username cookie is present
            req.userId = userId;
            req.userRole = decodedAccess.role;
            await refreshRefreshTokenIfNeeded(userId, usernameCookie, );
            return next();
          } else {
            console.log("❌ No user found for username cookie");
          }
        } catch (dbErr) {
          console.error("❌ DB error while fetching userId from username:", dbErr);
        }
      }
    }

    if (!userId) {
      console.log("❌ No userId found (no access token & no valid username cookie)");
      return res.status(401).json({ message: "Session expired, please login again" });
    }

    // 2️⃣ Get refresh token from Redis
    refreshToken = await getRefreshToken(userId);
    console.log("🔹 Refresh token from Redis:", refreshToken);

    if (!refreshToken) {
      console.log("❌ No refresh token found, session expired");
      return res.status(401).json({ message: "Session expired, please login again" });
    }

    // 3️⃣ Verify refresh token
    let decodedRefresh;
    try {
      decodedRefresh = verifyToken(refreshToken);
      userId = decodedRefresh.id;
      req.userRole = decodedRefresh.role;
      req.userId = userId;
      req.userRole = decodedRefresh.role;
      console.log("userId set to req:", userId);
      await refreshRefreshTokenIfNeeded(userId, usernameCookie, refreshToken);
      console.log("✅ Refresh token valid:", decodedRefresh);
    } catch (err) {
      console.log("❌ Refresh token invalid or expired:", err.message);
      await deleteRefreshToken(userId);
      return res.status(401).json({ message: "Refresh expired, please login again" });
    }

    // 4️⃣ Issue new tokens
    const newAccessToken = generateToken(userId, usernameCookie ,"access", decodedRefresh.role);
    CookieUtil.setCookie(res, "access_token", newAccessToken);
    console.log("🔹 New access token issued");

    await refreshRefreshTokenIfNeeded(userId, usernameCookie, refreshToken);

    req.userId = userId;
    req.userRole = decodedRefresh.role;
    return next();
  } catch (err) {
    console.error("🔥 Auth Middleware Error:", err);
    return res.status(500).json({ message: "Internal auth error" });
  }
};

module.exports = globalAuthMiddleware;