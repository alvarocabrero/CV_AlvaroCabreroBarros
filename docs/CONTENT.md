# Editing the content

All the text and links live in `index.html`. You can update the site without
touching any CSS or JavaScript. This guide shows the markup patterns to copy.

- [Page structure](#page-structure)
- [Work entries](#work-entries)
- [Media carousels](#media-carousels)
- [Preparing images and videos](#preparing-images-and-videos)
- [YouTube links](#youtube-links)
- [Steam links](#steam-links)
- [Projects](#projects)
- [Skills and education](#skills-and-education)
- [The CV PDF](#the-cv-pdf)
- [Contact links and footer](#contact-links-and-footer)
- [Top bar links](#top-bar-links)
- [Icons](#icons)
- [Page title](#page-title)
- [Before publishing](#before-publishing)

## Page structure

```
.top                 top bar: name + section links
header               "Hey! I'm Álvaro." + ANIMATION / SYSTEMS& / GAMEPLAY (with the ragdoll)
#about               About me
#work                Work: one .row per job
#skills              Skills (chips) | Education
#projects            Projects: one .row per project, newest first
#contact             Let's talk: e-mail, LinkedIn, CV buttons
footer               name, place, year
dialog#vid           popup used by the scripts (do not edit)
```

## Work entries

Each job is a `.row`. The left column holds the name and the meta lines, the
right column the details.

```html
<div class="row">
  <div><p class="name">Company</p><p class="meta">Role<br>City · Mon YYYY – Mon YYYY</p></div>
  <ul>
    <li>What you did, with results.</li>
    <li>Another point.</li>
  </ul>
</div>
```

The right column can also be a single `<p>` instead of a `<ul>`. To add media
or extra content above the list, wrap the right column in a `<div>`; see the
Saber Interactive entry.

Newest entries go first. The first `.row` of each section has no top border
(handled by CSS).

## Media carousels

A carousel is an empty `div.car` that the scripts fill in:

```html
<div class="gallery">
  <div class="car" data-title="Turok: Origins"
       data-imgs="images/turok-origins-1.mp4,images/turok-origins-2.mp4,images/turok-origins-3.mp4"
       role="region" aria-roledescription="carousel" aria-label="Turok: Origins images"></div>
  <div class="car" data-title="John Wick" data-imgs="images/john-wick-1.webp,images/john-wick-2.webp,images/john-wick-3.webp"
       role="region" aria-roledescription="carousel" aria-label="John Wick images"></div>
</div>
```

- `data-title` is shown as the caption and used in alt text ("John Wick image 2").
- `data-imgs` is a comma-separated list of paths, **without spaces**. Images
  and videos can be mixed; `.mp4` and `.webm` are treated as video, anything
  else as an image.
- Keep `role`, `aria-roledescription` and `aria-label` for screen readers.
- `.gallery` lays carousels out two per row. A single carousel takes half the
  width; for one full-width carousel, drop the `.gallery` wrapper.

Visitors can swipe, use the dots or the ←/→ keys. Hovering with a mouse plays
through the slides, and clicking opens the current slide enlarged.

## Preparing images and videos

Carousels crop media to fill the frame (`object-fit: cover`):

| Screen | Frame shape |
|---|---|
| Wider than 820px | 16:10 landscape |
| 820px and narrower | 4:5 portrait |

So **keep the subject in the centre**: the sides are cut off on phones. The
enlarged popup shows the whole image or video without cropping.

**Images:** WebP, 1280px wide, ideally under 60 KB each. That is sharp in
the carousel on high-DPI phones and in the enlarged popup, which is at most
960px wide. The current images are 1280×720 at 35–50 KB. Every current
browser supports WebP.

**Videos:** H.264 MP4. This is the only format every current browser plays,
Safari on iPhone included. Videos play muted, so remove the audio track to save
space. Keep clips short (4–10 s) and a few MB each. The current clips are
1170×496, about 2.6 Mbit/s, with no audio.

With [ffmpeg](https://ffmpeg.org/):

```bash
# H.264 MP4, no audio, 1170px wide, starts playing before it finishes downloading
ffmpeg -i input.webm -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
       -vf "scale=1170:-2" -crf 23 -preset slow -movflags +faststart images/name.mp4

# WebP still at 1280px wide
ffmpeg -i input.png -vf "scale=1280:-2" -c:v libwebp -quality 78 images/name.webp
```

Keep the original captures (for example WebM recordings) outside the
repository, so the web versions can be regenerated without bloating it.

Game footage and stills remain the property of their publishers; see
[LICENSE](../LICENSE).

## YouTube links

Any link to `youtube.com` opens in the popup with a privacy-friendly
(youtube-nocookie.com) embed:

```html
(<a href="https://www.youtube.com/watch?v=VIDEO_ID">gameplay trailer</a>)
<a href="https://youtube.com/playlist?list=PLAYLIST_ID">demo videos</a>
```

Supported forms: `watch?v=…`, `watch?v=…&list=…` and `playlist?list=…`.
Short `youtu.be/…` links are not intercepted and open YouTube normally; use
the full `youtube.com/watch?v=` form to get the popup.

## Steam links

A link with class `steam` opens Steam's store widget in the popup:

```html
<strong><a class="steam" href="https://store.steampowered.com/app/1967610/Turok_Origins/"
   data-steam="1967610" data-title="Turok: Origins">Turok: Origins</a></strong>
```

- `href` is the store page. It is used for "Open on Steam" and when the popup
  is not available.
- `data-steam` is the app id, the number after `/app/` in the store URL.
- `data-title` names the widget for screen readers.

## Projects

Same `.row` pattern as Work. Put the type, the technology and the links in
the meta lines:

```html
<div class="row">
  <div><p class="name">Verso</p><p class="meta">Android app for poetry and lyrics<br>Kotlin, Jetpack Compose<br><a href="https://github.com/alvarocabrero/Verso">Source code</a> · <a href="https://github.com/alvarocabrero/Verso/releases/latest">Download</a></p></div>
  <ul>
    <li>What it does.</li>
    <li>What you built.</li>
  </ul>
</div>
```

Newest projects go first.

## Skills and education

Skills are lists of chips. `.hot` on a list highlights all its chips (used for
the core skills):

```html
<ul class="chips hot"><li>Unreal Engine 5</li><li>C++</li></ul>
<ul class="chips"><li>Unity</li><li>C#</li></ul>
```

Each degree in Education is a one-column `.row` with an `h3`, a `.meta` line
and a description. Languages go in the last `.meta` paragraph.

## The CV PDF

The CV is generated from `cv/cv.html`, a one-page A4 layout of the same
content in condensed form. When you change the page, update `cv/cv.html` too
and rebuild the PDF; [cv/README.md](../cv/README.md) has the one-line command
and the manual steps.

Keep the file name `CV_AlvaroCabrero.pdf` and every download link keeps
working: the top bar and the contact block both link to it. If you rename it,
update the two `href`s in `index.html`.

## Contact links and footer

In `#contact`: the e-mail (`mailto:`), the LinkedIn profile and the CV. The
first button (`.btn`) is filled; the others (`.btn alt`) are outlined. The
footer holds the name, place and year.

## Top bar links

```html
<nav aria-label="Sections"><a class="h" href="#about">About</a>…<a href="#contact">Contact</a></nav>
```

Links with class `h` are hidden on screens 820px and narrower, so the bar
fits on phones. Keep at least one link without it.

## Icons

- `icons/favicon.svg`: the tab icon, an "AC" monogram in a calligraphic script (outlines of the Parisienne font, SIL OFL 1.1, converted to an SVG path so no font file is needed) on a light rounded square. The monogram is not shown on the page itself.
- `images/og.png`: the 2400×1260 preview image (monogram plus name) shown when the site is shared (LinkedIn, Slack, etc.), referenced by the `og:image` tags in `index.html`. After changing it, ask LinkedIn's Post Inspector to re-scrape the URL, as platforms cache previews.
- The name in the top bar is set in Bodoni Moda, uppercase with wide tracking (`.top .brand` in `css/styles.css`).
- `icons/icon-32.png`: PNG fallback for browsers without SVG favicons.
- `icons/icon-180.png`: Apple touch icon (home screen on iOS).

If you change the SVG, export both PNGs again at the same sizes.

## Page title

The `<title>` in `<head>` is what tabs, bookmarks and search results show.

## Before publishing

1. Open the page locally (see [DEPLOYMENT.md](DEPLOYMENT.md#run-locally)).
2. Check new links, including YouTube and Steam popups.
3. Narrow the window down to phone width and back: nothing should cause
   horizontal scrolling.
4. Check new media in the carousel on a wide window and a phone-width window,
   since the crop is different.
