# Dynamic Wallpaper

A comprehensive reference library and wallpaper management tool powered by LLM workflows.

## Overview

Originally designed as a simple wallpaper app, Dynamic Wallpaper has evolved into a versatile reference library with self-documenting capabilities.

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
1. Configure wallpaper directory
2. Set update interval
3. Adjust additional parameters

### Browser Configuration
#### MS Edge Setup
- Run local server for file access
- Or configure browser flags

## Usage

### Tested Environments
- ✅ Local Windows File (Offline)
- ✅ Rebex Tiny Web Server (Online)
- ⚠️ Untested: IIS, Apache, Python HTTP Server

### Running the Application
```bash
# Python
python main.py

# Node.js
node main.js

# Local server (MS Edge)
python -m http.server 8000
```

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

