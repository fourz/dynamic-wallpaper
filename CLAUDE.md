# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dynamic Wallpaper is a browser-based reference guide library. It displays structured JSON content with dynamic theming, multiple fade modes, and permalink support. Zero external dependencies - pure vanilla JavaScript ES6 modules.

## Running the Application

```bash
# Start local server (required for development)
python -m http.server 8000
# or
npx http-server

# Access at http://localhost:8000
```

No build step, no package.json, no compilation required.

## Architecture

```
overlay.js (Entry Point)
    ↓
Application (js/app.js) - Orchestrator
    ├─ NavigationManager (js/navigation.js) - State & URL params
    ├─ StorageManager (js/storage.js) - localStorage & file loading
    ├─ ConfigManager (js/config.js) - Resources & stylesheets
    ├─ LayoutManager (js/layout.js) - Content rendering & fade states
    ├─ ContentManager (js/content.js) - Initialization workflow
    └─ DOMUtils + URLUtils + StateUtils (js/utils.js) - Helpers
```

**Key Patterns:**
- Dependency injection: Components receive dependencies in constructor
- Command pattern: UI actions mapped to functions in `app.js`
- State machine: Fade system cycles through 4 states (default → usage → fade-out → wallpaper)

## Content System

Content is stored as JSON files in `content/` with this structure:

```json
[
  { "style": "heading", "title": "Page Title" },
  {
    "title": "Section",
    "description": "Text",
    "table": { "headers": [...], "rows": [[...]] },
    "code": ["line1", "line2"],
    "list": ["item1", "item2"],
    "numberedList": ["step1", "step2"],
    "processedLinks": {
      "<token>": { "url": "...", "display": "...", "hover": "..." }
    }
  }
]
```

**Adding new content:**
1. Create JSON file in `content/`
2. Add path to `config.json` → `content` array

## Configuration

`config.json` controls:
- `content`: Array of JSON file paths
- `wallpaper`: Array of background image paths
- `stylesheets`: Named sets (set1-set5) for text size presets

## URL Parameters

Permalinks use query params: `?content=git_reference&styleset=set3&wallpaper=0`
- `content`: Guide filename (without .json)
- `styleset`: set1 through set5
- `wallpaper`: Index of wallpaper image
- `random`: true for random content

## Key Files

- `overlay.js` - Entry point with error boundary
- `js/layout.js` - Content formatting, fade logic, link token substitution
- `js/content.js` - Initialization workflow, content loading
- `js/navigation.js` - State management, URL param handling
- `config.json` - Master configuration
