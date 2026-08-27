# Future implementations

## Distinguish phones from narrow viewports

The current orientation guard uses `(orientation: portrait) and (max-width: 767px)`. As a result,
it can also activate for a small tablet or a narrow desktop window; the media query does not reliably
identify a phone.

A future behavior change may evaluate a more precise device policy using viewport capabilities,
pointer and hover characteristics, and real-device testing. It must not rely exclusively on
`userAgent`, which is brittle and can be absent or deliberately changed.

Any replacement must preserve these invariants:

- Portrait phones remain blocked until they rotate to horizontal.
- Phaser, audio and the countdown pause while the guard is visible.
- Returning to horizontal resumes the exact remaining time without rerolling losses.
- Tablets and desktop windows are not blocked accidentally unless the product policy explicitly
  changes.
- The fallback remains safe when device capabilities are unavailable or contradictory.

The implementation belongs in a future behavior PR, with Playwright coverage for phone horizontal,
phone portrait, small tablet and narrow desktop viewport scenarios. This document does not change
the current runtime policy.
