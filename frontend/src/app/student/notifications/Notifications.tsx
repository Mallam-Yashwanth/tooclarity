"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart } from "lucide-react";

import {
  useNotifications,
  useNotificationActions,
} from "@/lib/hooks/notifications-hooks";
import { studentDashboardAPI } from "@/lib/students-api";
import router from "next/router";

export default function StudentNotificationsPage() {
  const router = useRouter();
  const notificationsQuery = useNotifications();
  const { markRead } = useNotificationActions();

  const notifications = notificationsQuery.data ?? [];

  const [profile, setProfile] = useState<{
    name: string;
    profilePicture?: string;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentDashboardAPI.getProfile();
        if (res.success && res.data) {
          setProfile({
            name: res.data.name,
            profilePicture: res.data.profilePicture,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchProfile();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  useEffect(() => {
    if (!notifications.length) return;

    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n.id);

    if (unreadIds.length > 0) {
      markRead.mutate(unreadIds);
    }
  }, [notifications.length]);

 
  const { today, previous } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const today: typeof notifications = [];
    const previous: typeof notifications = [];

    notifications.forEach((n) => {
      if (n.time >= startOfToday.getTime()) today.push(n);
      else previous.push(n);
    });

    return { today, previous };
  }, [notifications]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between bg-[#0222d7] px-8 py-6">
        <div
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-white cursor-pointer"
        >
          <img
            src="/TCNewLogo.jpg"
            alt="TooClarity Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-3xl font-bold font-maven">
            TooClarity
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/student/wishlist")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
            aria-label="Open wishlist"
          >
            <Heart className="h-5 w-5 text-[#0222d7]" />
          </button>

          <button
            onClick={() => router.push("/student/profile")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white overflow-hidden"
            aria-label="Open profile"
          >
            {profile?.profilePicture ? (
              <Image
                src={profile.profilePicture}
                alt={profile.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-[#0222d7]">
                {profile?.name ? getInitials(profile.name) : ""}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {notificationsQuery.isLoading ? (
          <div className="text-center text-sm text-gray-500 mt-20">
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <EmptyStateCard onBack={() => router.push("/dashboard")}/>
        ) : (
          <div className="flex flex-col gap-6">
            {today.length > 0 && (
              <Section title="Today">
                {today.map((n) => (
                  <NotificationItem key={n.id} n={n} />
                ))}
              </Section>
            )}

            {previous.length > 0 && (
              <Section title="Previous">
                {previous.map((n) => (
                  <NotificationItem key={n.id} n={n} />
                ))}
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-2">
        {title}
      </h4>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function NotificationItem({ n }: { n: any }) {
  const time = new Date(n.time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#EEF1FF]">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[#0222D7]" />

      <div className="p-4 pl-6">
        <div className="flex items-start justify-between gap-3">
          <h5 className="text-sm font-semibold text-gray-900">
            {n.title}
          </h5>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {time}
          </span>
        </div>

        {n.description && (
          <p className="mt-1 text-sm text-gray-600 leading-snug">
            {n.description}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyStateCard({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-10 text-center border shadow-sm">
        <div className="mx-auto mb-6 flex justify-center items-center">
          <img
            src="/NotificationEmptyState.png"
            className="h-40 w-40 object-contain"
            alt="No notifications"
          />
        </div>

        <h3 className="mb-2 text-2xl font-semibold">
          No Notifications Yet
        </h3>
        <p className="mx-auto mb-6 max-w-md text-gray-600">
          You don’t have any notification at the moment, check back later.
        </p>

        <button onClick={onBack} className="rounded-full bg-[#0222d7] px-11 py-1 text-white font-medium hover:bg-blue-700 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
