/**
 * Manages navigation state and URL parameters for content, wallpapers, and stylesheets.
 * Provides two modes of operation:
 * 1. Local state: Saves navigation in localStorage for offline/normal use
 * 2. URL state: Uses URL parameters for sharable links in online mode
 */
export class NavigationManager {
    constructor() {
        this.files = [];
        this.wallpapers = [];
        this.stylesheetSets = [];
        this.currentFileIndex = 0;
        this.currentWallpaperIndex = 0;
        this.currentStylesheetSet = 0;
        this.useUrlParameters = false;
    }

    setUseUrlParameters(enabled) {
        this.useUrlParameters = enabled;
        // If enabling URL mode, immediately update URL to match current state
        if (enabled) {
            this.updatePermalinkAndUrl();
        }
    }

    // File navigation
    setFiles(files) {
        this.files = files;
        return this.getCurrentFile();
    }

    getCurrentFile() {
        return this.files[this.currentFileIndex];
    }

    navigateContent(direction) {
        this.currentFileIndex = (this.currentFileIndex + direction + this.files.length) % this.files.length;
        return this.getCurrentFile();
    }

    // Wallpaper navigation
    setWallpapers(wallpapers) {
        this.wallpapers = wallpapers;
        return this.getCurrentWallpaper();
    }

    getCurrentWallpaper() {
        return this.wallpapers[this.currentWallpaperIndex];
    }

    navigateWallpaper(direction) {
        if (this.wallpapers.length > 0) {
            this.currentWallpaperIndex = (this.currentWallpaperIndex + direction + this.wallpapers.length) % this.wallpapers.length;
            return this.getCurrentWallpaper();
        }
        return null;
    }

    // Stylesheet navigation
    setStylesheetSets(stylesheetSets) {
        this.stylesheetSets = stylesheetSets;
        return this.getCurrentStylesheetSet();
    }

    getCurrentStylesheetSet() {
        return this.stylesheetSets[this.currentStylesheetSet];
    }

    navigateStylesheet(direction) {
        if (this.stylesheetSets.length > 0) {
            this.currentStylesheetSet = (this.currentStylesheetSet + direction + this.stylesheetSets.length) % this.stylesheetSets.length;
            return this.getCurrentStylesheetSet();
        }
        return null;
    }

    // State management
    // Only save state when not using URL parameters
    getState() {
        if (this.useUrlParameters) {
            return {};
        }
        return {
            currentFileIndex: this.currentFileIndex,
            currentWallpaperIndex: this.currentWallpaperIndex,
            currentStylesheetSet: this.currentStylesheetSet
        };
    }

    // Only restore state when not using URL parameters
    setState(state) {
        if (!this.useUrlParameters) {
            if (state.currentFileIndex !== undefined) this.currentFileIndex = state.currentFileIndex;
            if (state.currentWallpaperIndex !== undefined) this.currentWallpaperIndex = state.currentWallpaperIndex;
            if (state.currentStylesheetSet !== undefined) this.currentStylesheetSet = state.currentStylesheetSet;
        }
    }

    // URL parameter handling
    findContentByName(name) {
        const normalizedName = name.trim().toLowerCase();
        return this.files.findIndex(file => {
            const fileName = file.split('/').pop().replace('.json', '');
            return fileName.toLowerCase() === normalizedName;
        });
    }

    // URL parameter parsing and application
    setIndexFromParams(params) {
        if (params.has('random') && params.get('random') === 'true') {
            this.currentFileIndex = Math.floor(Math.random() * this.files.length);
            return;
        }
        
        if (params.has('content')) {
            const index = parseInt(params.get('content'));
            this.currentFileIndex = !isNaN(index) && index >= 0 && index < this.files.length ?
                index : this.findContentByName(params.get('content'));
        }
        
        if (params.has('style')) {
            const styleParam = params.get('style');
            const styleIndex = this.stylesheetSets.findIndex(set => {
                // Handle array of stylesheets or single stylesheet
                const stylesheets = Array.isArray(set) ? set : [set];
                return stylesheets.some(sheet => 
                    sheet.toLowerCase().includes(`/${styleParam.toLowerCase()}.css`)
                );
            });
            if (styleIndex !== -1) {
                this.currentStylesheetSet = styleIndex;
            }
        }

        if (params.has('wallpaper')) {
            const wallpaperParam = params.get('wallpaper');
            // Try to parse as index first
            const wallIndex = parseInt(wallpaperParam);
            if (!isNaN(wallIndex) && wallIndex >= 0 && wallIndex < this.wallpapers.length) {
                this.currentWallpaperIndex = wallIndex;
            } else {
                // Try to find by filename if not a valid index
                const wallpaperIndex = this.wallpapers.findIndex(wall => 
                    wall.toLowerCase().includes(wallpaperParam.toLowerCase())
                );
                if (wallpaperIndex !== -1) {
                    this.currentWallpaperIndex = wallpaperIndex;
                }
            }
        }
    }

    // Improved permalink URL generation
    updatePermalinkAndUrl() {
        if (!this.files || this.files.length === 0) return null;
        
        try {
            const params = new URLSearchParams();
            const currentFile = this.getCurrentFile();
            
            // Extract filename without path and extension for cleaner URLs
            const fileName = currentFile ? currentFile.split('/').pop().replace('.json', '') : '';
            
            // Get the styleset name from config
            let stylesetName = '';
            if (window.configData && window.configData.stylesheets) {
                stylesetName = Object.keys(window.configData.stylesheets)[this.currentStylesheetSet] || '';
            }
            
            // Build parameters
            params.set('content', fileName);
            if (stylesetName) {
                params.set('styleset', stylesetName);
            }
            params.set('wallpaper', this.currentWallpaperIndex.toString());
            
            // Fix URL generation for offline mode
            let baseUrl;
            if (window.location.protocol === 'file:') {
                // Get the current file path and ensure proper formatting
                const currentPath = window.location.pathname;
                // Remove any leading slashes and convert to proper file:// URL
                baseUrl = `file:///${currentPath.replace(/^\/+/, '')}`;
            } else {
                baseUrl = window.location.origin + window.location.pathname;
            }
            
            const urlWithParams = `${baseUrl}?${params.toString()}`;
            
            // Update browser URL if in parameter mode
            if (this.useUrlParameters) {
                window.history.replaceState({}, '', urlWithParams);
            }
            
            // Always return permalink data regardless of mode
            // This ensures the permalink button is always updated
            return {
                url: urlWithParams,
                fileName: fileName
            };
        } catch (error) {
            console.error("Failed to update permalink URL:", error);
            return null;
        }
    }
}
