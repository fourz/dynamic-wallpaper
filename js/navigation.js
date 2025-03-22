/**
 * Handles navigation state and URL management:
 * - Local state: Offline mode with localStorage persistence
 * - URL state: Online mode with shareable permalinks
 */
export class NavigationManager {
    constructor() {
        // Core state
        this.files = [];
        this.wallpapers = [];
        this.stylesheetSets = [];
        
        // Navigation indices
        this.currentFileIndex = 0;
        this.currentWallpaperIndex = 0;
        this.currentStylesheetSet = 0;
        
        // Mode flag
        this.useUrlParameters = false;
    }

    // Mode configuration
    setUseUrlParameters(enabled) {
        this.useUrlParameters = enabled;
        if (enabled) this.updatePermalinkAndUrl();
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
        this.currentFileIndex = this.wrapIndex(
            this.currentFileIndex + direction, 
            this.files.length
        );
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
        if (!this.wallpapers.length) return null;
        
        this.currentWallpaperIndex = this.wrapIndex(
            this.currentWallpaperIndex + direction, 
            this.wallpapers.length
        );
        return this.getCurrentWallpaper();
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
        if (!this.stylesheetSets.length) return null;
        
        this.currentStylesheetSet = this.wrapIndex(
            this.currentStylesheetSet + direction, 
            this.stylesheetSets.length
        );
        return this.getCurrentStylesheetSet();
    }

    // Helper for circular array navigation
    wrapIndex(index, length) {
        return (index + length) % length;
    }

    // State persistence
    getState() {
        if (this.useUrlParameters) return {};
        
        return {
            currentFileIndex: this.currentFileIndex,
            currentWallpaperIndex: this.currentWallpaperIndex,
            currentStylesheetSet: this.currentStylesheetSet
        };
    }

    setState(state) {
        if (this.useUrlParameters) return;
        
        Object.entries(state).forEach(([key, value]) => {
            if (value !== undefined) this[key] = value;
        });
    }

    // URL parameter handling
    findContentByName(name) {
        const normalizedName = name.trim().toLowerCase();
        return this.files.findIndex(file => {
            const fileName = file.split('/').pop().replace('.json', '');
            return fileName.toLowerCase() === normalizedName;
        });
    }

    setIndexFromParams(params) {
        // Handle random content selection
        if (params.has('random') && params.get('random') === 'true') {
            this.currentFileIndex = Math.floor(Math.random() * this.files.length);
            return;
        }
        
        // Set content index
        if (params.has('content')) {
            const contentParam = params.get('content');
            const index = parseInt(contentParam);
            this.currentFileIndex = !isNaN(index) && index >= 0 && index < this.files.length
                ? index 
                : this.findContentByName(contentParam);
        }
        
        // Set style index
        if (params.has('style')) {
            this.setStyleFromParam(params.get('style'));
        }

        // Set wallpaper index
        if (params.has('wallpaper')) {
            this.setWallpaperFromParam(params.get('wallpaper'));
        }
    }

    setStyleFromParam(styleParam) {
        const styleIndex = this.stylesheetSets.findIndex(set => {
            const stylesheets = Array.isArray(set) ? set : [set];
            return stylesheets.some(sheet => 
                sheet.toLowerCase().includes(`/${styleParam.toLowerCase()}.css`)
            );
        });
        if (styleIndex !== -1) this.currentStylesheetSet = styleIndex;
    }

    setWallpaperFromParam(wallpaperParam) {
        const wallIndex = parseInt(wallpaperParam);
        if (!isNaN(wallIndex) && wallIndex >= 0 && wallIndex < this.wallpapers.length) {
            this.currentWallpaperIndex = wallIndex;
            return;
        }
        
        const wallpaperIndex = this.wallpapers.findIndex(wall => 
            wall.toLowerCase().includes(wallpaperParam.toLowerCase())
        );
        if (wallpaperIndex !== -1) this.currentWallpaperIndex = wallpaperIndex;
    }

    // Permalink generation
    updatePermalinkAndUrl() {
        if (!this.files?.length) return null;
        
        try {
            const params = new URLSearchParams();
            const currentFile = this.getCurrentFile();
            const fileName = currentFile?.split('/').pop().replace('.json', '') || '';
            
            const stylesetName = this.getStylesetName();
            
            this.setUrlParams(params, fileName, stylesetName);
            const urlWithParams = this.createPermalinkUrl(params);
            
            if (this.useUrlParameters) {
                window.history.replaceState({}, '', urlWithParams);
            }
            
            return { url: urlWithParams, fileName };
            
        } catch (error) {
            console.error("Failed to update permalink URL:", error);
            return null;
        }
    }

    getStylesetName() {
        if (!window.configData?.stylesheets) return '';
        return Object.keys(window.configData.stylesheets)[this.currentStylesheetSet] || '';
    }

    setUrlParams(params, fileName, stylesetName) {
        params.set('content', fileName);
        if (stylesetName) params.set('styleset', stylesetName);
        params.set('wallpaper', this.currentWallpaperIndex.toString());
    }

    createPermalinkUrl(params) {
        const baseUrl = window.location.protocol === 'file:'
            ? `file:///${window.location.pathname.replace(/^\//, '')}`
            : `${window.location.origin}${window.location.pathname}`;
            
        return `${baseUrl}?${params.toString()}`;
    }
}
