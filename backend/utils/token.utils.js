const JwtUtil = require("./jwt.util");
const CookieUtil = require("./cookie.util");
const RedisUtil = require("./redis.util");

/**
 * Generates access & refresh tokens, saves refresh token in Redis,
 * sets cookies, and returns the response.
 *
 * @param {Object} user - Mongoose user document
 * @param {Object} res - Express response object
 * @param {string} message - Message to send in response
 */
const sendTokens = async (user, res, message, options ={}) => {
  const userId = user._id;
  const username = user.name; // unified field in InstituteAdmin for all roles
  const role = user.role || "STUDENT"; // default role

  // 1. generate tokens
  const accessToken = JwtUtil.generateToken(userId, username, "access", role);
  const refreshToken = JwtUtil.generateToken(userId, username, "refresh", role);

  // 2. decode refresh to calculate expiry
  const decodedRefresh = JwtUtil.decodeToken(refreshToken);
  const ttlSeconds = decodedRefresh.exp - Math.floor(Date.now() / 1000);

  // 3. save refresh token in Redis
  await RedisUtil.saveRefreshToken(userId, refreshToken, ttlSeconds);

  // 4. set cookies
  CookieUtil.setCookie(res, "access_token", accessToken);
  CookieUtil.setCookie(res, "username", username, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (options.returnTokens) {
    return { accessToken, refreshToken, user };
  }

  // 5. respond
  return res.status(200).json({
    status: "success",
    message,
  });
};

module.exports = { sendTokens };
