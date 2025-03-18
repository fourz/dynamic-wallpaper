/**
 * Orchestrates content initialization and management
 * Controls page title behavior:
 * - Bookmarkable URLs: Use heading title from content
 * - Regular browsing: Use catalog title from config.json
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
            window.configData = configData;
            
            await this.initializeMode(configData);
            
            const params = new URLSearchParams(window.location.search);
            // Check for URL parameters regardless of online/offline mode
            const hasUrlParams = params.has('random') || params.has('content') || 
                               params.has('styleset') || params.has('wallpaper');
            
            // Set URL parameter mode without online mode check
            this.navigation.setUseUrlParameters(hasUrlParams);
            
            // Hide navigation elements if using URL parameters regardless of mode
            if (hasUrlParams) {
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
        
        // Determine online/offline mode through explicit config or detection
        if (configData.mode === 'detect') {
            try {
                // Test server connectivity by requesting config
                const response = await fetch(`${configData.serverUrl}/config.json`);
                isOnlineMode = response.ok;
            } catch (error) {
                isOnlineMode = false;
            }
        } else {
            isOnlineMode = configData.mode === 'online';
        }

        // Configure permalink initial state regardless of mode
        const permalinkBtn = document.getElementById('permalinkBtn');
        if (permalinkBtn) {
            const params = new URLSearchParams();
            params.set('content', 'how_to_use_this_guide');
            params.set('styleset', 'set1');
            params.set('wallpaper', '0');
            const baseUrl = window.location.protocol === 'file:' ? 
                `file:///${window.location.pathname.replace(/^\//, '')}` : 
                `${window.location.origin}${window.location.pathname}`;
            permalinkBtn.href = `${baseUrl}?${params.toString()}`;
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
        // Only set catalog title when not using bookmarkable URLs
        if (!this.navigation.useUrlParameters && configData.title) {
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

    // Simplified content processing method
    processContentItem(item) {
        const processFields = ['block', 'list', 'numberedList'];
        processFields.forEach(field => {
            if (item[field]) {
                item[field] = Array.isArray(item[field]) ? 
                    item[field].map(text => this.formatLinks(text)) : 
                    this.formatLinks(item[field]);
            }
        });
        
        if (item.table?.rows) {
            item.table.rows = item.table.rows.map(row => 
                row.map(cell => this.formatLinks(cell))
            );
        }
        return item;
    }

    async initializeContent(configData) {
        const content = await this.storage.loadAllJSON(configData.content, this.navigation);
        if (!content) {
            document.getElementById("content").innerHTML = '<p>No content files found</p>';
            return;
        }

        // Set page title based on mode
        const headingItem = content.find(item => item.style === "heading");
        if (headingItem?.title) {
            if (this.navigation.useUrlParameters) {
                // Bookmarkable URLs: use heading title
                document.title = headingItem.title;
            }
        }

        // Process content with simplified logic
        const formattedContent = content
            .map(item => this.processContentItem(item))
            .map(item => this.layout.formatContent(item))
            .join('');

        this.appendContentStyles();
        document.getElementById("content").innerHTML = formattedContent;
    }

    // Extracted content styles to separate method
    appendContentStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .content-link {
                color: #ffffff;
                text-decoration: underline;
                text-decoration-thickness: 1px;
            }
            .content-link:visited { color: #ffffff; }
            .content-link:hover { text-decoration-thickness: 2px; }
        `;
        document.head.appendChild(styleElement);
    }

    // Single method to handle all navigation updates
    async handleNavigation(type, direction) {
        const navigationActions = {
            content: {
                navigate: () => this.navigation.navigateContent(direction),
                handle: (result) => this.config.loadContent(result, path => this.storage.loadJSON(path))
            },
            wallpaper: {
                navigate: () => this.navigation.navigateWallpaper(direction),
                handle: (result) => this.config.setWallpaper(result)
            },
            stylesheet: {
                navigate: () => this.navigation.navigateStylesheet(direction),
                handle: (result) => this.config.loadStylesheets(result)
            }
        };

        try {
            const action = navigationActions[type];
            if (!action) return;

            const result = action.navigate();
            if (result) {
                await action.handle(result);
                this.updateNavigationState(result);
            }
        } catch (error) {
            console.error(`Navigation failed for ${type}:`, error);
        }
    }

    // Extracted navigation state update logic
    updateNavigationState(result) {
        if (!this.navigation.useUrlParameters) {
            this.storage.setNavigationState(this.navigation.getState());
        }
        
        const permalinkData = this.navigation.updatePermalinkAndUrl();
        if (permalinkData) {
            this.layout.updatePermalinkButton(permalinkData);
        }
    }

    // Update navigation methods to use handleNavigation
    async navigateContent(direction) {
        await this.handleNavigation('content', direction);
    }

    async navigateWallpaper(direction) {
        await this.handleNavigation('wallpaper', direction);
    }

    async navigateStylesheet(direction) {
        await this.handleNavigation('stylesheet', direction);
    }
}
