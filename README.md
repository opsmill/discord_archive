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

### Other Platforms

The `build` directory contains static files that can be deployed to any static hosting:

- **Netlify**: Drag and drop the `build` folder or connect your repository
- **Vercel**: Import your repository and set the output directory to `build`
- **Any web server**: Copy the `build` directory contents to your web root

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
