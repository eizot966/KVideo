/**
 * useGamepadNavigation Hook
 * Provides PS5 DualSense and standard gamepad navigation support for KVideo TV Mode.
 * Maps D-pad and left analog stick to arrow keys, Cross (X) to Enter, Circle (O) to Escape/Back,
 * Triangle to search focus, Square to play/pause, L1/R1 to quick skip.
 */

'use client';

import { useEffect, useRef } from 'react';

// Standard Gamepad Button indices (W3C Standard Gamepad Mapping):
// 0: A / Cross (✕)
// 1: B / Circle (○)
// 2: X / Square (□)
// 3: Y / Triangle (△)
// 4: L1 (Left Shoulder)
// 5: R1 (Right Shoulder)
// 8: Select / Share / Create
// 9: Start / Options
// 12: D-pad Up
// 13: D-pad Down
// 14: D-pad Left
// 15: D-pad Right

export function useGamepadNavigation(enabled: boolean) {
  const requestRef = useRef<number | null>(null);
  const lastStateRef = useRef<Record<string, boolean>>({});
  const lastAxisMoveRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('getGamepads' in navigator)) {
      return;
    }

    const triggerKey = (key: string, code: string, keyCode: number) => {
      const activeEl = document.activeElement as HTMLElement | null;

      // Special handling for Enter (Cross)
      if (key === 'Enter') {
        if (activeEl) {
          activeEl.click();
        }
        return;
      }

      // Special handling for Escape (Circle / Back)
      if (key === 'Escape') {
        // If an input is focused, blur it first
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          activeEl.blur();
          return;
        }
        // If modal or back button exists, trigger back
        const backBtn = document.querySelector<HTMLElement>('button[aria-label="返回"], button[title="返回"], a[title*="返回"]');
        if (backBtn) {
          backBtn.click();
          return;
        }
        window.history.back();
        return;
      }

      // Trigger standard keyboard event
      const event = new KeyboardEvent('keydown', {
        key,
        code,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      });
      (activeEl || document.body).dispatchEvent(event);
    };

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let gp: Gamepad | null = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i]!.connected) {
          gp = gamepads[i];
          break;
        }
      }

      if (gp) {
        const now = Date.now();
        const prev = lastStateRef.current;

        // Button helper
        const isPressed = (index: number) => {
          return gp && gp.buttons[index] ? gp.buttons[index].pressed : false;
        };

        // 1. Cross button (✕, Button 0) -> Enter / Click
        const btnCross = isPressed(0);
        if (btnCross && !prev['btnCross']) {
          triggerKey('Enter', 'Enter', 13);
        }
        prev['btnCross'] = btnCross;

        // 2. Circle button (○, Button 1) -> Escape / Back
        const btnCircle = isPressed(1);
        if (btnCircle && !prev['btnCircle']) {
          triggerKey('Escape', 'Escape', 27);
        }
        prev['btnCircle'] = btnCircle;

        // 3. Triangle button (△, Button 3) -> Focus Search Input
        const btnTriangle = isPressed(3);
        if (btnTriangle && !prev['btnTriangle']) {
          const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][data-focusable], input[type="search"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        prev['btnTriangle'] = btnTriangle;

        // 4. Square button (□, Button 2) -> Toggle Play/Pause on Video
        const btnSquare = isPressed(2);
        if (btnSquare && !prev['btnSquare']) {
          const video = document.querySelector('video');
          if (video) {
            if (video.paused) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          }
        }
        prev['btnSquare'] = btnSquare;

        // 5. L1 / R1 -> Seek -10s / +10s on active video
        const btnL1 = isPressed(4);
        if (btnL1 && !prev['btnL1']) {
          const video = document.querySelector('video');
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
        }
        prev['btnL1'] = btnL1;

        const btnR1 = isPressed(5);
        if (btnR1 && !prev['btnR1']) {
          const video = document.querySelector('video');
          if (video) video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
        }
        prev['btnR1'] = btnR1;

        // 6. D-pad & Left Stick Directional Navigation
        const dUp = isPressed(12);
        const dDown = isPressed(13);
        const dLeft = isPressed(14);
        const dRight = isPressed(15);

        // Analog stick thresholds
        const axisX = gp.axes.length > 0 ? gp.axes[0] : 0;
        const axisY = gp.axes.length > 1 ? gp.axes[1] : 0;
        const stickThreshold = 0.5;

        const up = dUp || axisY < -stickThreshold;
        const down = dDown || axisY > stickThreshold;
        const left = dLeft || axisX < -stickThreshold;
        const right = dRight || axisX > stickThreshold;

        // Debounce directional movement to ~200ms for smooth UI navigation
        if (now - lastAxisMoveRef.current > 200) {
          if (up && (!prev['up'] || now - lastAxisMoveRef.current > 250)) {
            triggerKey('ArrowUp', 'ArrowUp', 38);
            lastAxisMoveRef.current = now;
          } else if (down && (!prev['down'] || now - lastAxisMoveRef.current > 250)) {
            triggerKey('ArrowDown', 'ArrowDown', 40);
            lastAxisMoveRef.current = now;
          } else if (left && (!prev['left'] || now - lastAxisMoveRef.current > 250)) {
            triggerKey('ArrowLeft', 'ArrowLeft', 37);
            lastAxisMoveRef.current = now;
          } else if (right && (!prev['right'] || now - lastAxisMoveRef.current > 250)) {
            triggerKey('ArrowRight', 'ArrowRight', 39);
            lastAxisMoveRef.current = now;
          }
        }

        prev['up'] = up;
        prev['down'] = down;
        prev['left'] = left;
        prev['right'] = right;
      }

      requestRef.current = requestAnimationFrame(pollGamepad);
    };

    requestRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled]);
}
