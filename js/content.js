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
            
            const params = new URLSearchParams(window.location.search);
            const hasUrlParams = params.has('content') || params.has('style');
            
            this.navigation.setUseUrlParameters(this.storage.isOnlineMode() && hasUrlParams);
            
            // Hide navigation elements if using URL parameters
            if (this.navigation.useUrlParameters) {
                this.hideNavigationElements();
            }
            
            this.initializeManagers(configData);
            this.setDocumentTitle(configData);
            
            await this.initializeStylesheets(configData);
            await this.initializeWallpapers(configData);
            
            // Handle URL parameters if in URL mode
            if (this.navigation.useUrlParameters) {
                this.navigation.setIndexFromParams(params);
            }
            
            await this.initializeContent(configData);
        } catch (error) {
            console.error('Failed to initialize:', error);
            document.getElementById("content").innerHTML = `<p>Error loading content: ${error.message}</p>`;
        }
    }

    hideNavigationElements() {
        ['nav-btn', 'wall-btn', 'style-btn', 'fade-toggle-btn', 'permalink-btn'].forEach(className => {
            const elements = document.getElementsByClassName(className);
            if (elements) {
                Array.from(elements).forEach(element => {
                    if (element) {
                        element.style.visibility = 'hidden';
                    }
                });
            }
        });
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

        // Handle permalink visibility and initial URL
        const permalinkBtn = document.getElementById('permalinkBtn');
        if (permalinkBtn) {
            permalinkBtn.style.display = isOnlineMode ? 'flex' : 'none';
            if (isOnlineMode) {
                const params = new URLSearchParams();
                params.set('content', 'how_to_use_this_guide'); // Default content
                params.set('style', 'default'); // Default style
                params.set('wallpaper', '0'); // Default wallpaper
                permalinkBtn.href = `${configData.serverUrl}?${params.toString()}`;
            }
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

    formatLinks(text) {
        // URL regex pattern that matches http, https, and www URLs
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        return text.replace(urlPattern, url => {
            const fullUrl = url.startsWith('www.') ? 'http://' + url : url;
            return `<a href="${fullUrl}" target="_blank" class="content-link" rel="noopener noreferrer">${url}</a>`;
        });
    }

    async initializeContent(configData) {
        const content = await this.storage.loadAllJSON(configData.content, this.navigation);
        if (content) {
            const formattedContent = content.map(item => {
                // Process the item's text content to detect and format links
                if (item.block) {
                    item.block = item.block.map(text => this.formatLinks(text));
                }
                if (item.list) {
                    item.list = item.list.map(text => this.formatLinks(text));
                }
                if (item.numberedList) {
                    item.numberedList = item.numberedList.map(text => this.formatLinks(text));
                }
                if (item.table) {
                    item.table.rows = item.table.rows.map(row => 
                        row.map(cell => this.formatLinks(cell))
                    );
                }
                return this.layout.formatContent(item);
            }).join('');
            
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .content-link {
                    color: #ffffff;
                    text-decoration: underline;
                    text-decoration-thickness: 1px;
                }
                .content-link:visited {
                    color: #ffffff;
                }
                .content-link:hover {
                    text-decoration-thickness: 2px;
                }
            `;
            document.head.appendChild(styleElement);
            
            document.getElementById("content").innerHTML = formattedContent;
        } else {
            document.getElementById("content").innerHTML = '<p>No content files found</p>';
        }
    }

    async navigateContent(direction) {
        const currentFile = this.navigation.navigateContent(direction);
        await this.config.loadContent(currentFile, (path) => this.storage.loadJSON(path));
        if (!this.navigation.useUrlParameters) {
            this.storage.setNavigationState(this.navigation.getState());
        }
        if (this.storage.isOnlineMode()) {
            this.navigation.updateUrlParams();
        }
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
            if (!this.navigation.useUrlParameters) {
                this.storage.setNavigationState(this.navigation.getState());
            }
            if (this.storage.isOnlineMode()) {
                this.navigation.updateUrlParams();
            }
        }
    }
}
