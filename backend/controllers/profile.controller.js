const InstituteAdmin = require("../models/InstituteAdmin");

exports.getProfile = async (req, res, next) => {
  try {
    const user = await InstituteAdmin.findById(req.userId).select("name email contactNumber institution role isProfileCompleted isPaymentDone googleId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. User no longer exists.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        institution: user.institution,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        isPaymentDone: user.isPaymentDone,
        googleId: user.googleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

