import React from 'react';
import Icon from './icons';
import { usePushAlerts } from '../lib/push';
import { useInstallPrompt } from '../lib/install';

// "Get alerts on this phone" card for the public information page.
export default function AlertsCard() {
  const { status, error, enable, disable } = usePushAlerts();
  const { showIosHint } = useInstallPrompt();

  // Not switched on by the school, or still checking: show nothing rather than flicker.
  if (status === 'checking' || status === 'unavailable') return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-surface p-5 print:hidden" aria-labelledby="alerts-heading">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon name="incident" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="alerts-heading" className="text-sm font-semibold text-slate-900">Emergency alerts on this phone</h2>

          {(status === 'available' || status === 'busy') && (
            <>
              <p className="mt-1 text-sm text-slate-600">
                Get a notification when the school starts an emergency and when it is all clear. No sign-up: we don't collect your name or number.
              </p>
              <button
                onClick={enable}
                disabled={status === 'busy'}
                className="mt-3 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {status === 'busy' ? 'Turning on…' : 'Turn on alerts'}
              </button>
            </>
          )}

          {status === 'subscribed' && (
            <>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-green-800">
                <Icon name="check" className="h-4 w-4 text-green-600" /> Alerts are on for this device.
              </p>
              <button onClick={disable} className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">Turn off</button>
            </>
          )}

          {status === 'denied' && (
            <p className="mt-1 text-sm text-slate-600">
              Notifications are blocked for this site. To get alerts, allow notifications for this site in your browser or phone settings, then reload this page.
            </p>
          )}

          {status === 'unsupported' && (
            <p className="mt-1 text-sm text-slate-600">
              {showIosHint
                ? 'On iPhone and iPad, first add this page to your Home Screen (tap Share, then Add to Home Screen) and open it from there to turn on alerts.'
                : "This browser can't receive alerts. Try Chrome or Edge on Android or a computer, or keep this page bookmarked."}
            </p>
          )}

          {error && <p className="mt-2 text-sm text-risk-critical">{error}</p>}

          <p className="mt-3 text-xs text-slate-500">
            Alerts depend on your phone's signal and settings, so don't rely on them alone. Follow announcements at school and call 911 in danger.
          </p>
        </div>
      </div>
    </section>
  );
}
