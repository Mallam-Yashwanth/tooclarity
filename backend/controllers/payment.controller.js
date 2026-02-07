// controllers/payment.controller.js

const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const Subscription = require("../models/Subscription");
const InstituteAdmin = require("../models/InstituteAdmin");
const Coupon = require("../models/coupon");
const RedisUtil = require("../utils/redis.util");
const Course = require("../models/Course");

// CORRECT: Importing the job function
const { addPaymentSuccessEmailJob } = require('../jobs/email.job.js');

const PLANS = require("../config/plans");
const logger = require('pino')();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PAYMENT_CONTEXT_TTL = 60 * 60; // 60 minutes to survive delayed webhooks


exports.createOrder = asyncHandler(async (req, res, next) => {
  const { planType, couponCode, courseIds = [], listingType, noOfMonths } = req.body;
  const userId = req.userId;
  const isFreeListingRequest = listingType === "free" || req.body.amount === 0;

  console.log("[Payment] Create order request received:", {
    userId,
    planType,
    couponCode,
    isFreeListingRequest,
    noOfMonths
  });

  // ✅ Step 1: Get institution linked to admin
  const institutionDoc = await InstituteAdmin.findById(userId).select("institution");
  const institutionId = institutionDoc?.institution;
  if (!institutionId) {
    console.error("[Payment] Institution not found for user:", userId);
    return next(new AppError("Institution not found", 404));
  }
  console.log("[Payment] Institution found:", institutionId);

  // ✅ Step 2: Determine valid selected course IDs
  // If courseIds explicit provided: validate them
  // If not provided (signup flow): fetch ALL inactive courses
  let validSelectedCourseIds = [];

  if (Array.isArray(courseIds) && courseIds.length) {
    const normalizedIds = [...new Set(courseIds.filter((id) => typeof id === "string" && id.trim()))];
    const objectIds = normalizedIds
      .map((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return new mongoose.Types.ObjectId(id);
      })
      .filter(Boolean);

    if (objectIds.length) {
      const foundCourses = await Course.find({
        _id: { $in: objectIds },
        institution: institutionId,
        status: { $in: ["Inactive", "inactive"] },
      })
        .select("_id")
        .lean();
      validSelectedCourseIds = foundCourses.map((course) => course._id);
    }
  } else {
    // If no courseIds provided, do NOT auto-select all courses.
    console.log("[Payment] No courseIds provided. Request will be rejected.");
  }

  if (!validSelectedCourseIds.length) {
    console.error("[Payment] No inactive courses found to activate");
    return next(new AppError("No inactive courses available to activate", 400));
  }

  // ✅ FREE LISTING FLOW: Skip Razorpay, activate courses directly with limited features
  if (isFreeListingRequest) {
    console.log("[Payment] Processing FREE LISTING for courses:", validSelectedCourseIds.length);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const now = new Date();
      // Free listings get 30 days validity
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);

      // Create subscription record for free listing
      const freeSubscription = await Subscription.create(
        [{
          institution: institutionId,
          status: "active",
          razorpayOrderId: `free_${Date.now()}`,
          razorpayPaymentId: null,
          amount: 0,
        }],
        { session }
      );
      console.log("[Payment] Free subscription created:", freeSubscription[0]._id);

      // Activate selected courses with FREE listing type
      const courseUpdateResult = await Course.updateMany(
        {
          institution: institutionId,
          status: { $in: ["Inactive", "inactive"] },
          _id: { $in: validSelectedCourseIds },
        },
        {
          $set: {
            status: "Active",
            listingType: "free", // Mark as free listing with limited features
            courseSubscriptionStartDate: new Date(),
            courseSubscriptionEndDate: endDate,
          },
        },
        { session }
      );

      console.log(`[Payment] ✅ Activated ${courseUpdateResult.modifiedCount} courses with FREE listing`);

      await session.commitTransaction();
      session.endSession();

      // Return success response for free listing
      return res.status(200).json({
        status: "success",
        message: "Free listing activated successfully",
        listingType: "free",
        planType: "free",
        totalActivatedCourses: courseUpdateResult.modifiedCount,
        validUntil: endDate,
        orderId: freeSubscription[0].razorpayOrderId,
        amount: 0,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("[Payment] Free listing activation failed:", err);
      return next(new AppError("Failed to activate free listing", 500));
    }
  }

  // ✅ PAID FLOW: Continue with Razorpay
  // ✅ Step 3: Validate plan type and get base amount
  const planPrice = PLANS[planType.toLowerCase()];
  if (!planPrice) {
    console.error("[Payment] Invalid plan type:", planType);
    return next(new AppError("Invalid plan type specified", 400));
  }

  const effectiveCourseCount = validSelectedCourseIds.length;

  let amount = effectiveCourseCount * planPrice * noOfMonths;
  console.log("[Payment] Base amount (before coupon):", amount);

  // ✅ Step 4: Check coupon validity and apply discount if applicable
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return next(new AppError("Invalid or unauthorized coupon code", 400));
    }

    if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
      return next(new AppError("Coupon has expired", 400));
    }

    const discount = (amount * coupon.discountPercentage) / 100;
    amount = Math.max(0, Math.round((amount - discount) * 100) / 100);


    console.log("[Payment] Coupon applied:", {
      couponCode,
      discountPercentage: coupon.discountPercentage,
      discount,
      finalAmount: amount,
    });
  }

  // ✅ Step 5: Create Razorpay order
  const options = {
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  let order;
  try {
    order = await razorpay.orders.create(options);
    console.log("[Payment] Razorpay order created:", order);
  } catch (err) {
    console.error("[Payment] Razorpay order creation failed:", err);
    return next(new AppError("Failed to create order with Razorpay", 500));
  }

  // ✅ Step 6: Persist transient payment context in Redis
  try {
    await RedisUtil.cachePaymentContext(
      order.id,
      {
        institution: institutionId.toString(),
        selectedCourseIds: validSelectedCourseIds.map((id) => id.toString()),
        totalCourses: effectiveCourseCount,
        totalAmount: amount,
        planType,
        pricePerCourse: planPrice,
        couponCode: couponCode || null,
      },
      PAYMENT_CONTEXT_TTL
    );
  } catch (err) {
    console.error("[Payment] Failed to cache payment context:", err);
  }

  // ✅ Step 7: Save/update subscription record
  try {
    const subscription = await Subscription.create(
      {
        institution: institutionId,
        status: "pending",
        planType,
        razorpayOrderId: order.id,
        razorpayPaymentId: null,
        amount,
      },
    );
    console.log("[Payment] Subscription record created:", subscription);
  } catch (err) {
    console.error("[Payment] Subscription DB creation failed:", err);
    return next(new AppError("Failed to create subscription", 500));
  }

  // ✅ Step 8: Respond to client
  res.status(200).json({
    status: "success",
    key: process.env.RAZORPAY_KEY_ID,
    planType,
    totalInactiveCourses: effectiveCourseCount,
    pricePerCourse: planPrice,
    totalAmount: amount,
    orderId: order.id,
  });

  console.log("[Payment] Order response sent to client");
});


/**
 * Shared Helper: Activate Subscription & Courses
 * Handles the logic for updating subscription, institute admin, coupon, and courses.
 */
const activateSubscription = async ({ orderId, paymentId, session, paymentContext }) => {
  // 1. Fetch Subscription
  console.log(`[Activation] Fetching subscription for order: ${orderId}`);
  const subscription = await Subscription.findOne({ razorpayOrderId: orderId }).session(session);

  if (!subscription) {
    throw new Error(`Subscription not found for orderId: ${orderId}`);
  }

  // Idempotency Check
  if (subscription.status === "active") {
    console.log(`[Activation] Subscription already active for order: ${orderId}`);
    return { alreadyActive: true, subscription };
  }

  // 2. Calculate End Date
  const now = new Date();
  // Ensure we use the noOfMonths from payment context, default to 1 if missing
  const noOfMonths = parseInt(paymentContext?.noOfMonths || 1, 10);

  const endDate =
    subscription.planType === "yearly"
      ? new Date(now.setFullYear(now.getFullYear() + 1))
      : new Date(now.setMonth(now.getMonth() + noOfMonths));

  // 3. Update Subscription Status
  subscription.status = "active";
  subscription.razorpayPaymentId = paymentId;
  subscription.startDate = new Date();
  subscription.endDate = endDate;
  await subscription.save({ session });

  // 4. Increment Coupon Usage (if applicable)
  if (subscription.coupon) {
    await Coupon.updateOne(
      { _id: subscription.coupon },
      { $inc: { useCount: 1 } },
      { session }
    );
    console.log(`[Activation] Coupon use count incremented`);
  }

  // 5. Update Institute Payment Status
  await InstituteAdmin.updateOne(
    { institution: subscription.institution },
    { $set: { isPaymentDone: true } },
    { session }
  );

  // 6. Activate Selected Courses
  let coursesActivated = 0;
  const redisCourseIds = Array.isArray(paymentContext?.selectedCourseIds)
    ? paymentContext.selectedCourseIds
    : [];

  const validCourseObjectIds = redisCourseIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (validCourseObjectIds.length > 0) {
    const courseMatch = {
      institution: subscription.institution,
      status: { $in: ["Inactive", "inactive"] },
      _id: { $in: validCourseObjectIds },
    };

    const courseUpdateResult = await Course.updateMany(
      courseMatch,
      {
        $set: {
          status: "Active",
          courseSubscriptionStartDate: new Date(),
          courseSubscriptionEndDate: endDate,
        },
      },
      { session }
    );
    coursesActivated = courseUpdateResult.modifiedCount;
  }

  console.log(`[Activation] Success. Activated ${coursesActivated} courses.`);
  return { alreadyActive: false, subscription, coursesActivated };
};

exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // ✅ 1. Verify Razorpay signature
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest !== req.headers["x-razorpay-signature"]) {
    console.log("[Payment Webhook] ❌ Invalid signature received.");
    return res.status(400).json({ status: "error", message: "Invalid signature" });
  }

  const { event, payload } = req.body;

  // ✅ 2. Only handle successful capture event
  if (event !== "payment.captured") {
    console.log("[Payment Webhook] Ignored non-capture event:", event);
    return res.status(200).json({ status: "ignored" });
  }

  const { order_id, id: payment_id, amount } = payload.payment.entity;

  // Retrieve Context
  const paymentContext = await RedisUtil.getPaymentContext(order_id);
  if (!paymentContext) {
    console.error(`[Payment Webhook] ⚠️ Payment context missing for order: ${order_id}`);
    // If payment context is strictly required for course activation, throw an error.
    // Otherwise, the activateSubscription helper will handle missing course IDs gracefully.
    // For now, we'll let it proceed, but log the warning.
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ CALL SHARED ACTIVATION HELPER
    const result = await activateSubscription({
      orderId: order_id,
      paymentId: payment_id,
      session,
      paymentContext
    });

    await session.commitTransaction();
    session.endSession();

    if (result.alreadyActive) {
      console.log(`[Payment Webhook] Payment already processed for ${order_id}`);
      return res.status(200).json({ status: "already_active" });
    }

    console.log(`[Payment Webhook] ✅ Activation complete for ${order_id}`);

    // ✅ Post-activation: Send Email (Non-transactional)
    try {
      const admin = await InstituteAdmin.findOne({ institution: result.subscription.institution }).select("name email").lean();
      if (admin?.email) {
        await addPaymentSuccessEmailJob({
          name: admin.name,
          email: admin.email,
          planType: result.subscription.planType,
          amount: amount / 100, // Use amount from webhook payload (paise -> INR)
          orderId: order_id,
          startDate: result.subscription.startDate,
          endDate: result.subscription.endDate,
        });
        console.log(`[Payment Webhook] 📧 Email queued for ${admin.email}`);
      }
    } catch (emailErr) {
      console.error("[Payment Webhook] ⚠️ Failed to queue email:", emailErr);
    }

    // Cleanup
    await RedisUtil.deletePaymentContext(order_id);

    return res.status(200).json({ status: "success" });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(`[Payment Webhook] ❌ Transaction failed for order ${order_id}: ${err.message}`);
    return next(new AppError("Payment verification failed", 500));
  }
});

exports.pollSubscriptionStatus = asyncHandler(async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId, paymentId, signature } = req.query;

    if (!userId) {
      return res.status(400).json({ status: "error", message: "Missing userId" });
    }

    // ✅ MANUAL VERIFICATION (Immediate Activation)
    // If paymentId and signature provided, we verify and activate immediately
    if (orderId && paymentId && signature) {
      const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if (generated_signature === signature) {
        console.log(`[Poll Status] ✅ Signature verified for order ${orderId}`);

        const paymentContext = await RedisUtil.getPaymentContext(orderId);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // ✅ CALL SHARED ACTIVATION HELPER
          const result = await activateSubscription({
            orderId,
            paymentId,
            session,
            paymentContext
          });

          await session.commitTransaction();
          console.log(`[Poll Status] ✅ Manual activation successful for ${orderId}`);

          // Cleanup
          await RedisUtil.deletePaymentContext(orderId);

        } catch (err) {
          await session.abortTransaction();
          console.error(`[Poll Status] ❌ Manual activation failed for order ${orderId}: ${err.message}`);
          // Don't error out the poll request; just log and fall through to return status
        } finally {
          session.endSession();
        }
      } else {
        console.warn(`[Poll Status] ⚠️ Invalid signature for order ${orderId}`);
      }
    }

    const subscription = await Subscription.aggregate([
      {
        $lookup: {
          from: "instituteadmins",
          localField: "institution",
          foreignField: "institution",
          as: "admin",
        },
      },
      { $unwind: "$admin" },
      {
        $match: {
          "admin._id": new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          status: 1,
          planType: 1,
          startDate: 1,
          endDate: 1,
          razorpayOrderId: 1,
          institution: 1,
        },
      },
    ]);

    // Filter to the specific order if multiple exist or just find the relevant one
    const sub = subscription.find(s => s.razorpayOrderId === orderId) || subscription[0];

    if (!sub) {
      // Fallback if no specific order found but subscription list exists
      if (subscription.length === 0) {
        return res.status(404).json({ success: false, message: "pending" });
      }
    }

    // If we activated it above, sub.status might still be stale in 'subscription' fetch 
    // if fetch happened before update? No, we fetch after. 
    // Wait, I put the aggregate call *after* the update logic block. So it should return the fresh status.

    // Safe check if sub is undefined
    if (!sub) return res.status(404).json({ success: false, message: "pending" });

    return res
      .status(200)
      .json({ success: true, message: sub.status });
  } catch (err) {
    console.error("[Poll Subscription] ❌ Error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

exports.getPayableAmount = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const planType = "yearly" // or req.query if you prefer query params

  if (!userId) {
    return res.status(400).json({ status: "error", message: "Missing userId" });
  }

  try {
    // Aggregation: get institution and count inactive courses
    const result = await InstituteAdmin.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "courses",
          let: { institutionId: "$institution" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$institution", "$$institutionId"] },
                    {
                      $eq: [
                        { $toLower: "$status" },
                        "inactive",
                      ],
                    },
                  ],
                },
              },
            },
            { $count: "totalInactiveCourses" },
          ],
          as: "courseStats",
        },
      },
      {
        $project: {
          _id: 0,
          totalInactiveCourses: {
            $ifNull: [{ $arrayElemAt: ["$courseStats.totalInactiveCourses", 0] }, 0],
          },
        },
      },
    ]);

    const data = result[0];
    if (!data) {
      return res
        .status(404)
        .json({ status: "error", message: "InstituteAdmin not found" });
    }

    const { totalInactiveCourses } = data;

    // Get price per plan
    const planPrice = PLANS[planType];
    if (!planPrice) {
      return res.status(400).json({
        status: "error",
        message: `Invalid plan type: ${planType}`,
      });
    }

    // Calculate total
    const totalAmount = totalInactiveCourses * planPrice;

    // const totalAmount = 4 * planPrice;

    return res.status(200).json({
      status: "success",
      planType,
      totalInactiveCourses,
      pricePerCourse: planPrice,
      totalAmount,
    });
  } catch (error) {
    console.error("❌ Error in getPayableAmount:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

