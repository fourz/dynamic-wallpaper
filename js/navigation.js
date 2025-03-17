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
            const styleIndex = this.stylesheetSets.findIndex(set => 
                set === `stylesheets/${params.get('style')}.css`
            );
            if (styleIndex !== -1) this.currentStylesheetSet = styleIndex;
        }

        if (params.has('wallpaper')) {
            const wallIndex = parseInt(params.get('wallpaper'));
            if (!isNaN(wallIndex) && wallIndex >= 0 && wallIndex < this.wallpapers.length) {
                this.currentWallpaperIndex = wallIndex;
            }
        }
    }

    // This method is being removed since we're moving the functionality to LayoutManager
    // The empty method stays as a compatibility placeholder
    async updatePermalinkAndUrl() {
        // Functionality moved to LayoutManager.updatePermalink
    }
}
