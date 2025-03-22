/**
 * Manages data persistence and resource loading:
 * - Local storage for app preferences
 * - File loading with online/offline support
 * - Error handling with user-friendly messages
 */
export class StorageManager {
    constructor() {
        this.storage = window.localStorage;
        this.onlineMode = false;
        this.serverUrl = '';
    }

    // Mode configuration
    setOnlineMode(mode) { this.onlineMode = mode; }
    setServerUrl(url) { this.serverUrl = url; }
    isOnlineMode() { return this.onlineMode; }

    // State management
    getFadeState() {
        return this.storage.getItem('fadeState') || 'default';
    }

    setFadeState(state) {
        this.storage.setItem('fadeState', state);
    }

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

    getStylePreference() {
        return this.storage.getItem('stylePreference');
    }

    setStylePreference(style) {
        this.storage.setItem('stylePreference', style);
    }

    clearAll() {
        this.storage.clear();
    }

    // Resource loading
    getResourcePath(path) {
        if (!path) return path;
        const cleanPath = path.replace(/^\/+/, '');
        return this.onlineMode ? `${this.serverUrl}/${cleanPath}` : cleanPath;
    }

    async loadJSON(path) {
        if (!path) throw new Error('No content path specified');
        
        try {
            const fullPath = this.getResourcePath(path);
            const response = await fetch(fullPath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return JSON.parse(await response.text());
        } catch (error) {
            console.error(`Failed to load ${path}:`, error);
            
            if (error.message.includes('Access') || error.message.includes('CORS')) {
                throw new Error(this.getErrorMessage(path));
            }
            
            throw error;
        }
    }

    async loadAllJSON(pattern, navigation) {
        if (!pattern) throw new Error('No content pattern specified');

        // Get file list
        const files = Array.isArray(pattern) ? pattern :
            pattern.includes('*') ? this.getAvailableFiles() :
            [pattern];

        if (!files.length) throw new Error('No content files found');
        
        // Initialize navigation
        navigation.setFiles(files);
        
        // Handle URL parameters if in URL mode
        if (navigation.useUrlParameters) {
            const params = new URLSearchParams(window.location.search);
            if (params.has('content')) {
                navigation.setIndexFromParams(params);
            }
        }
        
        // Load selected content
        const selectedFile = navigation.getCurrentFile();
        if (!selectedFile) throw new Error('No content file selected');
        
        return await this.loadJSON(selectedFile);
    }

    // Resource scanning
    getAvailableFiles() {
        return [
            'content/java_reference.json',
            'content/css_guide.json',
            'content/bootstrap_reference.json'
        ];
    }

    getStylesheetSet(configData, setKey) {
        if (!configData?.stylesheets || !setKey) return null;
        const set = configData.stylesheets[setKey];
        return set ? (Array.isArray(set) ? set : [set]) : null;
    }

    // Error handling
    getErrorMessage(path) {
        return `Error loading ${path}. Choose a solution:\n\n` +
            `1. Run a local server (Recommended):\n` +
            `   python -m http.server 8000\n` +
            `   Open: http://localhost:8000\n\n` +
            `2. Chrome/Edge:\n` +
            `   Add --allow-file-access-from-files flag\n\n` +
            `3. Firefox:\n` +
            `   Set privacy.file_unique_origin to false in about:config\n\n` +
            `4. VS Code:\n` +
            `   Use "Live Server" extension\n\n` +
            `5. Node.js:\n` +
            `   Use: npm install -g http-server`;
    }
}
