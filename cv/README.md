# CV source

`cv.html` is the source of [`CV_AlvaroCabrero.pdf`](../CV_AlvaroCabrero.pdf),
the one-page CV linked from the site. It is a single A4 page laid out in HTML
and CSS and printed to PDF with Chrome or Edge.

When the site changes, update `cv.html` to match `index.html` and rebuild the
PDF. The CV is a condensed version of the page, so keep it to one page.

## Rebuild the PDF

From the repository root, with Chrome (or Chromium):

```bash
chrome --headless --no-pdf-header-footer --print-to-pdf=CV_AlvaroCabrero.pdf "file://$PWD/cv/cv.html"
```

On Windows the executable is usually
`"C:\Program Files\Google\Chrome\Application\chrome.exe"`; Edge
(`msedge.exe`) accepts the same options.

Or by hand: open `cv/cv.html` in Chrome or Edge, press Ctrl+P, choose
**Save as PDF**, paper **A4**, margins **None**, turn **Headers and footers**
off and **Background graphics** on, and save over `CV_AlvaroCabrero.pdf`.

Then check that the PDF has exactly one page (`pdfinfo CV_AlvaroCabrero.pdf`,
or open it). If it spills onto a second page, shorten the text.

## Fonts

`fonts/` holds Open Sans (SIL Open Font License, `fonts/OFL-OpenSans.txt`):
the Latin and Latin Extended subsets from Google Fonts, regular 400, 600, 700
and 800 and italic 400.

Google serves Open Sans as a variable font, which Chrome embeds in PDFs as
Type 3 fonts; some viewers render those poorly and some CV-parsing tools read
them badly. So each weight here is a static instance made from the variable
font with [fontTools](https://github.com/fonttools/fonttools):

```bash
pip install fonttools brotli
fonttools varLib.instancer variable.woff2 wght=700 -o opensans-700-latin.woff2
```

With static fonts, Chrome embeds ordinary TrueType subsets, as in the
original CV.
