# Portfolio Website — Blueprint Theme

## Folder Structure
```
portfolio/
├── index.html        Main page — all content lives here
├── css/
│   └── style.css      All styling (design tokens at the top)
├── js/
│   └── script.js       Cursor coordinate readout, mobile nav, scroll reveal
├── images/            Put your photo and project screenshots here
└── README.md
```

## How to use it
1. Open `index.html` in a browser to preview — no build step needed.
2. Replace placeholder text (name, bio, project descriptions, email, social
   links) directly in `index.html`.
3. Drop your photo into `images/` and swap the `.photo-placeholder` div in
   the About section for an `<img>` tag pointing at it.
4. Add real project screenshots the same way inside each `.project` block.

## Customizing colors / fonts
Open `css/style.css` and edit the `:root` variables at the very top:
```css
--bg: #12161a;      background
--blue: #5b8cff;    primary accent
--orange: #ff6a2b;  secondary accent
```
Fonts are loaded from Google Fonts in `index.html` — swap the `<link>` tag
and the `--font-display` / `--font-body` variables together if you want a
different pairing.

## Deploying
This is a static site — you can host it for free on:
- GitHub Pages
- Netlify (drag-and-drop the folder)
- Vercel

## SEO / ranking note
No website design can *guarantee* a #1 Google ranking — that depends on
content quality, backlinks, and time. To help your real-world ranking once
you fill this in with your actual info:
- Update the `<title>` and add a `<meta name="description">` tag in `<head>`
- Use your real name and skills as actual text (not just images)
- Keep the site fast (it already is — no heavy frameworks)
- Submit the site to Google Search Console once it's live
