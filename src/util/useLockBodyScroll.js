import { useEffect } from "react";

/** Bumps when a new lock starts so leftover iOS restore timers stop fighting. */
let restoreGeneration = 0;

export function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getScrollY() {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

export function setScrollY(y) {
  if (typeof window === "undefined") return;
  const top = Math.max(0, y);
  // iOS Safari needs all three — window.scrollTo alone is often ignored after keyboard close
  if (typeof window.scrollTo === "function") {
    try {
      window.scrollTo({ top, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, top);
    }
  }
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

/**
 * Wait until the soft keyboard is mostly closed (iOS visualViewport),
 * or fall back to a short timeout.
 */
export function waitForKeyboardClose(timeoutMs = 700) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const vv = window.visualViewport;
    if (!vv) {
      setTimeout(resolve, 320);
      return;
    }

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      vv.removeEventListener("resize", onResize);
      resolve();
    };

    const onResize = () => {
      // Keyboard closed when visual viewport is nearly the full layout height
      if (vv.height >= window.innerHeight - 48) done();
    };

    onResize();
    vv.addEventListener("resize", onResize);
    setTimeout(done, timeoutMs);
  });
}

/**
 * Lock background page scroll while a mobile modal/sheet is open.
 * Restores the exact scroll position on unlock (critical on iOS Safari
 * when the keyboard dismisses and would otherwise jump to the top).
 *
 * @param {boolean} locked
 * @param {{
 *   allowScrollRef?: { current: HTMLElement | null },
 *   lockScrollY?: number | null,
 * }} [options]
 *   lockScrollY — optional pre-tap scroll position (iOS often scrolls the
 *   field into view between touchstart and click; pass the touchstart Y).
 */
export function useLockBodyScroll(locked, options = {}) {
  const { allowScrollRef, lockScrollY = null } = options;

  useEffect(() => {
    if (!locked || typeof window === "undefined") return;

    restoreGeneration += 1;

    const scrollY =
      typeof lockScrollY === "number" && Number.isFinite(lockScrollY)
        ? lockScrollY
        : getScrollY();
    const { body, documentElement: html } = document;
    const ios = isIOSDevice();

    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyTouchAction: body.style.touchAction,
      bodyOverscroll: body.style.overscrollBehavior,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      htmlScrollBehavior: html.style.scrollBehavior,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.touchAction = "none";
    body.style.overscrollBehavior = "none";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    const onTouchMove = (event) => {
      const allowEl = allowScrollRef?.current;
      if (allowEl && event.target instanceof Node && allowEl.contains(event.target)) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", onTouchMove);

      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      body.style.height = previous.bodyHeight;
      body.style.touchAction = previous.bodyTouchAction;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      html.style.overflow = previous.htmlOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll;

      const gen = ++restoreGeneration;
      html.style.scrollBehavior = "auto";

      const restore = () => {
        if (gen !== restoreGeneration) return;
        setScrollY(scrollY);
      };

      restore();
      requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(restore);
      });

      // iOS keyboard/viewport settle is slow — keep forcing position for a short freeze window
      const delays = ios
        ? [0, 16, 50, 100, 180, 280, 400, 550, 700, 900]
        : [0, 50, 120, 250, 400];
      delays.forEach((ms) => setTimeout(restore, ms));

      const freezeMs = ios ? 950 : 450;
      const onScroll = () => restore();
      const onVv = () => restore();

      window.addEventListener("scroll", onScroll, { passive: true });
      window.visualViewport?.addEventListener("resize", onVv);
      window.visualViewport?.addEventListener("scroll", onVv);

      setTimeout(() => {
        if (gen !== restoreGeneration) return;
        window.removeEventListener("scroll", onScroll);
        window.visualViewport?.removeEventListener("resize", onVv);
        window.visualViewport?.removeEventListener("scroll", onVv);
        html.style.scrollBehavior = previous.htmlScrollBehavior;
      }, freezeMs);
    };
  }, [locked, allowScrollRef, lockScrollY]);
}
