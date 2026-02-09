"use client";

import { useEffect, useMemo } from "react";
import { useNotifications, useNotificationActions } from "@/lib/hooks/notifications-hooks";

interface NotificationPaneProps {
  onClose: () => void;
}

export default function NotificationPane({ onClose }: NotificationPaneProps) {
  const notificationsQuery = useNotifications();
  const { markRead } = useNotificationActions();

  const notifications = notificationsQuery.data ?? [];
  
  /*checked for empty
  const notifications = [];
  */

  /* making allL unread notifications as read when the pane opens*/
  useEffect(() => {
    if (!notifications.length) return;

    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);

    if (unreadIds.length > 0) {
      markRead.mutate(unreadIds);
    }
  }, [notifications.length]);

/* checking if notifications are fetched. once panel is opening and backend is marking it read

  useEffect(() => {
  console.log("Notifications on open:", notifications);
}, [notifications]); */



  /*grouping:as today and previous*/
  const { today, previous } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const today: typeof notifications = [];
    const previous: typeof notifications = [];

    notifications.forEach(n => {
      if (n.time >= startOfToday.getTime()) {
        today.push(n);
      } else {
        previous.push(n);
      }
    });

    return { today, previous };
  }, [notifications]);

  return (
    <aside className="fixed top-0 right-0 h-screen w-full max-w-[360px] bg-white shadow-[-8px_0_20px_rgba(0,0,0,0.1)] z-[60] flex flex-col">
      
      {/*notification-pane header*/}
      <header className="bg-[#0222D7] px-6 py-7 flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">
          Notifications
        </h2>
        <button
          onClick={onClose}
          className="text-white text-2xl leading-none hover:opacity-80"
          aria-label="Close notifications"
        >
          ×
        </button>
      </header>

      {/*below body*/}
      <div className="flex-1 overflow-y-auto p-4">
        {notificationsQuery.isLoading ? (
          <div className="text-center text-sm text-gray-500 mt-10">
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {today.length > 0 && (
              <Section title="Today">
                {today.map(n => (
                  <NotificationItem key={n.id} n={n} />
                ))}
              </Section>
            )}

            {previous.length > 0 && (
              <Section title="Previous">
                {previous.map(n => (
                  <NotificationItem key={n.id} n={n} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

/* subcomponents*/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-2">
        {title}
      </h4>
      <div className="flex flex-col gap-3">
        {children}
      </div>
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
      
      {/*blue strip*/}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[#0222D7]" />

      {/*card notification */}
      <div className="p-4 pl-6">
        {/*title and time */}
        <div className="flex items-start justify-between gap-3">
          <h5 className="text-sm font-semibold text-gray-900">
            {n.title}
          </h5>

          <span className="text-xs text-gray-500 whitespace-nowrap">
            {time}
          </span>
        </div>

        {/*description */}
        {n.description && (
          <p className="mt-1 text-sm text-gray-600 leading-snug">
            {n.description}
          </p>
        )}
      </div>
    </div>
  );
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-20 px-6">
      <img
        src="/NotificationEmptyState.png"
        className="w-40 h-40 object-contain"
      />
      <h3 className="mt-6 text-lg font-semibold text-gray-800">
        No Notifications Yet
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        You don’t have any notification at the moment, check back later.
      </p>
    </div>
  );
}
