const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },

    planType: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "pending",
      index: true,
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    amount: {
      type: Number,
      required: true,
    },

    // Track which courses this subscription covers
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    }],

    // Optional coupon reference
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },

  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;