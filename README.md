# Pellicula

A browser-based **vintage photobooth** built with React. Use your webcam, apply film-style filters, optional countdown, and collect up to eight shots on a film strip you can download.

## Features

- Live camera preview with front/back camera switch (where supported)
- Vintage color filters
- Optional shutter countdown
- Film-strip layout for captured photos (max 8)
- Download composed strip as an image

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

Open the URL shown in the terminal (default: [http://localhost:5173](http://localhost:5173)). The app needs **camera permission** in the browser.

## Production build

```bash
npm run build
npm run preview   # optional: serve the production build locally
```

Output is written to `dist/`.

## License

This project is provided as-is for personal or educational use unless you add your own license.
