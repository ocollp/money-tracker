import { useRef, useCallback, useEffect, useState } from 'react';
import { suppressPointerClicksFor } from '../lib/touchGestureGuard.js';

const RELEASE_PULL_PX = 38;
const MAX_PULL = 100;

function scrollTop() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function usePullToRefresh({ onRefresh, disabled, loading }) {
  const [pullPx, setPullPx] = useState(0);
  const startY = useRef(null);
  const active = useRef(false);
  const movedRef = useRef(false);
  const pullPxRef = useRef(0);
  const pendingPullRef = useRef(0);
  const rafRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const schedulePullUpdate = useCallback((next) => {
    pendingPullRef.current = next;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setPullPx(pendingPullRef.current);
    });
  }, []);

  const endPull = useCallback(() => {
    startY.current = null;
    active.current = false;
    movedRef.current = false;
    pullPxRef.current = 0;
    pendingPullRef.current = 0;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPullPx(0);
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      if (disabled || loading) return;
      if (scrollTop() > 8) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
      movedRef.current = false;
    },
    [disabled, loading],
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!active.current || startY.current == null) return;
      if (scrollTop() > 8) {
        endPull();
        return;
      }
      const y = e.touches[0].clientY;
      const dy = y - startY.current;
      if (Math.abs(dy) > 8) {
        movedRef.current = true;
        suppressPointerClicksFor(450);
      }
      if (dy > 0) {
        e.preventDefault();
        const next = Math.min(dy * 0.45, MAX_PULL);
        pullPxRef.current = next;
        schedulePullUpdate(next);
      } else {
        pullPxRef.current = 0;
        schedulePullUpdate(0);
      }
    },
    [endPull, schedulePullUpdate],
  );

  const onTouchEnd = useCallback(() => {
    if (!active.current) return;
    const px = pullPxRef.current;
    active.current = false;
    startY.current = null;
    pullPxRef.current = 0;
    pendingPullRef.current = 0;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPullPx(0);
    if (movedRef.current || px >= 4) {
      suppressPointerClicksFor(450);
    }
    if (px >= RELEASE_PULL_PX && !loading && !disabled) {
      onRefreshRef.current?.();
    }
  }, [loading, disabled]);

  useEffect(() => {
    if (disabled) return;
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [disabled, onTouchStart, onTouchMove, onTouchEnd]);

  useEffect(() => {
    if (loading) endPull();
  }, [loading, endPull]);

  const progress = Math.min(pullPx / RELEASE_PULL_PX, 1);

  return { pullPx, progress, isPulling: pullPx > 4 };
}
