# Running, testing and publishing

- [Run locally](#run-locally)
- [Publishing with GitHub Pages](#publishing-with-github-pages)
- [Custom domain](#custom-domain)
- [Testing checklist](#testing-checklist)
- [Troubleshooting](#troubleshooting)

## Run locally

There is nothing to install or build.

**Quickest:** open `index.html` in a browser. Everything works from the file
system, because the scripts are classic scripts rather than ES modules.

**Closer to production:** serve the folder with any static server, for example:

```bash
python -m http.server 8080      # Python 3
# or
npx serve .                     # Node.js
```

Then open <http://localhost:8080>. A server is closer to how GitHub Pages
behaves (MIME types, video range requests, relative paths).

## Publishing with GitHub Pages

The site is a static site served by GitHub Pages straight from the
repository, with no build step and no GitHub Actions workflow:

1. Commit and push to the branch Pages publishes from (`main`).
2. GitHub Pages deploys it within a minute or two.
3. Reload <https://alvaro.cabrero.me>. If you see the old version, force a
   reload (Ctrl+Shift+R / Cmd+Shift+R); browsers and the CDN can cache
   CSS and JS for a few minutes.

The publishing source is set in the repository's **Settings → Pages**. For
this layout it should be *Deploy from a branch*, branch `main`, folder
`/ (root)`, since `index.html` and `CNAME` sit at the repository root. The
*pages-build-deployment* entry in the repository's Actions tab shows each
deployment and whether it succeeded.

Everything in the repository, including its history, is public once pushed.
Do not commit anything you would not publish.

## Custom domain

The `CNAME` file holds the custom domain, `alvaro.cabrero.me`. GitHub Pages
reads it to serve the site on that domain. **Do not delete or rename it**:
without it the site falls back to the default `github.io` address.

The domain also needs a DNS record at the domain's DNS provider. For a
subdomain like this one, that is a `CNAME` record for `alvaro` pointing to
`alvarocabrero.github.io`. In **Settings → Pages**,
the custom domain should show as verified, with *Enforce HTTPS* turned on.

## Testing checklist

There are no automated tests. Before pushing a change, check:

**Layout, at several widths.** Use the browser's responsive mode:
- 320px and 360px (small phones), 390–430px (current phones)
- 568–844px in landscape
- 768px and 1024px (tablets), and just either side of the **820px** breakpoint
- 1280px, 1920px and wider

At every width, there should be no horizontal scrolling, and no text should
be cut off or overlapping.

**Behaviour:**
- Ragdoll: it waves when idle, can be pushed and dragged (with mouse and touch),
  and gets back up.
- Carousels: dots, swipe, ←/→ when focused, hover autoplay, click to enlarge.
- Popup: YouTube and Steam links open in it; the arrows and ←/→ work for
  enlarged media; Close, the backdrop and Esc close it, and the video stops.
- All PDF links download.

**Accessibility:**
- Tab through the page: every link and control gets a visible focus ring.
- Turn on *reduce motion* in the OS: the ragdoll stands still until touched,
  and carousels jump instead of sliding.

**Browsers:** Chrome or Edge, Firefox and Safari (including Safari on an
iPhone, which only plays H.264 MP4 video).

**Console:** no errors in the browser's developer tools.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| A carousel slide stays grey | The file path in `data-imgs` is wrong (paths are case-sensitive on GitHub Pages), or the video is not H.264 MP4. |
| A video plays on desktop but not on iPhone | It is WebM or not H.264. Re-encode it (see [CONTENT.md](CONTENT.md#preparing-images-and-videos)). |
| A YouTube link opens YouTube instead of the popup | It is a `youtu.be` short link; use `youtube.com/watch?v=…`. |
| The site shows on `github.io` instead of the domain | `CNAME` was removed or changed, or the DNS record is wrong. |
| Changes do not appear | Deployment still running (check Actions), or browser cache: force reload. |
| The page scrolls sideways on phones | A new long word or wide element. Long single words in titles are the usual cause; check at 320px. |
| Fonts look different | A file in `fonts/` failed to load (check the paths in `css/styles.css`); the system fallback is in use. |
