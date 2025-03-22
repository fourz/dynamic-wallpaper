/**
 * Orchestrates content initialization and management
 * Controls page title behavior:
 * - Bookmarkable URLs: Use heading title from content
 * - Regular browsing: Use catalog title from config.json
 */
import { DOMUtils, URLUtils, ErrorUtils } from './utils.js';

export class ContentManager {
    constructor(storage, navigation, config, layout) {
        this.storage = storage;
        this.navigation = navigation;
        this.config = config;
        this.layout = layout;
        
        // Pre-calculate constants to avoid repeated computation
        this.UI_ELEMENTS = ['.nav-btn', '.wall-btn', '.style-btn', '.fade-toggle-btn', '.permalink-btn'];
        this.URL_PARAMS = ['random', 'content', 'styleset', 'wallpaper'];
    }

    async initialize() {
        try {
            const configData = await this.storage.loadJSON('config.json');
            window.configData = configData;
            
            await this.initializeMode(configData);
            
            const params = new URLSearchParams(window.location.search);
            
            // determine URL parameter mode
            const hasUrlParams = URLUtils.hasAnyParams(params, this.URL_PARAMS);
            
            this.navigation.setUseUrlParameters(hasUrlParams);
            
            if (hasUrlParams) {
                this.hideNavigationElements();
            }
            
            // Initialize subsystems in parallel where possible
            await Promise.all([
                this.initializeContent(configData),
                this.initializeStyleAndWallpaper(configData, params)
            ]);
            
        } catch (error) {
            console.error('Failed to initialize:', error);
            DOMUtils.getElement("content").innerHTML = `<p>Error loading content: ${error.message}</p>`;
        }
    }
    
    // Optimized initialization with parallelization
    async initializeStyleAndWallpaper(configData, params) {
        // Run these operations in parallel for efficiency
        const [stylesInitialized, wallpapersInitialized] = await Promise.all([
            this.initializeStylesheets(configData),
            this.initializeWallpapers(configData)
        ]);
        
        // Sequential operations that depend on the parallel results
        this.initializeManagers(configData);
        this.setDocumentTitle(configData);
        
        // Handle URL parameters if in URL mode
        if (this.navigation.useUrlParameters) {
            this.navigation.setIndexFromParams(params);
        }
        
        return stylesInitialized && wallpapersInitialized;
    }

    hideNavigationElements() {
        // Use DOM utility for more concise operation
        this.UI_ELEMENTS.forEach(selector => {
            DOMUtils.setStyleForAll(selector, 'visibility', 'hidden');
        });
    }

    async initializeMode(configData) {
        // Simple protocol check for online/offline mode
        const isOnlineMode = !window.location.protocol.startsWith('file:');
        
        // Setup permalink using composition
        const permalinkBtn = DOMUtils.getElement('permalinkBtn');
        if (permalinkBtn) {
            const baseUrl = URLUtils.getBaseUrl();
            const defaultParams = {
                content: 'how_to_use_this_guide',
                styleset: 'set1',
                wallpaper: '0'
            };
            permalinkBtn.href = URLUtils.createPermalink(baseUrl, defaultParams);
        }

        // Set mode in all subsystems
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
        const params = new URLSearchParams(window.location.search);
        const requestedSet = params.get('styleset');
        
        // Create array of stylesheet sets from config
        const stylesheetSets = Object.entries(configData.stylesheets).map(([key, value]) => ({
            key,
            sheets: Array.isArray(value) ? value : [value]
        }));
        
        // If styleset specified in URL, find and use it
        if (requestedSet && stylesheetSets.some(set => set.key === requestedSet)) {
            const selectedSet = stylesheetSets.find(set => set.key === requestedSet);
            this.config.loadStylesheets(selectedSet.sheets);
            return selectedSet.sheets;
        }
        
        // Otherwise use navigation system
        const stylesheetSet = this.navigation.setStylesheetSets(
            stylesheetSets.map(set => set.sheets)
        );
        if (stylesheetSet) {
            this.config.loadStylesheets(stylesheetSet);
        }
        return stylesheetSet;
    }

    async initializeWallpapers(configData) {
        const scannedWallpapers = await this.config.scanWallpapers(configData.wallpaper);
        const currentWallpaper = this.navigation.setWallpapers(scannedWallpapers);
        if (currentWallpaper) {
            await this.config.setWallpaper(currentWallpaper);
        }
    }

    formatLinks(text) {
        if (!text) return text;
        // URL regex pattern that matches http, https, and www URLs
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        return text.replace(urlPattern, url => {
            const fullUrl = url.startsWith('www.') ? 'http://' + url : url;
            return `<a href="${fullUrl}" target="_blank" class="content-link" rel="noopener noreferrer">${url}</a>`;
        });
    }

    // Use composition for content processing
    processContentItem(item) {
        if (!item) return item;
        
        // Compose text processing functions
        const processTextContent = (content) => {
            if (!content) return content;
            return Array.isArray(content)
                ? content.map(this.formatLinks.bind(this))
                : this.formatLinks(content);
        };
        
        // Use pure function approach - create new object instead of mutating
        const processedItem = {...item};
        
        // Process all text fields with a single function
        const fieldsToProcess = ['block', 'list', 'numberedList', 'title', 'subtitle'];
        fieldsToProcess.forEach(field => {
            if (processedItem[field]) {
                processedItem[field] = processTextContent(processedItem[field]);
            }
        });
        
        // Process table cells if present
        if (processedItem.table?.rows) {
            processedItem.table = {
                ...processedItem.table,
                rows: processedItem.table.rows.map(row => 
                    row.map(cell => this.formatLinks(cell))
                )
            };
        }
        
        return processedItem;
    }

    async initializeContent(configData) {
        // Use monadic error handling pattern
        const content = await ErrorUtils.tryOperation(
            () => this.storage.loadAllJSON(configData.content, this.navigation),
            () => null
        );
        
        if (!content) {
            DOMUtils.getElement("content").innerHTML = '<p>No content files found</p>';
            return false;
        }

        // Set page title
        const headingItem = content.find(item => item.style === "heading");
        if (headingItem?.title && this.navigation.useUrlParameters) {
            document.title = headingItem.title;
        }

        // Use function composition (map + join) for content processing
        const formattedContent = content
            .map(item => this.processContentItem(item))
            .map(item => this.layout.formatContent(item))
            .join('');

        this.appendContentStyles();
        DOMUtils.getElement("content").innerHTML = formattedContent;
        return true;
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

    // Navigation using command pattern and function composition
    async handleNavigation(type, direction) {
        // Define commands as pure functions in a map (mathematical abstraction)
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

        // Use error monad pattern
        return await ErrorUtils.tryOperation(async () => {
            const action = navigationActions[type];
            if (!action) return false;

            const result = action.navigate();
            if (result) {
                await action.handle(result);
                this.updateNavigationState(result);
                return true;
            }
            return false;
        }, (error) => {
            console.error(`Navigation failed for ${type}:`, error);
            return false;
        });
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
