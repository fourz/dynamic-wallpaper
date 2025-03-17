/**
 * Manages navigation state and cycling through content, wallpapers, and stylesheets
 * Handles circular navigation through arrays of items with indices
 * Maintains current position in each collection and provides state persistence
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
            this.updateUrlParams();
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
        if (this.useUrlParameters) {
            this.updateUrlParams();
        }
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
            if (this.useUrlParameters) {
                this.updateUrlParams();
            }
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
        // Simple name match assuming /content directory
        return this.files.findIndex(file => `content/${name}.json` === file);
    }

    setIndexFromParams(params) {
        if (params.has('content')) {
            const contentParam = params.get('content');
            const index = parseInt(contentParam);
            if (!isNaN(index) && index >= 0 && index < this.files.length) {
                this.currentFileIndex = index;
            } else {
                // Simple exact match with content folder
                const nameIndex = this.findContentByName(contentParam);
                if (nameIndex !== -1) {
                    this.currentFileIndex = nameIndex;
                }
            }
        }
        
        if (params.has('style')) {
            // Simple stylesheet match without paths
            const styleParam = params.get('style');
            const styleIndex = this.stylesheetSets.findIndex(set => 
                set === `stylesheets/${styleParam}.css`
            );
            if (styleIndex !== -1) {
                this.currentStylesheetSet = styleIndex;
            }
        }
    }

    updateUrlParams() {
        if (this.files.length === 0) return;
        
        const params = new URLSearchParams(window.location.search);
        // Use just the filename without extension
        const fileName = this.getCurrentFile().split('/')[1];
        params.set('content', fileName);
        
        if (this.stylesheetSets.length > 0) {
            // Use just the filename without extension
            const style = this.getCurrentStylesheetSet().split('/')[1];
            params.set('style', style);
        }
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }
}
