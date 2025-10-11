const InstituteAdmin = require('../models/InstituteAdmin');

/**
 * Find or create a user (InstituteAdmin or Student) based on Google profile and userType.
 * @param {object} profile - Google profile
 * @param {string} userType - 'admin' or 'student'
 * @returns {Promise<object>} user
 */
async function findOrCreateGoogleUser(profile, userType) {
  if (userType === 'student') {
    let user = await InstituteAdmin.findOne({ googleId: profile.id, role: 'STUDENT' });
    if (!user) {
      user = await InstituteAdmin.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'STUDENT',
        isEmailVerified: true,
      });
    }
    user._userType = 'student';
    return user;
  } else {
    let user = await InstituteAdmin.findOne({ googleId: profile.id });
    if (!user) {
      user = await InstituteAdmin.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'INSTITUTE_ADMIN',
        isEmailVerified: true,
      });
    }
    user._userType = 'admin';
    return user;
  }
}

module.exports = { findOrCreateGoogleUser };
