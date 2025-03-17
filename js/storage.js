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

    async loadJSON(path) {
        try {
            // Clean up path for offline mode to prevent double slashes
            const fullPath = this.onlineMode ? 
                `${this.serverUrl}/${path}` : 
                path.startsWith('/') ? path.substring(1) : path;
                
            const response = await fetch(fullPath);
            const data = await response.text();
            return JSON.parse(data);
        } catch (error) {
            console.error(`Failed to load ${path}`, error);
            const errorMessage = this.getErrorMessage(path);
            document.getElementById("content").innerText = errorMessage;
            throw error;
        }
    }

    async loadAllJSON(pattern, navigation) {
        if (Array.isArray(pattern)) {
            const files = pattern;
            console.log('Available content files:', files);
            
            // Set files in navigation system before loading default
            const firstFile = navigation.setFiles(files);
            
            // Check URL parameters after setting files array
            const params = new URLSearchParams(window.location.search);
            if (params.has('content') && this.onlineMode) {
                console.log('URL has content parameter:', params.get('content'));
                navigation.setIndexFromParams(params);
                // Use the file selected by parameter instead of default first
                const selectedFile = navigation.getCurrentFile();
                console.log('Selected content file:', selectedFile);
                return files.length > 0 ? await this.loadJSON(selectedFile) : null;
            }
            
            return files.length > 0 ? await this.loadJSON(firstFile) : null;
        }
        if (typeof pattern === 'string' && pattern.includes('*')) {
            const files = this.getAvailableFiles();
            const firstFile = navigation.setFiles(files);
            return files.length > 0 ? await this.loadJSON(firstFile) : null;
        }
        const firstFile = navigation.setFiles([pattern]);
        return await this.loadJSON(pattern);
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
}
