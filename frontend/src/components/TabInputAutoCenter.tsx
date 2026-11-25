'use client';

import { useEffect } from 'react';

const TEXT_INPUT_TYPES = new Set([
  '',
  'text',
  'search',
  'email',
  'password',
  'url',
  'tel',
  'number',
]);

function isCenterableInput(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('header')) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    const type = (target.getAttribute('type') || 'text').toLowerCase();
    return TEXT_INPUT_TYPES.has(type);
  }
  return false;
}

export default function TabInputAutoCenter() {
  useEffect(() => {
    let tabTriggeredAt = 0;
    let rafId = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        tabTriggeredAt = performance.now();
      }
    };

    const handlePointerDown = () => {
      tabTriggeredAt = 0;
    };

    const handleFocusIn = (e: FocusEvent) => {
      const elapsed = performance.now() - tabTriggeredAt;
      tabTriggeredAt = 0;
      if (elapsed > 300) return;
      if (!isCenterableInput(e.target)) return;

      const target = e.target;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (document.activeElement !== target) return;
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, []);

  return null;
}
