const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Subscription = require("../models/Subscription");
const PLANS = require("../config/plans");

// GET /api/v1/institutions/:institutionId/subscriptions/history
// Returns a lightweight history list shaped for the frontend table
exports.getHistory = asyncHandler(async (req, res) => {
  const { institutionId } = req.params;

  if (!institutionId || !mongoose.Types.ObjectId.isValid(institutionId)) {
    return res.status(400).json({ success: false, message: "Invalid institutionId" });
  }

  // Current schema keeps a single record per institution (unique: true)
  // We still return an array for forward-compatibility
  const sub = await Subscription.findOne({ institution: institutionId }).lean();

  if (!sub) {
    return res.status(200).json({ success: true, data: { items: [] } });
  }

  const amountFromPlan = (() => {
    const planAmount = PLANS?.[sub.planType];
    return typeof planAmount === "number" ? planAmount : null;
  })();

  const item = {
    subscriptionId: String(sub._id),
    invoiceId: sub.razorpayPaymentId || sub.razorpayOrderId || null,
    planType: sub.planType,
    status: sub.status,
    amount: amountFromPlan,
    date: sub.startDate || sub.createdAt,
    startDate: sub.startDate,
    endDate: sub.endDate,
  };

  return res.status(200).json({ success: true, data: { items: [item] } });
});


