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
    getState() {
        return {
            currentFileIndex: this.currentFileIndex,
            currentWallpaperIndex: this.currentWallpaperIndex,
            currentStylesheetSet: this.currentStylesheetSet
        };
    }

    setState(state) {
        if (state.currentFileIndex !== undefined) this.currentFileIndex = state.currentFileIndex;
        if (state.currentWallpaperIndex !== undefined) this.currentWallpaperIndex = state.currentWallpaperIndex;
        if (state.currentStylesheetSet !== undefined) this.currentStylesheetSet = state.currentStylesheetSet;
    }

    handleKeyPress(event) {
        // Don't process modified key presses (like Ctrl+Arrow)
        if (event.ctrlKey || event.altKey || event.metaKey) {
            return null;
        }
        
        switch (event.key) {
            case 'ArrowLeft': 
                return this.navigateContent(-1);
            case 'ArrowRight': 
                return this.navigateContent(1);
            case 'ArrowUp': 
                return this.navigateStylesheet(1);
            case 'ArrowDown': 
                return this.navigateStylesheet(-1);
            case '+': 
            case '=': // Many keyboards require Shift for +, so = works too
                return this.navigateWallpaper(1);
            case '-': 
            case '_': // Similarly for minus
                return this.navigateWallpaper(-1);
            case ' ': 
                return this.navigateContent(1);
            case 'PageUp':
                return this.navigateContent(-1);
            case 'PageDown':
                return this.navigateContent(1);
            case 'Home':
                this.currentFileIndex = 0;
                return this.getCurrentFile();
            case 'End':
                this.currentFileIndex = this.files.length - 1;
                return this.getCurrentFile();
        }
        return null;
    }
}
