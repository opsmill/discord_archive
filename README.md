# Infrahub Q&A Viewer

A static web application for browsing and searching Discord forum threads. Built with SvelteKit and Tailwind CSS.

## Features

- Browse Discord forum threads with a clean, dark-themed UI
- Full-text search across thread titles and message content
- Filter threads by tags
- View thread messages with proper formatting (code blocks, links, bold, italic)
- Display attachments, embeds, and reactions
- Resizable sidebar
- Progressive loading for fast initial display
- Fully static - deploy anywhere (GitHub Pages, Netlify, Vercel, etc.)

## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
cd svelte-app
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Building

Build for production:

```bash
npm run build
```

The built files will be in the `build` directory.

Preview the production build:

```bash
npm run preview
```

## Data Format

Place your Discord thread JSON files in `static/data/`. The app expects:

### Thread Files

Each thread should be a JSON file (e.g., `1234567890.json`) containing an array with one object:

```json
[
  {
    "thread": {
      "id": "1234567890",
      "name": "Thread Title",
      "applied_tags": ["tag-id-1", "tag-id-2"],
      "thread_metadata": {
        "create_timestamp": "2024-01-15T10:30:00+00:00",
        "archived": false,
        "locked": false
      }
    },
    "messages": [
      {
        "id": "message-id",
        "content": "Message content here",
        "timestamp": "2024-01-15T10:30:00+00:00",
        "author": {
          "id": "user-id",
          "username": "username",
          "global_name": "Display Name",
          "avatar": "avatar-hash",
          "discriminator": "0"
        },
        "attachments": [],
        "embeds": [],
        "reactions": []
      }
    ]
  }
]
```

### Channel Data (Optional)

Create `static/data/channel_data.json` to define available tags:

```json
[
  {
    "id": "channel-id",
    "name": "channel-name",
    "available_tags": [
      {
        "id": "tag-id-1",
        "name": "Tag Name",
        "emoji_name": "emoji"
      }
    ]
  }
]
```

## Deployment

### GitHub Pages

The repository includes a GitHub Actions workflow for automatic deployment:

1. Push your code to GitHub
2. Go to repository **Settings** > **Pages**
3. Under "Build and deployment", set **Source** to "GitHub Actions"
4. Push to the `main` branch to trigger deployment

The workflow automatically sets the correct base path for your repository.

### Manual Deployment

For deploying to a subpath (e.g., `https://username.github.io/repo-name`):

```bash
BASE_PATH=/repo-name npm run build
```

### Cloudflare Pages

**Option 1: Connect to Git**

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project" > "Connect to Git"
3. Select your repository
4. Configure build settings:
   - **Framework preset**: SvelteKit
   - **Build command**: `npm run build`
   - **Build output directory**: `build`
   - **Root directory**: `svelte-app` (if the app is in a subdirectory)
5. Click "Save and Deploy"

**Option 2: Direct Upload**

1. Build locally: `npm run build`
2. Go to Cloudflare Pages dashboard
3. Click "Create a project" > "Direct Upload"
4. Upload the `build` folder

**Option 3: Wrangler CLI**

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
wrangler pages deploy build --project-name=infrahub-qa
```

### Netlify

1. Connect your repository or drag and drop the `build` folder
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Base directory**: `svelte-app` (if in a subdirectory)

### Vercel

1. Import your repository
2. Configure:
   - **Framework Preset**: SvelteKit
   - **Output Directory**: `build`
   - **Root Directory**: `svelte-app` (if in a subdirectory)

### Any Static Host

The `build` directory contains static files that can be deployed to any web server. Just copy the contents to your web root.

## Project Structure

```
svelte-app/
├── src/
│   ├── lib/
│   │   ├── data.ts      # Data loading utilities
│   │   └── types.ts     # TypeScript type definitions
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.ts
│   │   ├── +page.server.ts  # Server-side file listing
│   │   └── +page.svelte     # Main application
│   ├── app.css          # Global styles
│   ├── app.d.ts
│   └── app.html
├── static/
│   ├── data/            # Thread JSON files go here
│   │   └── channel_data.json
│   ├── .nojekyll        # Prevents Jekyll processing on GitHub Pages
│   └── favicon.svg
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Pages deployment workflow
├── svelte.config.js
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## License

MIT
