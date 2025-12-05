# AGENTS.md

This file provides context for AI coding agents working on this project.

## Project Overview

Infrahub Q&A Viewer is a static web application for browsing and searching Discord forum threads. It displays threads from JSON files with search, tag filtering, and message formatting.

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5 (using runes: `$state`, `$effect`, `$props`)
- **Styling**: Tailwind CSS 3
- **Language**: TypeScript
- **Build**: Vite 7
- **Adapter**: `@sveltejs/adapter-static` for static site generation
- **Deployment**: GitHub Pages, Cloudflare Pages, or any static host

## Project Structure

```
svelte-app/
├── src/
│   ├── lib/
│   │   ├── data.ts          # Data loading functions
│   │   └── types.ts         # TypeScript interfaces
│   ├── routes/
│   │   ├── +layout.svelte   # Root layout
│   │   ├── +layout.ts       # SSR/prerender config
│   │   ├── +page.server.ts  # Server-side data loading
│   │   └── +page.svelte     # Main application page
│   ├── app.css              # Global styles (Tailwind)
│   ├── app.d.ts             # SvelteKit type declarations
│   └── app.html             # HTML template
├── static/
│   ├── data/                # Thread JSON files
│   │   └── channel_data.json
│   ├── .nojekyll
│   └── favicon.svg
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages deployment
├── svelte.config.js
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Key Files

### `src/routes/+page.svelte`
Main application component containing:
- Thread list sidebar (resizable)
- Search input
- Tag filter
- Message display area
- Message formatting (code blocks, links, bold, italic)

### `src/lib/data.ts`
Data loading utilities:
- `loadThreadsProgressively()` - Loads threads in parallel with progress callback
- `loadAllThreads()` - Loads all threads at once
- `searchThreads()` - Filters threads by search query
- `loadChannelData()` - Loads channel metadata and tags
- `buildTagMap()` - Creates tag lookup map

### `src/lib/types.ts`
TypeScript interfaces for:
- `ThreadData` - Thread with messages
- `Thread` - Thread metadata
- `Message` - Individual message
- `Author` - Message author
- `ChannelData` - Channel with available tags
- `AvailableTag` - Tag definition

### `src/routes/+page.server.ts`
Server-side file listing - reads `static/data/` directory to get thread files dynamically.

## Coding Conventions

### Svelte 5 Runes
This project uses Svelte 5 runes syntax:
```svelte
<script lang="ts">
  let count = $state(0);           // Reactive state
  let doubled = $derived(count * 2); // Derived values
  let { data } = $props();         // Component props

  $effect(() => {                  // Side effects
    console.log(count);
  });
</script>
```

### Styling
- Use Tailwind CSS utility classes
- Dark theme with gray-800/900 backgrounds
- Custom scrollbar styling in `+page.svelte` `<style>` block
- Tag colors generated from hash of tag ID

### Data Fetching
- Uses `$app/paths` base for all fetch URLs to support deployment subpaths
- Progressive loading pattern for better UX
- Files loaded in parallel with `Promise.all`

## Common Tasks

### Adding a New Feature
1. Update types in `src/lib/types.ts` if needed
2. Add data loading logic to `src/lib/data.ts`
3. Update UI in `src/routes/+page.svelte`
4. Test with `npm run dev`
5. Build with `npm run build`

### Modifying the UI
- Main layout is in `+page.svelte`
- Uses flexbox layout with resizable sidebar
- Responsive considerations: sidebar has min/max width constraints

### Adding New Data Fields
1. Update interfaces in `types.ts`
2. Update data loading in `data.ts` if processing needed
3. Display in `+page.svelte`

## Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Build for GitHub Pages (with base path)
BASE_PATH=/repo-name npm run build
```

## Testing Changes

1. Run dev server: `npm run dev`
2. Check browser at `http://localhost:5173`
3. Verify build works: `npm run build`
4. Preview build: `npm run preview`

## Data Format Notes

- Thread data is stored in `data.zip` at the project root
- The `prebuild` script extracts `data.zip` to `static/data/`
- Each JSON file is an array with one ThreadData object
- `channel_data.json` contains tag definitions
- Files are discovered dynamically at build time via `+page.server.ts`
- `static/data/` is gitignored (extracted from zip during build)

## Known Patterns

### Message Formatting
The `formatMessageContent()` function in `+page.svelte`:
1. Extracts code blocks and inline code first (protects from formatting)
2. Escapes HTML
3. Converts URLs to links
4. Applies bold/italic formatting
5. Restores code blocks

### Tag Filtering
- Multiple tags can be selected (AND filter)
- Tags stored in `selectedTags` Set
- Filtering happens in `$effect` block combining search and tags

### Progressive Loading
- `loadThreadsProgressively()` fires callback as each thread loads
- Threads sorted by creation date (newest first)
- Loading spinner shown while `loading` state is true
