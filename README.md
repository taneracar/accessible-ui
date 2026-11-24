# accessible-ui

Eight React 19 components built accessibility-first, with no runtime dependencies: **Button, TextField, Switch, Tabs, Dialog, Menu, Combobox, Toast**. Light, dark and Windows high contrast. 13 kB of JS before compression.

The components are the smaller half. The other half is how they are tested: real key presses in a real browser, axe on every story in both themes, contrast maths on the tokens, and visual regression without committed screenshots.

```bash
npm ci
npx playwright install chromium
npm run dev             # Storybook on :5193
npm test                # unit + keyboard + every story with axe, light and dark
npm run visual -- main  # compare the working tree with a git ref
npm run build           # dist/: ESM, types, styles.css
```

```tsx
import { Dialog, Button } from "accessible-ui";
import "accessible-ui/styles.css";
```

## Design decisions

**Use the platform, then fix its edges.** `Dialog` is `<dialog>.showModal()`, so inertness and the top layer are the browser's. What it adds: `open` stays controlled (Chrome force-closes on a second Escape even when `cancel` was prevented), focus returns even if React unmounts the dialog first, and a text selection dragged out to the backdrop does not close it.

**Escape belongs to the innermost widget.** An open combobox or menu inside a dialog consumes Escape; the dialog closes on the next one.

**Unavailable buttons stay focusable.** `unavailable` uses `aria-disabled`, so a keyboard user can reach the button and hear why through `aria-describedby`. Clicks and form submits are blocked in code.

**Combobox focus never leaves the input.** The active option is `aria-activedescendant`. Enter picks without submitting the form, IME composition is respected, matching ignores case and accents ("sao" finds "São Paulo"), result counts are announced, and text that was never chosen is dropped on blur so what is shown is what is stored.

**Toasts are live regions that exist before the first message.** Errors never time out. The timer pauses on hover or focus. Dismissing with the keyboard gives focus back to where it came from.

**Tokens are `light-dark()` pairs**, parsed by a test that computes WCAG contrast for each pair used together (4.5 for text, 3 for borders, focus and state). A colour token that is in no checked pair also fails.

## Tests (152)

| Project | What | Count |
|---|---|---|
| unit | contrast, roving/typeahead logic, SSR render, the image comparer | 58 |
| keyboard | Chromium; keys sent through the DevTools protocol, so Tab order, native Escape and inertness are real | 44 |
| stories | 25 stories with axe (WCAG 2.2 AA + best practice), light and dark | 50 |

28 deliberate bugs were put in one at a time (no focus return, `show()` instead of `showModal()`, no IME check, no outline, a dark-only contrast bug...). The first run caught 26. The two it missed, one right-to-left direction and the close/select order in Menu, got tests, and were then caught. Worth noting: most bugs were caught **only** by the keyboard tests. axe alone would have passed them.

## Visual regression without baselines in git

Committed screenshots break when a Mac and a Linux CI render fonts differently. `npm run visual` builds the base commit in a git worktree and the working tree next to it, screenshots all stories in four modes (light, dark, 320 px phone, forced colours: 100 shots), and compares. Same machine, same browser.

- Changed or removed fails. Added is reported.
- A story that errors, or scrolls sideways, fails. 320 px is the WCAG reflow width.
- The base having no Storybook is printed as `NO BASELINE`; a base that does not build, or a mistyped ref, fails.
- In a pull request, the report is an artifact. After looking at it, add the label `visual-approved` to accept an intended change.

The comparison rule came from measuring. A tolerance of 0.02 reported 1 screenshot for a one-shade accent change. Exact equality found 14, but an unchanged tree once failed on 4 faint anti-aliasing pixels. So: a clear difference counts from one pixel, a faint one from 33. With that rule, seven repeated captures matched and the accent change was found in 13 screenshots.

## Limits

- **Not tested with a screen reader or by disabled users.** Roles, names and focus are checked; what VoiceOver or NVDA says aloud is not. Automated checks find only part of accessibility problems.
- Chromium only. Firefox and Safari are not run.
- Forced colours are emulated, not checked on Windows.
- Popups open downward and are not collision-aware, so one near the bottom edge or inside a short dialog can be clipped or need scrolling.
- `Menu` has no submenus or checkable items. `Combobox` is single-select and client-side, and is not virtualised.
- Types use bundler module resolution. `light-dark()` needs a 2024 or newer browser.
- The faint-pixel rule means a faint change of 32 pixels or fewer passes. The noise numbers come from one Mac.
- A learning and portfolio project. It is not published to npm and no product uses it.
