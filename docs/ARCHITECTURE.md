# Architecture

How the site is put together: files, script loading, the model–view–controller
split, and what every module does.

- [Principles](#principles)
- [Files](#files)
- [Script loading and the `CV` namespace](#script-loading-and-the-cv-namespace)
- [Model, view, controller](#model-view-controller)
- [Startup sequence](#startup-sequence)
- [Module reference](#module-reference)
- [Progressive enhancement](#progressive-enhancement)
- [Accessibility](#accessibility)
- [Responsive layout](#responsive-layout)
- [Performance](#performance)
- [Browser support](#browser-support)
- [Security notes](#security-notes)

## Principles

- **No build step.** What is in the repository is exactly what is served.
  There is no bundler, transpiler, package manager or framework.
- **Content in HTML, presentation in CSS, behaviour in JS.** `index.html`
  holds all the text and links, `css/styles.css` all the styling, and `js/`
  only adds behaviour on top.
- **Works from the file system.** Scripts are classic `<script>` tags, not ES
  modules, so double-clicking `index.html` works without a server.
- **Progressive enhancement.** Every link is a real link and every carousel is
  a native scroller. JavaScript makes them nicer but is not required to reach
  the content.

## Files

| Path | Role |
|---|---|
| `index.html` | The whole page: markup and content. No inline scripts or `<style>` blocks; only a few one-off `style` attributes. |
| `css/styles.css` | All styles, in eight commented sections. |
| `js/models/ragdoll.js` | Ragdoll physics and state machine. No DOM access. |
| `js/models/media.js` | Media helpers (`CV.Media`) and the `CV.Gallery` list. No DOM access. |
| `js/views/ragdollView.js` | Draws the ragdoll on its canvas; pointer coordinates. |
| `js/views/carouselView.js` | Builds one carousel's DOM and exposes helpers. |
| `js/views/dialogView.js` | The shared popup dialog. |
| `js/controllers/ragdollController.js` | Animation loop and pointer input for the ragdoll. |
| `js/controllers/carouselController.js` | Carousel navigation, autoplay and video playback. |
| `js/controllers/dialogController.js` | Opens the popup from links and carousels. |
| `js/main.js` | Entry point: creates and connects everything. |
| `images/` | Carousel media (JPEG images, H.264 MP4 videos). |
| `icons/` | Favicon (SVG), 32px PNG fallback and 180px Apple touch icon. |
| `recommendations/` | Recommendation letters (PDF), linked from the page. |
| `CV_AlvaroCabrero.pdf` | One-page CV, linked from the top bar and the contact block. |
| `CNAME` | Custom domain for GitHub Pages (`alvaro.cabrero.me`). |
| `archive/` | Material no longer used by the page. See [below](#the-archive-folder). |

### The `archive/` folder

Nothing in `archive/` is loaded by the live page.

- `archive/index_alternativeanim.html` is an earlier single-file version of the
  site. Its styles and scripts are inline, and instead of the ragdoll its hero
  pill shows a procedural animation: a stick figure with a sword and shield
  running to the right through parallax trees and fighting orcs. It is kept for
  reference and can be opened directly in a browser.
- `archive/originals/` holds the original media the current files were made
  from (WebM videos and earlier stills).

## Script loading and the `CV` namespace

Every file in `js/` is an immediately invoked function that receives the global
namespace object and attaches one or two names to it:

```js
(function(CV){
  function Thing(){ /* … */ }
  CV.Thing=Thing;
})(window.CV=window.CV||{});
```

`window.CV=window.CV||{}` lets any file run first and create the namespace.
Nothing else is added to the global scope.

The scripts are included at the end of `<body>`, in dependency order:

```
models       js/models/ragdoll.js, js/models/media.js
views        js/views/ragdollView.js, carouselView.js, dialogView.js
controllers  js/controllers/ragdollController.js, carouselController.js, dialogController.js
entry point  js/main.js
```

Constructors are only looked up when `main.js` runs, so the order inside each
group does not matter. `main.js` must come last.

## Model, view, controller

```
             ┌─────────────────────── js/main.js ───────────────────────┐
             │ creates one of each and connects them                     │
             └───────────────────────────────────────────────────────────┘

  Ragdoll                      Carousels (one per .car)        Popup (one, shared)
  ───────                      ────────────────────────        ───────────────────
  Model       CV.Ragdoll       CV.Gallery, CV.Media            CV.Gallery, CV.Media
  View        CV.RagdollView   CV.CarouselView                 CV.DialogView
  Controller  CV.RagdollController  CV.CarouselController ──►  CV.DialogController
                                     (click enlarges slide)
```

- **Models** hold state and logic and never touch the DOM, so they can run in
  Node or in tests. `CV.Ragdoll` is the physics simulation; `CV.Gallery` is an
  ordered list of media with a wrap-around cursor; `CV.Media` holds stateless
  helpers (video detection, YouTube and Steam embed URLs).
- **Views** own the DOM: they generate markup, read sizes and positions, and
  draw. They hold no behaviour beyond what the markup itself needs (the dialog
  view wires its own close button, backdrop and arrow keys).
- **Controllers** listen to user input and timers, call the model, and tell the
  view what to show.

## Startup sequence

`js/main.js` runs once, after the DOM is parsed:

1. Creates the `DialogView` (finds `#vid`, `#vidframe`, `#vidlink`,
   `#vidclose`) and the `DialogController`, which attaches click handlers to
   every YouTube link and every `a.steam` link.
2. For every `.car` element, creates a `CarouselController`. It builds a
   `Gallery` from the element's `data-title` and `data-imgs`, renders the
   `CarouselView` into it, and wires dots, keys, hover and visibility.
3. Creates the ragdoll model, view and controller, sizes the canvas and starts
   the animation loop.

## Module reference

Every function is also documented with JSDoc in its source file.

### `CV.Media` (`js/models/media.js`)

| Member | Description |
|---|---|
| `isVideo(src)` | True for paths ending in `.mp4` or `.webm` (case-insensitive). |
| `youtubeEmbed(url)` | youtube-nocookie.com embed URL for a `watch?v=` link (keeping any `list`) or a `playlist?list=` link, with autoplay and `rel=0`. Returns `null` for anything else, such as `youtu.be` links. |
| `steamWidget(appId)` | `https://store.steampowered.com/widget/<appId>/`. |

### `CV.Gallery` (`js/models/media.js`)

| Member | Description |
|---|---|
| `new Gallery(title, srcs, index=0)` | Ordered list of media paths with a cursor. |
| `Gallery.fromElement(el)` | Builds one from a `.car` element's `data-title` and comma-separated `data-imgs`. |
| `count()`, `current()` | Number of items; path of the selected one. |
| `alt()` | Alt text such as `"John Wick 2"`. |
| `move(d)` | Moves the cursor by `d`, wrapping around. |

### `CV.Ragdoll` (`js/models/ragdoll.js`)

See [RAGDOLL.md](RAGDOLL.md) for the physics in depth.

| Member | Description |
|---|---|
| `points` | 11 joints, each `{x, y, px, py}` in CSS pixels (current and previous position). |
| `W`, `H` | Size of the pill box. All lengths are fractions of `H`. |
| `resize(w, h)` | Sets the box size; re-poses when idle, scales joints otherwise. |
| `step()` | Advances one frame: idle animation, or physics plus get-up logic. |
| `grab(x, y)` | Grabs the joint nearest to the point (within 0.4·H); returns false if none. |
| `dragTo(x, y)`, `release()`, `isDragging()` | Drag control. |
| `push(x, y, dx, dy)` | Pushes joints near the pointer in the direction it moved. |
| `wake()` | Leaves the idle state and cancels any get-up. |
| `pose()`, `fit(p, m)`, `rise()`, `nearest(x, y)` | Internals: idle pose, pill collision, get-up step, joint lookup. |
| `Ragdoll.BONES` | The bone table, exposed for debugging. |

### `CV.RagdollView` (`js/views/ragdollView.js`)

| Member | Description |
|---|---|
| `resize()` | Matches the canvas backing store to its CSS size × `devicePixelRatio`; returns `{w, h}` in CSS pixels. |
| `draw(model)` | Clears and draws the figure in white: spine, arms, legs and a filled head. |
| `local(event)` | Pointer position relative to the canvas, as `[x, y]`. |
| `cursor(value)`, `capture(pointerId)` | Cursor style and pointer capture while dragging. |

### `CV.RagdollController` (`js/controllers/ragdollController.js`)

Owns the `requestAnimationFrame` loop (one `step()` and one `draw()` per
frame), handles `pointerdown/move/up/cancel/leave` on the canvas and `resize`
on the window. `start()` sizes the canvas and begins. With reduced motion the
loop does not run; see [Accessibility](#accessibility).

### `CV.CarouselView` (`js/views/carouselView.js`)

Replaces a `.car` element's contents with:

```html
<div class="frame">
  <div class="track" tabindex="0" aria-label="Title slides">
    <figure class="slide"><img …> or <video muted loop playsinline preload="metadata" …></figure>
    …
  </div>
  <div class="cap">Title</div>
</div>
<div class="dots"><button aria-label="Go to slide 1"></button>…</div>
```

| Member | Description |
|---|---|
| `frame`, `track`, `slides`, `dots` | The generated elements. |
| `index()` | Slide currently in view (from the scroll position). |
| `scrollTo(i, smooth)` | Scrolls to slide `i`. |
| `video(i)` | The slide's `<video>`, or `null` for an image. |
| `markDot(k)` | Sets `aria-current` on dot `k` (which also styles it). |

A slide gets the class `has` once its media has loaded; until then it shows
the accent colour as a placeholder.

### `CV.CarouselController` (`js/controllers/carouselController.js`)

| Input | Result |
|---|---|
| Swipe / scroll the strip | Native scroll-snap; the dots and videos follow. |
| Click a dot | Scrolls to that slide. |
| ←/→ with the strip focused | Previous/next slide, wrapping around. |
| Mouse enters | Autoplay: each video plays once from the start, each image shows for 1.5 s, then it advances (600 ms between slides). |
| Mouse leaves | Autoplay stops; videos loop again. |
| Carousel scrolls off screen | Its videos pause (`IntersectionObserver`). |
| Click the frame | Opens the current slide enlarged in the popup. |

Without hover, only the visible slide's video plays (muted, looping); all
others are paused.

### `CV.DialogView` (`js/views/dialogView.js`)

| Member | Description |
|---|---|
| `supported` | Whether `HTMLDialogElement.showModal` exists. |
| `showYouTube(src, href)` | Opens an embed, with an "Open on YouTube" link. |
| `showSteam(src, href, title)` | Opens the Steam widget in a short frame, with an "Open on Steam" link. |
| `renderMedia(src, isVideo, alt)` | Puts one image or video (with controls) plus ‹ › arrows in the frame. |
| `openMedia()` | Opens the dialog in media mode (external link hidden). |
| `onNav` | Callback set while a gallery is open; called with `+1`/`-1` from the arrows or ←/→. |

Closing (Close button, backdrop click or Esc) empties the frame, which stops
any playback, and clears `onNav`.

### `CV.DialogController` (`js/controllers/dialogController.js`)

| Member | Description |
|---|---|
| `supported` | Mirrors the view's. |
| `openGallery(gallery)` | Shows `gallery.current()` and lets the arrows move through it. |

On construction it intercepts clicks on `a[href*="youtube.com"]` (when the URL
can be embedded) and on `a.steam` (using `data-steam` and `data-title`).

## Progressive enhancement

| Without… | What happens |
|---|---|
| JavaScript | Carousels stay empty placeholders and the ragdoll pill stays an empty grey pill. Every link (YouTube, Steam, PDFs) works as a normal link. |
| `<dialog>` support | YouTube and Steam links open normally and carousels are not clickable. |
| `IntersectionObserver` | Videos are not paused when scrolled off screen. |
| Web fonts | The system fallbacks are used (Helvetica Neue/Arial, Georgia). Section titles still fit any width. The hero title is sized for Bricolage Grotesque; with the wider fallback it can overflow by a few pixels on phones 360–390px wide. |
| A media file | That slide keeps showing the accent-coloured placeholder. |

## Accessibility

- `lang="en"` on the page, one `h2` per section, `h3` in Education.
- Visible focus ring (`:focus-visible`, 3px accent outline).
- Carousels: the strip is focusable with ←/→, each dot is a labelled button
  marked with `aria-current`, images have alt text and videos an
  `aria-label`. Each carousel is a labelled region with
  `aria-roledescription="carousel"`.
- The popup is a native modal `<dialog>`: focus moves into it, Esc closes it,
  and ←/→ navigate enlarged media.
- The ragdoll canvas has an `aria-label` describing what it is and how to
  interact with it. It is decorative; no content depends on it.
- **Reduced motion** (`prefers-reduced-motion: reduce`):
  - The ragdoll has no animation loop. It is drawn once in its standing pose
    and only updates in response to input.
  - Carousels scroll instantly instead of smoothly, and videos only play while
    hovered.
  - Smooth scrolling of the strip is disabled in CSS.

## Responsive layout

- Type is fluid: `clamp(min, vw, max)` sizes follow the viewport.
- The hero title and section titles are additionally capped by the available
  width, so the widest words ("ANIMATION" plus the pill, "RECOMMENDATIONS")
  fit screens down to about 220px wide (checked with the web fonts loaded).
- One breakpoint, **820px**: below it, rows and Skills/Education stack into
  one column, the top bar keeps only the name and Contact, and carousels use a
  portrait 4:5 frame instead of 16:10.
- `viewport-fit=cover` plus `env(safe-area-inset-*)` padding keep content
  clear of notches and home indicators.
- `touch-action: none` on the canvas lets touch users drag the figure without
  scrolling the page.

## Performance

- No framework and a few hundred lines of JavaScript in total, loaded as
  plain files with no build step.
- Videos use `preload="metadata"`, so only their size and duration load until
  they play. Off-screen and non-visible videos are paused.
- The ragdoll canvas is small, and its backing store matches the device pixel
  ratio, so it is sharp without being oversized.
- Fonts load with `display=swap`, so text shows immediately in the fallback font.

## Browser support

Current versions of Chrome, Edge, Firefox and Safari (desktop and mobile). The
features the page relies on (CSS `clamp()`/`min()`, `aspect-ratio`,
scroll-snap, `<dialog>`, Pointer Events) are all supported there. Older
browsers degrade as described in [Progressive enhancement](#progressive-enhancement).

## Security notes

- The carousel and dialog views build HTML with string concatenation. Titles
  and paths come from `index.html` itself, so this is safe as long as no
  user-supplied text ever reaches them.
- YouTube embeds use the youtube-nocookie.com domain and a
  `strict-origin-when-cross-origin` referrer policy.
- There are no cookies, analytics, forms or third-party scripts. The only
  third-party requests are Google Fonts and, when opened, the YouTube or Steam
  iframe.
