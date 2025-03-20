# Dynamic Wallpaper

An extensible library of reference guides and simple wallpaper tool powered by LLM workflows.

## Overview

Originally designed as a simple wallpaper app, Dynamic Wallpaper has evolved into a mini reference library.

### Purpose
- Originally a simple wallpaper app
- Expanded into a comprehensive reference library

### Branch Information

#### Main Branch
- Original implementation with basic functionality
- Standard desktop update configuration

#### Master Branch
- Enhanced local file access handling
- Improved error logging and troubleshooting
- Extended configuration options
- LLM-based documentation system
- Expanded reference library capabilities

## Features

- **Dynamic Wallpaper Updates:** Automatic changes based on intervals/triggers
- **Cross-Platform Support:** Windows, macOS, Linux compatibility
- **Browser Compatibility:** Local file access solutions
- **Customizable Settings:** Flexible configuration options
- **Enhanced Logging:** Detailed error tracking
- **LLM Documentation:** Self-documenting workflows
- **Fade System:** Multiple fade modes for content and UI elements
- **Permalink Support:** Bookmarkable URLs for sharing specific content
- **Responsive Design:** Multiple stylesheet options for different screen sizes
- **Local Storage:** Remembers user preferences and navigation state

## Installation

### Prerequisites
- Python 3.x (or Node.js)
- Required dependencies

### Setup Steps
```bash
git clone -b master https://github.com/fourz/dynamic-wallpaper.git
cd dynamic-wallpaper

# Python installation
pip install -r requirements.txt

# Or Node.js installation
npm install
```

## Configuration

### Basic Setup
1. Place new wallpapers in images/wallpaper/ directory
2. Setup guides in config.json
3. Setup wallpapers in config.json

## Usage

### Fade System Modes
- **Default Mode:** UI elements fade in/out on hover
- **Usage Mode:** All elements remain visible
- **Fade-Out Mode:** Content fades after 40s of inactivity
- **Wallpaper Mode:** All elements fade away after 40s

### Navigation
- Use left/right arrows to browse content
- Wallpaper controls at bottom of screen
- Style controls for changing text size
- Fade toggle button in top-left corner
- Permalink button in top-right corner

### Bookmarkable URLs
Share specific content by:
1. Navigating to desired content
2. Clicking permalink button
3. Using generated URL with parameters:
   - content: Specific guide to display
   - styleset: Text size preference
   - wallpaper: Background image index

### Tested Environments
- ✅ Local Windows File (Offline)
- ✅ Rebex Tiny Web Server (Online)
- ⚠️ Untested: IIS, Apache, Python HTTP Server

### Running the Application

#### Online Mode (Browser)
1. Host files on a web server:
```bash
# Python HTTP Server
python -m http.server 8000

# Node.js HTTP Server
npx http-server
```
2. Access via `http://localhost:8000`
3. URLs will be bookmarkable
4. File access restrictions are avoided

#### Offline Mode (Browser)
1. Direct file access:
   - Open `index.html` directly in browser
   - Example: `file:///c:/tools/dynamic-wallpaper/index.html`
2. Browser-specific setup may be needed:
   - **Chrome/Edge:** Use `--allow-file-access-from-files` flag
   - **Firefox:** Set `privacy.file_unique_origin` to false in about:config
   - **Safari:** Enable local file access in Develop menu

## Troubleshooting

### MS Edge Issues
- Verify local server status
- Check browser flags

### General Issues
- Review application logs
- Validate configuration

## Contributing

1. Fork repository
2. Create feature branch
3. Submit detailed PR

## License

MIT License - See LICENSE file

---

**Note:** For detailed configuration options and advanced setup, refer to the documentation.

