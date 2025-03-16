/**
 * Orchestrates content initialization and management
 * Coordinates between other managers for content operations
 * Handles application startup sequence and mode detection
 * Provides navigation and content state management
 */
export class ContentManager {
    constructor(storage, navigation, config, layout) {
        this.storage = storage;
        this.navigation = navigation;
        this.config = config;
        this.layout = layout;
    }

    async initialize() {
        try {
            const configData = await this.storage.loadJSON('config.json');
            await this.initializeMode(configData);
            this.initializeManagers(configData);
            this.setDocumentTitle(configData);
            
            await this.initializeStylesheets(configData);
            await this.initializeWallpapers(configData);
            await this.initializeContent(configData);
        } catch (error) {
            console.error('Failed to initialize:', error);
            document.getElementById("content").innerHTML = `<p>Error loading content: ${error.message}</p>`;
        }
    }

    async initializeMode(configData) {
        let isOnlineMode = false;
        
        if (configData.mode === 'detect') {
            try {
                const response = await fetch(`${configData.serverUrl}/config.json`);
                isOnlineMode = response.ok;
            } catch (error) {
                isOnlineMode = false;
            }
        } else {
            isOnlineMode = configData.mode === 'online';
        }

        this.storage.setOnlineMode(isOnlineMode);
        this.storage.setServerUrl(configData.serverUrl || '');
        this.config.setOnlineMode(isOnlineMode);
        this.config.setServerUrl(configData.serverUrl || '');
    }

    initializeManagers(configData) {
        const savedState = this.storage.getNavigationState();
        this.navigation.setState(savedState);
        this.config.setFormatContentFunction((item) => this.layout.formatContent(item));
    }

    setDocumentTitle(configData) {
        if (configData.title) {
            document.title = configData.title;
        }
    }

    async initializeStylesheets(configData) {
        const stylesheetSet = this.navigation.setStylesheetSets(Object.values(configData.stylesheets));
        if (stylesheetSet) {
            this.config.loadStylesheets(stylesheetSet);
        }
    }

    async initializeWallpapers(configData) {
        const scannedWallpapers = await this.config.scanWallpapers(configData.wallpaper);
        const currentWallpaper = this.navigation.setWallpapers(scannedWallpapers);
        if (currentWallpaper) {
            await this.config.setWallpaper(currentWallpaper);
        }
    }

    async initializeContent(configData) {
        const content = await this.storage.loadAllJSON(configData.content, this.navigation);
        if (content) {
            const formattedContent = content.map((item) => this.layout.formatContent(item)).join('');
            document.getElementById("content").innerHTML = formattedContent;
        } else {
            document.getElementById("content").innerHTML = '<p>No content files found</p>';
        }
    }

    async navigateContent(direction) {
        const currentFile = this.navigation.navigateContent(direction);
        await this.config.loadContent(currentFile, (path) => this.storage.loadJSON(path));
        this.storage.setNavigationState(this.navigation.getState());
    }

    async navigateWallpaper(direction) {
        const wallpaper = this.navigation.navigateWallpaper(direction);
        if (wallpaper) {
            await this.config.setWallpaper(wallpaper);
            this.storage.setNavigationState(this.navigation.getState());
        }
    }

    navigateStylesheet(direction) {
        const stylesheet = this.navigation.navigateStylesheet(direction);
        if (stylesheet) {
            this.config.loadStylesheets(stylesheet);
            this.storage.setNavigationState(this.navigation.getState());
        }
    }
}
