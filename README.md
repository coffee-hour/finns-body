# Finn's Digital Body

A highly polished, interactive single-page web application representing 'Finn's Digital Body' (a cybernetic shell/terminal for Xavier to chat with his AI mentor Finn).

## Features
- **Dark Cyber Aesthetic:** Neon oranges, dark carbon grays, and glowing borders.
- **Interactive Waveform:** A canvas-based animation representing Finn's digital brain.
- **Terminal Interface:** Simulated chat with Finn's signature lowercase, slang-heavy mentor voice.
- **Responsive Design:** Optimized for both desktop and mobile.

## Deployment to Cloudflare Pages

1. **Push to GitHub:** This repository is already on GitHub.
2. **Connect to Cloudflare:**
   - Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com) and go to **Workers & Pages**.
   - Click **Create application** > **Pages** > **Connect to Git**.
   - Select the `finns-body` repository.
3. **Configure Build:**
   - **Project Name:** `finns-body`
   - **Production Branch:** `main`
   - **Framework Preset:** `None` (Since this is a vanilla HTML/CSS/JS project).
   - **Build Command:** (Leave empty)
   - **Build Output Directory:** (Leave empty, or `/` if it requires one)
4. **Deploy:** Click **Save and Deploy**.

Your app will be live at `finns-body.pages.dev`.