'use client';

import { useEffect } from 'react';

const isDevToolsShortcut = (event) => {
    const key = String(event.key || '').toLowerCase();
    const code = String(event.code || '').toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;

    if (key === 'f12' || code === 'f12') return true;

    // Ctrl/Cmd + Shift + I / J / C / K
    if (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) return true;

    // Ctrl/Cmd + U (view source)
    if (ctrlOrMeta && key === 'u') return true;

    // Ctrl/Cmd + S (save page)
    if (ctrlOrMeta && key === 's') return true;

    // Mac: Cmd + Option + I / J / C
    if (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) return true;

    return false;
};

const RESTRICT_HTML =
    '<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0f172a;color:#fff;"><div style="text-align:center;padding:24px;"><h1 style="margin:0 0 8px;font-size:22px;">Access restricted</h1><p style="margin:0;opacity:.8;">Developer tools are not allowed on this site.</p></div></body>';

/**
 * Detect docked Inspect/DevTools only.
 * - Ignores zoom in/out (both gaps grow together)
 * - Ignores normal browser chrome
 * - Ignores first-paint when outer size is not ready (0)
 */
const isDockedDevToolsOpen = () => {
    const { outerWidth, outerHeight, innerWidth, innerHeight } = window;

    // First load / minimized / not ready — never treat as DevTools
    if (
        !outerWidth ||
        !outerHeight ||
        !innerWidth ||
        !innerHeight ||
        outerWidth < 100 ||
        outerHeight < 100
    ) {
        return false;
    }

    const widthGap = Math.abs(outerWidth - innerWidth);
    const heightGap = Math.abs(outerHeight - innerHeight);
    const maxGap = Math.max(widthGap, heightGap);
    const minGap = Math.min(widthGap, heightGap);

    // Normal chrome / scrollbar
    if (maxGap < 320) return false;

    // Zoom in/out: both gaps grow and stay relatively close → allow
    if (minGap > 100 && maxGap / minGap < 2.5) return false;

    // One-sided large gap = docked DevTools (side or bottom)
    return maxGap / Math.max(minGap, 1) >= 2.5;
};

export default function DisableInspect() {
    useEffect(() => {
        let locked = false;
        let hits = 0;
        let started = false;

        const blockEvent = (event) => {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };

        const lockPage = () => {
            if (locked) return;
            locked = true;
            document.documentElement.innerHTML = RESTRICT_HTML;
        };

        const onKeyDown = (event) => {
            if (isDevToolsShortcut(event)) {
                blockEvent(event);
            }
        };

        const onContextMenu = (event) => blockEvent(event);

        const checkDevTools = () => {
            if (locked || !started) return;

            if (!isDockedDevToolsOpen()) {
                hits = 0;
                return;
            }

            // Need a few stable positives so zoom/resize flicker never locks
            hits += 1;
            if (hits >= 3) {
                lockPage();
            }
        };

        document.addEventListener('contextmenu', onContextMenu, true);
        document.addEventListener('keydown', onKeyDown, true);

        // Wait until window metrics are stable — avoids first-load false restrict
        const startTimer = window.setTimeout(() => {
            started = true;
            checkDevTools();
        }, 1500);

        const intervalId = window.setInterval(checkDevTools, 1000);

        return () => {
            document.removeEventListener('contextmenu', onContextMenu, true);
            document.removeEventListener('keydown', onKeyDown, true);
            window.clearTimeout(startTimer);
            window.clearInterval(intervalId);
        };
    }, []);

    return null;
}
