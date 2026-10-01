# Álvaro Cabrero Barros · Animation Programmer

Personal site and CV, published with GitHub Pages at [alvaro.cabrero.me](https://alvaro.cabrero.me).
Plain HTML, CSS and JavaScript: no build step, no framework, no dependencies.

## Features

- **Interactive ragdoll.** The stick figure in the hero title waves while idle.
  Push it with the pointer or drag it by any joint and it falls, tumbles inside
  its pill and gets back up. It is a small verlet physics simulation; see
  [docs/RAGDOLL.md](docs/RAGDOLL.md).
- **Media carousels** for work samples: swipe, dots or arrow keys; autoplay
  on hover; click to enlarge.
- **Popup player** for YouTube trailers (privacy-friendly embeds), Steam store
  widgets and enlarged carousel media.
- **Responsive** from about 220px-wide phones to 4K screens, with fluid type
  and a single breakpoint at 820px.
- **Accessible:** keyboard navigation, visible focus, labelled controls, a
  native modal dialog, and support for reduced motion.
- **Downloads:** a one-page CV and the full recommendation letters, as PDFs.

## Documentation

| Document | Contents |
|---|---|
| [docs/CONTENT.md](docs/CONTENT.md) | Editing the site: adding jobs, projects, carousels, videos, YouTube/Steam links, recommendations; preparing media. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code is organised: files, script loading, model–view–controller, module reference, accessibility, responsive layout, browser support. |
| [docs/RAGDOLL.md](docs/RAGDOLL.md) | The ragdoll in depth: skeleton, states, idle animation, physics, collisions, getting up, input, constants and tuning. |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Running locally, publishing with GitHub Pages, the custom domain, the testing checklist and troubleshooting. |

Every JavaScript function is also documented with JSDoc comments in its
source file, and `css/styles.css` and `index.html` are commented section by
section.

## Structure

```
index.html            The page: all content and markup
CNAME                 Custom domain for GitHub Pages
CV_AlvaroCabrero.pdf  One-page CV, linked from the page
LICENSE               MIT for the code; personal content and game media excluded
css/styles.css        All styles, in eight commented sections
js/                   Scripts, organised as model / view / controller
  models/             Ragdoll physics and state, media helpers (no DOM)
  views/              Canvas, carousel and popup rendering
  controllers/        Input handling and behaviour
  main.js             Wires everything together
images/               Media shown in the Work carousels
icons/                Favicon (SVG) and PNG icons
recommendations/      Recommendation letters (PDF) linked from the page
archive/              Old page variant and original media no longer used
docs/                 Project documentation
```

The scripts are plain classic scripts sharing a `CV` namespace, so the site also works
when opened straight from the file system.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server, for example:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

## Publish

Push to `main`; GitHub Pages serves the repository as is. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the custom domain and a checklist
to run before publishing.

## License

The site's code (HTML, CSS and JavaScript) is released under the [MIT License](LICENSE).
The CV, recommendation letters, icons and game media are not covered by it; see
[LICENSE](LICENSE) for details.
