/**
 * Handles persistent storage and file loading operations
 * Manages localStorage for preferences and navigation state
 * Provides file access and error handling for JSON content
 * Controls online/offline mode configuration
 */
export class StorageManager {
    constructor() {
        this.storage = window.localStorage;
        this.onlineMode = false;
        this.serverUrl = '';
    }

    // Fade state management
    getFadeState() {
        return localStorage.getItem('fadeState') || 'default';
    }

    setFadeState(state) {
        localStorage.setItem('fadeState', state);
    }

    // Navigation state management
    getNavigationState() {
        try {
            return JSON.parse(this.storage.getItem('navigationState')) || {};
        } catch {
            return {};
        }
    }

    setNavigationState(state) {
        this.storage.setItem('navigationState', JSON.stringify(state));
    }

    // Theme/Style preferences
    getStylePreference() {
        return this.storage.getItem('stylePreference');
    }

    setStylePreference(style) {
        this.storage.setItem('stylePreference', style);
    }

    // Clear all stored data
    clearAll() {
        this.storage.clear();
    }

    setOnlineMode(mode) {
        this.onlineMode = mode;
    }

    setServerUrl(url) {
        this.serverUrl = url;
    }

    getAvailableFiles() {
        return [
            'content/java_reference.json',
            'content/css_guide.json',
            'content/bootstrap_reference.json'
        ];
    }

    getAvailableWallpapers(pattern) {
        if (Array.isArray(pattern)) {
            return pattern;
        }
        
        if (typeof pattern === 'string') {
            if (pattern.includes('*')) {
                const extension = pattern.split('*.')[1];
                const wallpapers = [
                    `images/wallpaper/wallpaper1.${extension}`,
                    `images/wallpaper/wallpaper2.${extension}`,
                    `images/wallpaper/wallpaper3.${extension}`
                ];
                return wallpapers.filter(w => {
                    try {
                        const img = new Image();
                        img.src = w;
                        return true;
                    } catch {
                        return false;
                    }
                });
            }
            return [pattern];
        }
        return [];
    }

    /**
     * Creates a full resource path based on online mode
     * @param {string} path - The resource path
     * @returns {string} The properly formatted path
     */
    getResourcePath(path) {
        if (!path) return path;
        
        return this.onlineMode ? 
            `${this.serverUrl}/${path.replace(/^\/+/, '')}` : 
            path.replace(/^\/+/, '');
    }

    /**
     * Load and parse JSON file with improved error handling
     * @param {string} path - Path to JSON file
     * @returns {Promise<object>} Parsed JSON data
     */
    async loadJSON(path) {
        if (!path) throw new Error('No content path specified');
        
        try {
            const fullPath = this.getResourcePath(path);
            const response = await fetch(fullPath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.text();
            return JSON.parse(data);
        } catch (error) {
            console.error(`Failed to load ${path}:`, error);
            
            // Special handling for local file access errors
            if (error.message.includes('Access') || error.message.includes('CORS')) {
                throw new Error(this.getErrorMessage(path));
            }
            
            throw error;
        }
    }

    async loadAllJSON(pattern, navigation) {
        if (!pattern) {
            throw new Error('No content pattern specified');
        }

        // Convert all patterns to array format for consistent handling
        let files;
        
        if (Array.isArray(pattern)) {
            files = pattern;
        } else if (typeof pattern === 'string' && pattern.includes('*')) {
            files = this.getAvailableFiles();
        } else {
            files = [pattern];
        }
        
        console.log('Available content files:', files);
        
        // Set files in navigation and handle URL parameters
        const selectedFile = navigation.setFiles(files);
        
        // Apply URL parameters if present
        const params = new URLSearchParams(window.location.search);
        if (params.has('content')) {
            console.log('URL has content parameter:', params.get('content'));
            navigation.setIndexFromParams(params);
        }
        
        // Get final selected file after parameter processing
        const finalFile = navigation.getCurrentFile() || selectedFile;
        console.log('Selected content file:', finalFile);
        
        if (!finalFile) {
            throw new Error('No content file selected');
        }
        
        return await this.loadJSON(finalFile);
    }

    getErrorMessage(path) {
        return `Error loading ${path}. Choose a solution below based on your browser:\n\n` +
            `1. Run a local server (Recommended):\n` +
            `   - Open terminal in this folder\n` +
            `   - Run: python -m http.server 8000\n` +
            `   - Open: http://localhost:8000\n\n` +
            `2. Chrome/Edge:\n` +
            `   - Create shortcut to Chrome/Edge\n` +
            `   - Add flag: --allow-file-access-from-files\n` +
            `   - Right-click → Properties → Target:\n` +
            `   "C:\\Path\\chrome.exe" --allow-file-access-from-files\n\n` +
            `3. Firefox:\n` +
            `   - Type about:config in address bar\n` +
            `   - Search: privacy.file_unique_origin\n` +
            `   - Set to false\n\n` +
            `4. VS Code:\n` +
            `   - Install "Live Server" extension\n` +
            `   - Right-click HTML file → Open with Live Server\n\n` +
            `5. Node.js:\n` +
            `   - Install: npm install -g http-server\n` +
            `   - Run: http-server\n` +
            `   - Open: http://localhost:8080`;
    }

    // Keep this method for external use
    isOnlineMode() {
        return this.onlineMode;
    }

    /**
     * Get stylesheet set by key from config
     * @param {object} configData - Configuration object
     * @param {string} setKey - Key of stylesheet set to retrieve
     * @returns {string[]} Array of stylesheet paths
     */
    getStylesheetSet(configData, setKey) {
        if (!configData?.stylesheets || !setKey) return null;
        
        const set = configData.stylesheets[setKey];
        return set ? (Array.isArray(set) ? set : [set]) : null;
    }
}
