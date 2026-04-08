# Pellicula

A browser-based **vintage photobooth** built with React. Capture up to 3 photos, apply film-style filters, preview your strip with a photobooth-style drop animation, and download a customized strip image.

## Features

- Live camera preview with front/back camera switch (where supported)
- Vintage color filters
- Timer options (`Off`, `3s`, `5s`, `10s`)
- Auto photobooth mode (3 guided shots with countdown + prompts)
- Film-strip layout for captured photos (max 3)
- Tap-to-preview strip fullscreen with drop-in animation
- Download modal with:
  - Strip color themes (including black and brown)
  - Optional custom one-line footer text
  - Full-strip and individual frame download
- iPhone/Safari-friendly canvas export fallback to preserve filter effects in downloaded images

## Tech stack

- [Vite](https://vitejs.dev/) — dev server and build
- [React 18](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide](https://lucide.dev/) — icons

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the URL shown in the terminal.  
For this repo setup, local dev typically runs at:

- [http://localhost:5173/Pellicula-/](http://localhost:5173/Pellicula-/)

The app needs **camera permission** in the browser.

## Production build

```bash
npm run build
npm run preview   # optional: serve the production build locally
```

Output is written to `dist/`.

## Deploy (GitHub Pages)

This project is configured to deploy via GitHub Actions to Pages.  
After pushing to `main`, the site is published at:

- [https://rabeyamily.github.io/Pellicula-/](https://rabeyamily.github.io/Pellicula-/)

## License

This project is provided as-is for personal or educational use unless you add your own license.
