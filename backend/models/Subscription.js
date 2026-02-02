const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
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
    amount: {
      type: Number,
      required: true,
    },

  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;