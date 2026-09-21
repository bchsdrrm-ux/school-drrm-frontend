import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient';

const SEVERITY_DOT = { critical: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500' };
// Unread rows get a light tint of their OWN severity color (not one
// generic "new" color for everything) — so at a glance, an unread
// critical item is visually the most urgent-looking thing in the list,
// not just "has a blue background like everything else unread."
const SEVERITY_BG_UNREAD = { critical: 'bg-red-50 hover:bg-red-100', warning: 'bg-yellow-50 hover:bg-yellow-100', info: 'bg-blue-50 hover:bg-blue-100' };

/**
 * Polls every 60s (less urgent than Emergency Mode's 20s poll — these are
 * reminders, not an active-emergency alert) and re-checks on navigation so
 * a genuinely-resolved item (e.g. a renewed document) drops off the list
 * promptly.
 *
 * This is READ/UNREAD tracking, not hide-on-click. A notification's
 * content stays fully visible in the list even after it's marked read —
 * a critical alert (expired equipment, an overdue corrective action)
 * needs the underlying record actually fixed, not just an acknowledgment
 * click, and hiding it the moment someone glances at the bell would risk
 * a real problem getting forgotten. Marking read only removes it from the
 * badge COUNT; it never removes it from the list. The item disappears
 * from the list entirely only once the real situation is resolved (the
 * backend simply stops computing it), same as before any of this
 * read-tracking existed.
 *
 * Visual design: unread rows get a light background tint in their OWN
 * severity color (light red for critical, yellow for warning, blue for
 * info) — similar to how Facebook highlights unread notifications, but
 * using the notification's actual severity instead of one flat "new"
 * color, so what's most urgent is visually obvious at a glance, not just
 * what's newest. Read rows go back to plain white. The colored dot and
 * text weight/color are otherwise identical whether read or not — nothing
 * ever goes gray or desaturated, since that would undercut being able to
 * tell what kind of issue it is after reading it.
 */
export default function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [busyKey, setBusyKey] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const load = () => {
    api.get('/notifications').then(setItems).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Badge counts only UNREAD critical/warning items — "info" items like
  // upcoming drills were never counted here either way, and a read item
  // (even a critical one whose underlying record still isn't fixed)
  // no longer inflates the number, since the point of the badge is
  // "things you haven't looked at yet," not "things currently wrong."
  const urgentUnreadCount = items.filter((i) => i.severity !== 'info' && !i.read).length;

  const setLocalReadState = (key, read) => {
    setItems((prev) => prev.map((i) => (i.id === key ? { ...i, read } : i)));
  };

  const markRead = async (key) => {
    setBusyKey(key);
    setLocalReadState(key, true); // optimistic — feels instant, load() will reconcile on the next poll regardless
    try {
      await api.post('/notifications/mark-read', { key });
    } catch {
      setLocalReadState(key, false); // revert on failure
    } finally {
      setBusyKey(null);
    }
  };

  const markUnread = async (key) => {
    setBusyKey(key);
    setLocalReadState(key, false);
    try {
      await api.post('/notifications/mark-unread', { key });
    } catch {
      setLocalReadState(key, true);
    } finally {
      setBusyKey(null);
    }
  };

  const handleItemClick = (item) => {
    setIsOpen(false);
    if (!item.read) markRead(item.id);
    navigate(item.link);
  };

  const handleToggleClick = (e, item) => {
    e.stopPropagation(); // don't trigger the row's own click (which would navigate)
    if (item.read) markUnread(item.id);
    else markRead(item.id);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        aria-label="Notifications"
      >
        🔔
        {urgentUnreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {urgentUnreadCount > 9 ? '9+' : urgentUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20">
          <div className="px-4 py-2.5 border-b border-slate-200 text-sm font-semibold text-slate-800">Notifications</div>
          {!items.length ? (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">Nothing needs your attention.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id}>
                  <div className={`relative ${item.read ? '' : SEVERITY_BG_UNREAD[item.severity]}`}>
                    <button
                      onClick={() => handleItemClick(item)}
                      disabled={busyKey === item.id}
                      className={`w-full text-left px-4 py-2.5 pr-9 flex items-start gap-2 disabled:opacity-50 ${item.read ? 'hover:bg-slate-50' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[item.severity]}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-400">{item.category}</div>
                        <div className={`text-sm truncate text-slate-800 ${item.read ? '' : 'font-semibold'}`}>{item.title}</div>
                        <div className="text-xs text-slate-500">{item.detail}</div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleToggleClick(e, item)}
                      disabled={busyKey === item.id}
                      aria-label={item.read ? 'Mark as unread' : 'Mark as read'}
                      title={item.read ? 'Mark as unread' : 'Mark as read'}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-700 text-xs leading-none px-1.5 py-1 rounded disabled:opacity-50"
                    >
                      {item.read ? '↺' : '✓'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
