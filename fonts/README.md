# Fonts

Self-hosted copies of the two web fonts the site uses, so the page does not
depend on Google Fonts and its extra connections.

| Files | Font | Licence |
|---|---|---|
| `bricolage-latin.woff2`, `bricolage-latin-ext.woff2` | [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) (variable, weights 400–800) | [SIL OFL 1.1](OFL-BricolageGrotesque.txt) |
| `literata-latin.woff2`, `literata-latin-ext.woff2` | [Literata](https://github.com/googlefonts/literata) (variable, weights 400–600; 600 is used for bold text) | [SIL OFL 1.1](OFL-Literata.txt) |
| `literata-italic-latin.woff2`, `literata-italic-latin-ext.woff2` | Literata italic | [SIL OFL 1.1](OFL-Literata.txt) |

The files are Google Fonts' own Latin and Latin Extended subsets, downloaded
from fonts.gstatic.com. They are declared with `@font-face` at the top of
`css/styles.css`, where `unicode-range` makes the browser fetch a subset only
when the page contains one of its characters. Usually only the three `-latin`
files are downloaded.

These fonts are licensed under the SIL Open Font License 1.1, not the MIT
License that covers the site's code.
