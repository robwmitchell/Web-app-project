<<<<<<< HEAD
# Web-app-project
Service Status POC
=======
# Service Status Dashboard (Vite + React)

This project is a modern, glassmorphic dashboard for monitoring the status of key SaaS providers: Cloudflare, Zscaler, SendGrid, and Okta. It is built with Vite and React, featuring live polling, animated status cards, and a beautiful, responsive UI.

## Features

- **Live Service Status**: Real-time polling of Cloudflare, Zscaler, SendGrid, and Okta public status APIs every 60 seconds.
- **Glassmorphism UI**: Modern, animated cards with floating provider logos and pop effect on updates.
- **Provider Logos**: Official SVG logos for each provider.
- **Theme Switching**: Automatic card theming (light/dark) based on service status, with a user override toggle (auto, light, dark).
- **Service History**: 7-day service history bar at the bottom of each card, with day-of-week labels and colored indicators (green/yellow/red) for each day.
- **Company Info**: Flip each card to view provider website and a short description of their services.
- **Incident Details**: Click "View last 7 days" to see a modal with recent incidents/updates for each provider.
- **Responsive Design**: Works well on desktop and mobile.

## Usage

1. **Install dependencies**:
   ```sh
   npm install
   ```
2. **Start the dev server**:
   ```sh
   npm run dev
   ```
3. **Open in browser**: Visit the local URL shown in your terminal (usually http://localhost:5173).

## Customization
- Add or update provider info in `LivePulseCardContainer.jsx`.
- Adjust glassmorphism and theme styles in `Glassmorphism.css` and `LivePulseCard.css`.
- To add more providers, follow the pattern in `App.jsx` and `LivePulseCardContainer.jsx`.

## Status Indicator Colors
- **Green**: No issues detected.
- **Yellow**: Minor/historic issues detected (e.g., Zscaler historic issues).
- **Red**: Major/critical issues detected.

---

This project is a demonstration of best practices for modern React development with Vite, focusing on clean UI, real-time data, and user experience.
>>>>>>> b0ce4b4 (Initial commit)
