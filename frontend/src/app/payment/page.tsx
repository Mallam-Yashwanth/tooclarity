"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import PaymentCheckout from "@/components/payment/PaymentCheckout";
import PaymentSuccess from "@/components/payment/PaymentSuccess";
import PaymentProcessing from "@/components/payment/PaymentProcessing";
import PaymentFailed from "@/components/payment/PaymentFailed";
import { useAuth } from "@/lib/auth-context";
import { useInstitution } from "@/lib/hooks/dashboard-hooks";

export default function PaymentPage() {

  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: institution } = useInstitution();

  // ✅ Hooks must always run before any return
  const [processing, setProcessing] = React.useState<{
    paymentId?: string | null;
    orderId?: string | null;
  } | null>(null);

  const [success, setSuccess] = React.useState<{
    transactionId?: string | null;
    paymentId?: string | null;
    orderId?: string | null;
  } | null>(null);

  const [failed, setFailed] = React.useState<{
    paymentId?: string | null;
    orderId?: string | null;
  } | null>(null);

  // ✅ Determine if user is allowed
  const isAllowed = React.useMemo(() => {
    if (!user) return false;
    return (
      user.role === "INSTITUTE_ADMIN" &&
      user.isPaymentDone === false &&
      user.isProfileCompleted === true
    );
  }, [user]);

  // ✅ Redirect if not allowed
  React.useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !isAllowed) {
      router.replace("/institute");
    }
  }, [loading, isAuthenticated, isAllowed, router]);


  const phoneDisplay = "+91 9391160205";
  const phoneHref = "+919391160205";

  const clearStatuses = () => {
    setProcessing(null);
    setSuccess(null);
    setFailed(null);
  };

  // ✅ Loader stays after hooks
  if (loading || !isAuthenticated || !isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Thin purple top border like in the screenshot */}
      <div className="h-1 w-full" />

      {/* Header (responsive) */}
      <header className="mx-auto w-full max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/Too Clarity.png"
              alt="Too Clarity"
              width={140}
              height={32}
              priority
            />
          </div>

          {/* Desktop help */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Link
              href={`tel:${phoneHref}`}
              className="font-medium text-[#0222D7] underline-offset-2 hover:underline"
            >
              Need help? Call {phoneDisplay}
            </Link>
            <Link
              href={`https://wa.me/${phoneHref}`}
              target="_blank"
              aria-label="WhatsApp"
              className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile help (icon only) */}
          <div className="md:hidden">
            <Link
              href={`https://wa.me/${phoneHref}`}
              target="_blank"
              aria-label="WhatsApp"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Mobile help text under header */}
        <div className="mt-2 md:hidden text-xs">
          <Link
            href={`tel:${phoneHref}`}
            className="font-medium text-[#0222D7] underline-offset-2 hover:underline"
          >
            Need help? Call {phoneDisplay}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl">
        {/* Render status UIs in page */}
        {success ? (
          <PaymentSuccess
            transactionId={success.transactionId ?? null}
            paymentId={success.paymentId ?? null}
            orderId={success.orderId ?? null}
          />
        ) : processing ? (
          <PaymentProcessing
            paymentId={processing.paymentId ?? null}
            orderId={processing.orderId ?? null}
          />
        ) : failed ? (
          <PaymentFailed
            paymentId={failed.paymentId ?? null}
            orderId={failed.orderId ?? null}
            onRetry={() => setFailed(null)}
          />
        ) : (
          <PaymentCheckout
            institutionType={institution?.institutionType}
            onProcessing={(d) => {
              clearStatuses();
              setProcessing(d);
            }}
            onSuccess={(d) => {
              clearStatuses();
              setSuccess(d);
            }}
            onFailure={(d) => {
              clearStatuses();
              setFailed(d);
            }}
          />
        )}
      </main>
    </div>
  );
}
