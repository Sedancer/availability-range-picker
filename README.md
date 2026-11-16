# TimeSlotter — 1-Click Availability Generator

Modern, responsive web application built with **React + TypeScript + Vite + Tailwind CSS** designed to effortlessly generate and copy clean availability slot strings for client forms and messaging apps.

## 🚀 Key Features

1. **Interactive 7-Day Week Schedule**:
   - Starting day defaults to **Thursday** (customizable to any day in Settings).
   - **Weekends Disabling Toggle**: Saturday and Sunday can be disabled and dimmed out, preventing selection and outputting a dash (`—`).
   - **Mouse & Touch Painting**:
     - **Left Click (LMB) or touch**: Paint / select available hours.
     - **Right Click (RMB)**: Eraser mode (browser context menu is blocked inside the grid).
     - **Mobile view**: Full-screen Day Tabs view with large touch targets, plus an Add/Erase tool switcher.
   - **Pre-filled Weekdays**: Monday, Tuesday, and Wednesday come pre-populated (with a 1-click `Prefill Mon–Wed` action button).

2. **Sleep Hours & 24-Hour Filter**:
   - By default, hides sleeping hours (e.g. 22:00 – 08:00) so the grid remains compact and fast to navigate.
   - Sleep hours can be adjusted or completely disabled to expose all 24 hours.

3. **Timezones**:
   - Independent selection for **My Timezone** and **Client Timezone** (both default to `UTC+00:00`).
   - Automatically converts generated time slots to the client's timezone or displays both side-by-side.

4. **Data Persistence (LocalStorage)**:
   - Preferences and settings are always remembered in the browser's `localStorage`.
   - Hour selection resets per session by default, with an optional toggle to persist selections across reloads.

5. **1-Click Copy**:
   - Real-time updates as you paint hours.
   - Merges consecutive hours into clean ranges (e.g., `14:00 - 17:00, 18:00 - 20:00`).
   - Empty or disabled days format as `—`.
   - Supports Multi-line and Single-line formats.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 🌐 GitHub Pages Deployment

An automated GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.

To deploy:
1. Push your repository to GitHub.
2. In GitHub, go to **Settings** -> **Pages**.
3. Under **Build and deployment**, select **Source: GitHub Actions**.
4. Push to `main` (or trigger the workflow manually) to publish your app at `https://<your-username>.github.io/<repo-name>/`.
