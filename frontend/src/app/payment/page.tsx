"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Info } from "lucide-react";

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

type PlanKey = "monthly" | "yearly";

type Plan = {
  key: PlanKey;
  title: string;
  oldPrice?: string; // for strike-through
  currentPrice: number; // base amount before coupon
  discount: number; // built-in promotional discount (e.g., first 2 months free)
  badge?: string;
  subtitle?: string;
};

const PLAN_MAP: Record<PlanKey, Plan> = {
  monthly: {
    key: "monthly",
    title: "Monthly",
    currentPrice: 199,
    discount: 0,
    subtitle: "Billed monthly",
  },
  yearly: {
    key: "yearly",
    title: "Yearly",
    oldPrice: "1,999 INR",
    currentPrice: 1188,
    // Using 189 so payable shows 999 (as in the mock). Adjust if you want strict math with your backend.
    discount: 189,
    badge: "Best Value",
  },
};

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("yearly");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const plan = PLAN_MAP[selectedPlan];

  // If you want coupon to affect price, change couponDiscount below.
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return 0; // placeholder for real logic/API
  }, [appliedCoupon]);

  const baseAmount = plan.currentPrice;
  const promoDiscount = plan.discount;
  const subtotal = Math.max(baseAmount - promoDiscount, 0);
  const payable = Math.max(subtotal - couponDiscount, 0);

  function applyCoupon() {
    if (!coupon.trim()) return;
    setAppliedCoupon(coupon.trim());
  }

  function handleConfirmPay() {
    console.log("Proceed to payment:", {
      plan: selectedPlan,
      baseAmount,
      promoDiscount,
      coupon: appliedCoupon,
      couponDiscount,
      payable,
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Choose Your Plan</h1>
        <p className="text-sm text-muted-foreground">
          Select the plan that best fits your institution's growth goals.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left column: Plan selection + features */}
        <section className="space-y-6">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Select the plan that's right for you
            </p>

            {/* Plans */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Monthly */}
              <button
                type="button"
                onClick={() => setSelectedPlan("monthly")}
                className={`text-left rounded-xl transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedPlan === "monthly" ? "ring-2 ring-[#0222D7] shadow" : ""
                }`}
                aria-pressed={selectedPlan === "monthly"}
              >
                <Card className="m-0">
                  <CardContent className="px-6">
                    <div className="flex h-[150px] flex-col items-center justify-center gap-1 text-center">
                      <div className="text-base font-medium">Monthly</div>
                      {PLAN_MAP.monthly.subtitle ? (
                        <div className="text-xs text-muted-foreground">
                          {PLAN_MAP.monthly.subtitle}
                        </div>
                      ) : null}
                      <div className="text-lg font-semibold">{formatINR(PLAN_MAP.monthly.currentPrice)} INR</div>
                    </div>
                  </CardContent>
                </Card>
              </button>

              {/* Yearly */}
              <button
                type="button"
                onClick={() => setSelectedPlan("yearly")}
                className={`text-left rounded-xl transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedPlan === "yearly" ? "ring-2 ring-[#0222D7] shadow" : ""
                }`}
                aria-pressed={selectedPlan === "yearly"}
              >
                <Card className="m-0">
                  <CardContent className="px-6">
                    <div className="relative flex h-[150px] flex-col items-center justify-center gap-1 text-center">
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
                  </CardContent>
                </Card>
              </button>
            </div>
          </div>

          {/* Features */}
          <Card>
            <CardHeader className="px-6">
              <CardTitle className="text-base">You will get</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-4 text-[#0222D7]" />
                  <span>Basic Analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-4 text-[#0222D7]" />
                  <span>Standard Profile Listing</span>
                </li>
                <li className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-4 text-[#0222D7]" />
                  <span>Advanced analysis</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Right column: Summary */}
        <aside>
          <Card className="bg-muted/30">
            <CardHeader className="px-6">
              <CardTitle className="text-base">Amount summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              {/* Line items */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    Too Clarity
                    <div className="text-muted-foreground text-xs">
                      ({plan.title} Listing Fee)
                    </div>
                  </div>
                  <div>{formatINR(baseAmount)} INR</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    Discount
                    <div className="text-muted-foreground text-xs">
                      {plan.key === "yearly"
                        ? "(First 2 months listing free)"
                        : "(No promotional discount)"}
                    </div>
                  </div>
                  <div className={promoDiscount > 0 ? "text-green-600" : "text-muted-foreground"}>
                    {promoDiscount > 0 ? "- " : ""}
                    {formatINR(promoDiscount)} INR
                  </div>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <div>
                      Coupon
                      <div className="text-muted-foreground text-xs">Applied</div>
                    </div>
                    <div className="text-green-600">- {formatINR(couponDiscount)} INR</div>
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Apply coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <Button variant="outline" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>

              {/* Payable amount */}
              <div className="flex items-center justify-between rounded-md bg-background px-3 py-3 text-sm">
                <div className="font-medium">Payable Amount</div>
                <div className="font-semibold">{formatINR(payable)} INR</div>
              </div>

              {/* Note */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4" />
                <p>Please note: All payments are final and non-refundable.</p>
              </div>

              {/* CTA */}
              <Button variant="course" className="w-full h-11" onClick={handleConfirmPay}>
                Confirm and pay
              </Button>

              {/* Secured by */}
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <span>Secured by</span>
                <span className="font-semibold">Razorpay</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

    </main>
  );
}