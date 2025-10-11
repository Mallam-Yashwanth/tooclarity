"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { faCheckDouble, faTrash, faInbox, faEnvelopeOpenText, faFilter, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useNotifications, useNotificationActions, type NotificationItem } from "@/lib/hooks/notifications-hooks";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(ts);
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState("");

  const { data: items = [], isLoading } = useNotifications();
  const { markRead, remove } = useNotificationActions();

  const unreadCount = React.useMemo(() => items.filter(i => !i.read).length, [items]);

  const filtered = React.useMemo(() => {
    let list = items;
    if (filter === "unread") list = list.filter(i => !i.read);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, query]);

  const isAllSelected = filtered.length > 0 && filtered.every(i => selectedIds.has(i.id));
  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllSelected) {
      filtered.forEach(i => next.delete(i.id));
    } else {
      filtered.forEach(i => next.add(i.id));
    }
    setSelectedIds(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const markAllRead = async () => {
    const ids = items.filter(i => !i.read).map(i => i.id);
    await markRead.mutateAsync(ids);
  };

  const markReadOne = async (id: string) => {
    await markRead.mutateAsync([id]);
  };


  const removeIds = async (ids: string[]) => {
    await remove.mutateAsync(ids);
    const sel = new Set(selectedIds);
    ids.forEach(id => sel.delete(id));
    setSelectedIds(sel);
  };

  const clearAll = async () => {
    await removeIds(items.map(i => i.id));
  };

  const onItemClick = async (id: string) => {
    await markReadOne(id);
  };

  const goBack = () => {
    try {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error('Notifications: navigation fallback error', err);
      router.push("/");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-800 dark:text-gray-200"
          aria-label="Go back"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span className="hidden xs:inline">Back</span>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <FontAwesomeIcon icon={faBell} className="text-blue-600 text-base sm:text-lg" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg text-sm border ${filter === "all" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-sm border ${filter === "unread" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"}`}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search notifications"
              className="pl-9 pr-3 py-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="px-3 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              title="Mark all as read"
            >
              <FontAwesomeIcon icon={faCheckDouble} />
              <span className="hidden xs:inline">Mark all read</span>
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 rounded-xl text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-2"
              title="Clear all"
            >
              <FontAwesomeIcon icon={faTrash} />
              <span className="hidden xs:inline">Clear all</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-blue-50 dark:bg-gray-800 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>{selectedIds.size} selected</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={() => markRead.mutate(Array.from(selectedIds))}>Mark read</button>
            <button className="px-2 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => removeIds(Array.from(selectedIds))}>Delete</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <input type="checkbox" aria-label="Select all" checked={isAllSelected} onChange={toggleSelectAll} />
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Inbox</div>
          <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FontAwesomeIcon icon={faInbox} /> {filtered.length} items</div>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading && (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</li>
          )}
          {!isLoading && filtered.length === 0 && (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">No notifications</li>
          )}
          {!isLoading && filtered.map((n) => (
            <li key={n.id} className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.read ? "bg-indigo-50/40 dark:bg-transparent" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <input type="checkbox" checked={selectedIds.has(n.id)} onChange={() => toggleSelect(n.id)} className="mt-1" aria-label={`Select ${n.title}`} />
                  <button onClick={() => onItemClick(n.id)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {!n.read ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                          <FontAwesomeIcon icon={faEnvelopeOpenText} className="opacity-70" /> Unread
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                          <FontAwesomeIcon icon={faEnvelopeOpenText} className="opacity-60" /> Read
                        </span>
                      )}
                      {n.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{n.category}</span>
                      )}
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{timeAgo(n.time)}</span>
                    </div>
                    <div className={`mt-1 text-sm font-medium ${!n.read ? "text-gray-900 dark:text-gray-100" : "text-gray-800 dark:text-gray-200"}`}>{n.title}</div>
                    {n.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{n.description}</div>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <button className="text-xs px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={() => markReadOne(n.id)}>Mark read</button>
                  )}
                  <button className="text-xs px-2 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => removeIds([n.id])}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 