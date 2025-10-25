import { useEffect } from 'react';
import * as RR from 'react-router-dom';

/**
 * LeaveGuard
 * - Shows native "Leave site?" dialog on hard unloads (close/refresh) when `when` is true
 * - Blocks in-app route transitions via react-router blocker API when available
 */
export default function LeaveGuard({
  when,
  message = 'Your timer is running or paused. If you leave now, your current time may be lost. Leave anyway?'
}) {
  // Block in-app navigations (react-router)
  const useBlock = RR.useBlocker ?? RR.unstable_useBlocker;
  const blocker = typeof useBlock === 'function' && when ? useBlock(true) : null;

  useEffect(() => {
    if (!blocker || blocker.state !== 'blocked') return;
    const ok = window.confirm(message);
    if (ok) blocker.proceed();
    else blocker.reset();
  }, [blocker, message]);

  // Warn on tab close / refresh
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [when]);

  return null;
}
