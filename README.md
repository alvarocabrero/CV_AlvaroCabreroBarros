# Álvaro Cabrero Barros · Animation Programmer

Personal site and CV, published with GitHub Pages at [alvaro.cabrero.me](https://alvaro.cabrero.me).
Plain HTML, CSS and JavaScript: no build step.

## Structure

```
index.html            The page (markup only)
CNAME                 Custom domain for GitHub Pages
CV_AlvaroCabrero.pdf  One-page CV, linked from the page
css/styles.css        Styles
js/                   Scripts, organised as model / view / controller
  models/             Ragdoll physics and state, media helpers (no DOM)
  views/              Canvas, carousel and popup rendering
  controllers/        Input handling and behaviour
  main.js             Wires everything together
images/               Media shown in the Work carousels
icons/                Favicon (SVG) and PNG icons
recommendations/      Recommendation letters (PDF) linked from the page
archive/              Old page variant and original media no longer used
```

The scripts are plain classic scripts sharing a `CV` namespace, so the site also works
when opened straight from the file system.

## Run locally

Any static server works, for example:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

## License

The site's code (HTML, CSS and JavaScript) is released under the [MIT License](LICENSE).
The CV, recommendation letters, icons and game media are not covered by it; see
[LICENSE](LICENSE) for details.
