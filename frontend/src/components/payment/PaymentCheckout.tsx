"use client";

import React, { useEffect, useState } from "react";
import { _Card, _CardContent, _CardHeader, _CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Info } from "lucide-react";
import { paymentAPI } from "@/lib/api";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useUserStore } from "@/lib/user-store";


// Simple currency formatter for INR (without symbol to match mock)
function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/^\D+/g, "")
    .replace(/\s/g, "");
}

// Types and plan config
export type PlanKey = "monthly" | "yearly";

type Plan = {
  key: PlanKey;
  title: string;
  oldPrice?: string; // for strike-through
  currentPrice: number; // base amount before coupon
  discount: number; // informational
  displayDiscount?: number;
  badge?: string;
  subtitle?: string;
  comingSoon?: boolean;
};

const PLAN_MAP: Record<PlanKey, Plan> = {
  monthly: {
    key: "monthly",
    title: "Monthly",
    currentPrice: 199,
    discount: 0,
    subtitle: "Coming Soon",
    comingSoon: true,
  },
  yearly: {
    key: "yearly",
    title: "Yearly",
    oldPrice: "1999 INR",
    currentPrice: 1188,
    discount: 189,
    displayDiscount: 198,
    badge: "Best Value",
  },
};

type PaymentCheckoutProps = {
  onProcessing?: (data: { paymentId?: string | null; orderId?: string | null }) => void;
  onSuccess?: (data: { transactionId?: string | null; paymentId?: string | null; orderId?: string | null }) => void;
  onFailure?: (data: { paymentId?: string | null; orderId?: string | null }) => void;
};

export default function PaymentCheckout({ onProcessing, onSuccess, onFailure }: PaymentCheckoutProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("yearly");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ totalInactiveCourses: number; pricePerCourse: number; totalAmount: number } | null>(null);

  const plan = PLAN_MAP[selectedPlan];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await paymentAPI.getPaymentDetails();
        if (!active) return;
        if (res.success && res.data) {
          const data = res.data as {
            totalInactiveCourses?: number;
            totalAmount?: number;
            pricePerCourse?: number;
            planPrice?: number;
          };
          const totalInactiveCourses = Number(data.totalInactiveCourses ?? 0);
          const pricePerCourse = Number(data.pricePerCourse ?? data.planPrice ?? plan.currentPrice) || plan.currentPrice;
          const calculatedTotal = data.totalAmount ?? (typeof data.totalInactiveCourses !== "undefined" ? totalInactiveCourses * pricePerCourse : undefined);
          const totalAmount = Number(calculatedTotal);
          setPaymentDetails({
            totalInactiveCourses,
            pricePerCourse,
            totalAmount: Number.isFinite(totalAmount) ? totalAmount : pricePerCourse,
          });
        }
      } catch (_e) {
      }
    })();
    return () => {
      active = false;
    };
  }, [plan.currentPrice]);

  // Coupon state
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Payment flow UI states
  const [_paymentVerified, setPaymentVerified] = useState<{
    transactionId?: string | null;
    paymentId?: string | null;
    orderId?: string | null;
  } | null>(null);
  const [_paymentProcessing, setPaymentProcessing] = useState<{
    paymentId?: string | null;
    orderId?: string | null;
  } | null>(null);
  const [_paymentFailed, setPaymentFailed] = useState<{
    paymentId?: string | null;
    orderId?: string | null;
  } | null>(null);

  const totalInactiveCourses = paymentDetails?.totalInactiveCourses ?? 0;
  const baseAmount = paymentDetails?.pricePerCourse ?? plan.currentPrice;
  const _subtotal = paymentDetails?.totalAmount ?? baseAmount;
  const _payable = Math.max(_subtotal - couponDiscount, 0);

  async function applyCoupon() {
    const code = coupon.trim();
    if (!code) return;
    try {
      setIsApplyingCoupon(true);
      setCouponMessage(null);
      setCouponDiscount(0);

      const res = await paymentAPI.applyCoupon(code);
      if (res.success && res.data && typeof (res.data as { discountAmount?: number }).discountAmount === "number") {
        const discount = (res.data as { discountAmount?: number }).discountAmount;
        setCouponDiscount(discount || 0);
        setAppliedCoupon(code);
        setCouponMessage("Coupon applied successfully.");
      } else {
        setCouponMessage(res.message || "Invalid or expired coupon.");
      }
    } catch (_e) {
      setCouponMessage("Invalid or expired coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  async function handleConfirmPay() {
    try {
      setIsPaying(true);

      // 1) Create order on backend using payable amount
      const res = await paymentAPI.initiatePayment({
        amount: _payable,
        planType: selectedPlan,
        couponCode: appliedCoupon ?? undefined,
      });

      if (!res.success || !res.data) {
        console.error("Payment init failed:", res.message);
        return;
      }

      // 2) Load Razorpay SDK
      const ok = await loadRazorpayScript();
      if (!ok) {
        console.error("Razorpay SDK failed to load.");
        return;
      }

      // 3) Open Razorpay checkout using returned values
      const { key, amount, orderId } = res.data as { key: string; amount: number; orderId: string };
      const options: Record<string, unknown> = {
        key,
        amount,
        currency: "INR",
        name: "Too Clarity",
        description: `${plan.title} Listing Fee`,
        order_id: orderId,
        notes: {
          plan: selectedPlan,
          coupon: appliedCoupon ?? "",
        },
        theme: { color: "#0222D7" },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
        handler: async (response: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          // Show processing UI while verifying with backend
          setPaymentProcessing({
            paymentId: response.razorpay_payment_id ?? null,
            orderId: response.razorpay_order_id ?? null,
          });
          // Notify parent page
          onProcessing?.({
            paymentId: response.razorpay_payment_id ?? null,
            orderId: response.razorpay_order_id ?? null,
          });
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              orderId: response.razorpay_order_id || '',
              paymentId: response.razorpay_payment_id || '',
              signature: response.razorpay_signature || '',
              planType: selectedPlan,
              coupon: appliedCoupon ?? null,
              amount: _payable,
            });

            const status = (verifyRes.message || "").toLowerCase();

            if (status === "active") {
              // Success
              const txnId = (verifyRes.data as { transactionId?: string | null })?.transactionId || null;

              // Mark payment as done in global store for redirects
              try {
                useUserStore.getState().setPaymentStatus(true);
                console.log("[Payment] isPaymentDone set to true in store");
              } catch (_e) {
                console.warn("[Payment] Failed to set isPaymentDone in store:", _e);
              }

              setPaymentVerified({
                transactionId: txnId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
              onSuccess?.({
                transactionId: txnId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
              setPaymentProcessing(null);
            } else if (status === "expired" || status === "verification_timeout" || !verifyRes.success) {
              // Failed
              console.error("Payment verification failed:", verifyRes.message);
              setPaymentFailed({
                paymentId: response.razorpay_payment_id ?? null,
                orderId: response.razorpay_order_id ?? null,
              });
              onFailure?.({
                paymentId: response.razorpay_payment_id ?? null,
                orderId: response.razorpay_order_id ?? null,
              });
              setPaymentProcessing(null);
            } else {
              // Fallback: keep processing if backend returned unexpected intermediate state
              setPaymentProcessing({
                paymentId: response.razorpay_payment_id ?? null,
                orderId: response.razorpay_order_id ?? null,
              });
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setPaymentFailed({
              paymentId: response.razorpay_payment_id ?? null,
              orderId: response.razorpay_order_id ?? null,
            });
            setPaymentProcessing(null);
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          // name/email/contact if available
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (_e) {
      console.error("Payment init error:", _e);
    }
  }

  // Always render checkout; parent page renders status UIs
  return (
    <main className="mx-auto w-full max-w-8xl px-4 py-8">
      {/* Top bar with back arrow and title */}
      <div className="mb-6 flex items-center gap-2">
        <div>
          <h1 className="text-xl font-semibold">Choose Your Plan</h1>
          <p className="text-sm text-muted-foreground">
            Select the plan that best fits your institution&apos;s growth goals.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left column: Plan selection + features */}
        <section className="space-y-6">
          <div>
            <p className="mb-3 text-sm text-muted-foreground font-bold">
              Select the plan that&apos;s right for you
            </p>

            {/* Plans */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Monthly (disabled / coming soon) */}
              <div
                className={
                  "text-left rounded-xl transition-shadow select-none cursor-not-allowed"
                }
                aria-disabled
              >
                <_Card className="m-0 border-muted bg-muted/30">
                  <_CardContent className="px-6">
                    <div className="flex h-[100px] flex-col items-center justify-center gap-1 text-center opacity-80">
                      <div className="text-base font-medium">Monthly</div>
                      <div className="text-xs text-muted-foreground">Coming Soon</div>
                    </div>
                  </_CardContent>
                </_Card>
              </div>

              {/* Yearly */}
              <button
                type="button"
                onClick={() => setSelectedPlan("yearly")}
                className={`text-left rounded-xl transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedPlan === "yearly" ? "ring-2 ring-[#0222D7] shadow" : ""
                  }`}
                aria-pressed={selectedPlan === "yearly"}
              >
                <_Card className="m-0">
                  <_CardContent className="px-6">
                    <div className="relative flex h-[100px] flex-col items-center justify-center gap-1 text-center">
                      {PLAN_MAP.yearly.badge ? (
                        <span className="absolute -top-3 rounded-full bg-[#0222D7] px-2 py-1 text-[10px] font-medium text-white shadow">
                          {PLAN_MAP.yearly.badge}
                        </span>
                      ) : null}
                      <div className="text-base font-medium">Yearly</div>
                      {PLAN_MAP.yearly.oldPrice ? (
                        <div className="text-xs text-muted-foreground line-through">
                          {PLAN_MAP.yearly.oldPrice}
                        </div>
                      ) : null}
                      <div className="text-lg font-semibold">{formatINR(PLAN_MAP.yearly.currentPrice)} INR</div>
                    </div>
                  </_CardContent>
                </_Card>
              </button>
            </div>
          </div>

          {/* Features */}
          <div>
            <_CardHeader className="pb-3">
              <_CardTitle className="text-base">You will get</_CardTitle>
            </_CardHeader>
            <_CardContent className=" pb-6">
              <div className="rounded-lg bg-muted px-4 py-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-[#0222D7]" />
                    <span>Basic Analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-[#0222D7]" />
                    <span>Standard Profile Listing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-[#0222D7]" />
                    <span>Advance analysis</span>
                  </li>
                </ul>
              </div>
            </_CardContent>
          </div>
        </section>

        {/* Right column: Summary */}
        <aside className="sm:pt-7">
          <_Card className="bg-muted/30">
            <_CardHeader className="px-6">
              <_CardTitle className="text-base">Amount summary</_CardTitle>
            </_CardHeader>
            <_CardContent className="space-y-4 px-6 pb-6">
              {/* Line items */}
              <div className="space-y-2 text-sm">
                <div className="flex itms-center justify-between">
                  <div>Total Courses
                    <div className="text-muted-foreground text-xs">
                      (Total number of courses)
                    </div>
                  </div>
                  <div>{totalInactiveCourses} Courses </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    Too Clarity
                    <div className="text-muted-foreground text-xs">
                      ({plan.title} Listing Fee)
                    </div>
                  </div>
                  <div>{formatINR(baseAmount)} INR</div>
                </div>

                {/* Backend discount only (from coupon) */}
                <div className="flex items-center justify-between">
                  <div>
                    Discount
                    <div className="text-muted-foreground text-xs">{appliedCoupon ? "Applied" : "No discount applied"}</div>
                  </div>
                  <div className={(couponDiscount > 0 ? "text-green-600" : "text-muted-foreground")}>
                    {couponDiscount > 0 ? "- " : ""}
                    {formatINR(couponDiscount)} INR
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Apply coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="rounded-xl"
                  disabled={isApplyingCoupon}
                />
                <Button variant="secondary" onClick={applyCoupon} className="rounded-xl" disabled={isApplyingCoupon}>
                  {isApplyingCoupon ? "Applying..." : "Apply"}
                </Button>
              </div>

              {/* Coupon message */}
              {couponMessage && (
                <div className="text-xs">
                  <span className="text-muted-foreground">{couponMessage}</span>
                </div>
              )}

              {/* Payable amount */}
              <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-3 text-sm">
                <div className="font-medium">Payable Amount</div>
                <div className="font-semibold">{formatINR(_payable)} INR</div>
              </div>

              {/* Note */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4" />
                <p>Please note: All payments are final and non-refundable.</p>
              </div>

              {/* CTA */}
              <Button variant="course" className="w-full h-11" onClick={handleConfirmPay} disabled={isPaying}>
                {isPaying ? "Processing..." : "Confirm and pay"}
              </Button>

              {/* Secured by */}
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <span>Secured by</span>
                <span className="font-semibold">Razorpay</span>
              </div>
            </_CardContent>
          </_Card>
        </aside>
      </div>
    </main>
  );
}