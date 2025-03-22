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
        
        // Define constants
        this.UI_ELEMENTS = ['.nav-btn', '.wall-btn', '.style-btn', '.fade-toggle-btn', '.permalink-btn'];
        this.URL_PARAMS = ['random', 'content', 'styleset', 'wallpaper'];
    }

    async initialize() {
        try {
            // Load config and set global reference
            const configData = await this.storage.loadJSON('config.json');
            window.configData = configData;
            
            // Initialize app mode (online/offline)
            await this.initializeAppMode(configData);
            
            // Handle URL parameters and state management
            await this.initializeStateManagement();
            
            // Initialize content and visual elements in parallel
            await this.initializeContentAndVisuals(configData);
            
        } catch (error) {
            console.error('Failed to initialize:', error);
            DOMUtils.getElement("content").innerHTML = `<p>Error loading content: ${error.message}</p>`;
        }
    }
    
    // Split initialization into clearer, focused methods
    async initializeAppMode(configData) {
        const isOnlineMode = !window.location.protocol.startsWith('file:');
        
        // Set up permalink button with default values
        this.setupPermalinkButton();
        
        // Configure online/offline mode in subsystems
        this.storage.setOnlineMode(isOnlineMode);
        this.storage.setServerUrl(configData.serverUrl || '');
        this.config.setOnlineMode(isOnlineMode);
        this.config.setServerUrl(configData.serverUrl || '');
    }
    
    setupPermalinkButton() {
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
    }
    
    async initializeStateManagement() {
        const params = new URLSearchParams(window.location.search);
        const hasUrlParams = URLUtils.hasAnyParams(params, this.URL_PARAMS);
        
        // Configure navigation mode based on URL parameters
        this.navigation.setUseUrlParameters(hasUrlParams);
        
        // Load saved state (only used if not in URL parameter mode)
        const savedState = this.storage.getNavigationState();
        this.navigation.setState(savedState);
        
        // Hide navigation elements in permalink mode
        if (hasUrlParams) {
            this.UI_ELEMENTS.forEach(selector => {
                DOMUtils.setStyleForAll(selector, 'visibility', 'hidden');
            });
        }
    }
    
    async initializeContentAndVisuals(configData) {
        const params = new URLSearchParams(window.location.search);
        
        // Run these operations in parallel
        await Promise.all([
            this.loadContent(configData),
            this.setupVisuals(configData, params)
        ]);
    }
    
    async loadContent(configData) {
        // Load and process content JSON
        const content = await ErrorUtils.tryOperation(
            () => this.storage.loadAllJSON(configData.content, this.navigation),
            () => null
        );
        
        if (!content) {
            DOMUtils.getElement("content").innerHTML = '<p>No content files found</p>';
            return false;
        }

        // Set page title based on content if in permalink mode
        this.updateDocumentTitle(content, configData);

        // Process and format content
        const formattedContent = this.formatContentItems(content);
        
        // Apply styles and update DOM
        this.applyContentStyles();
        DOMUtils.getElement("content").innerHTML = formattedContent;
        return true;
    }
    
    updateDocumentTitle(content, configData) {
        if (this.navigation.useUrlParameters) {
            // Use title from content in permalink mode
            const headingItem = content.find(item => item.style === "heading");
            if (headingItem?.title) {
                document.title = headingItem.title;
            }
        } else if (configData.title) {
            // Use catalog title in normal mode
            document.title = configData.title;
        }
    }
    
    formatContentItems(content) {
        return content
            .map(item => this.processContentItem(item))
            .map(item => this.layout.formatContent(item))
            .join('');
    }
    
    applyContentStyles() {
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
    
    async setupVisuals(configData, params) {
        // Set up stylesheets and wallpapers
        await Promise.all([
            this.setupStylesheets(configData),
            this.setupWallpapers(configData)
        ]);
        
        // Configure content formatting function
        this.config.setFormatContentFunction((item) => this.layout.formatContent(item));
        
        // Apply URL parameters if present
        if (this.navigation.useUrlParameters && URLUtils.hasAnyParams(params, this.URL_PARAMS)) {
            this.navigation.setIndexFromParams(params);
        }
        
        // Save state for normal navigation mode
        if (!this.navigation.useUrlParameters) {
            this.storage.setNavigationState(this.navigation.getState());
        }
        
        // Update permalink
        this.updatePermalink();
    }
    
    updatePermalink() {
        const permalinkData = this.navigation.updatePermalinkAndUrl();
        if (permalinkData) {
            this.layout.updatePermalinkButton(permalinkData);
        }
    }
    
    async setupStylesheets(configData) {
        const params = new URLSearchParams(window.location.search);
        const requestedSet = params.get('styleset');
        
        // Create stylesheet sets from config
        const stylesheetSets = Object.entries(configData.stylesheets).map(([key, value]) => ({
            key,
            sheets: Array.isArray(value) ? value : [value]
        }));
        
        // Use requested set from URL or default
        if (requestedSet && stylesheetSets.some(set => set.key === requestedSet)) {
            const selectedSet = stylesheetSets.find(set => set.key === requestedSet);
            this.config.loadStylesheets(selectedSet.sheets);
            return selectedSet.sheets;
        }
        
        // Use navigation system
        const stylesheetSet = this.navigation.setStylesheetSets(
            stylesheetSets.map(set => set.sheets)
        );
        
        if (stylesheetSet) {
            this.config.loadStylesheets(stylesheetSet);
        }
        
        return stylesheetSet;
    }
    
    async setupWallpapers(configData) {
        const wallpapers = await this.config.scanWallpapers(configData.wallpaper);
        const currentWallpaper = this.navigation.setWallpapers(wallpapers);
        
        if (currentWallpaper) {
            await this.config.setWallpaper(currentWallpaper);
        }
    }

    // Content processing
    formatLinks(text) {
        if (!text) return text;
        
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        return text.replace(urlPattern, url => {
            const fullUrl = url.startsWith('www.') ? 'http://' + url : url;
            return `<a href="${fullUrl}" target="_blank" class="content-link" rel="noopener noreferrer">${url}</a>`;
        });
    }

    processContentItem(item) {
        if (!item) return item;
        
        // Create a function to process text content
        const processText = (text) => Array.isArray(text)
            ? text.map(this.formatLinks.bind(this))
            : this.formatLinks(text);
        
        // Create a new processed item without modifying the original
        const processedItem = {...item};
        
        // Process all text fields
        ['block', 'list', 'numberedList', 'title', 'subtitle'].forEach(field => {
            if (processedItem[field]) {
                processedItem[field] = processText(processedItem[field]);
            }
        });
        
        // Process table cells
        if (processedItem.table?.rows) {
            processedItem.table = {
                ...processedItem.table,
                rows: processedItem.table.rows.map(row => row.map(this.formatLinks.bind(this)))
            };
        }
        
        return processedItem;
    }

    // Navigation methods
    async navigateContent(direction) {
        return this.navigate('content', direction);
    }

    async navigateWallpaper(direction) {
        return this.navigate('wallpaper', direction);
    }

    async navigateStylesheet(direction) {
        return this.navigate('stylesheet', direction);
    }

    // Unified navigation handler
    async navigate(type, direction) {
        const actions = {
            content: {
                navigate: () => this.navigation.navigateContent(direction),
                apply: (file) => this.config.loadContent(file, path => this.storage.loadJSON(path))
            },
            wallpaper: {
                navigate: () => this.navigation.navigateWallpaper(direction),
                apply: (wallpaper) => this.config.setWallpaper(wallpaper)
            },
            stylesheet: {
                navigate: () => this.navigation.navigateStylesheet(direction),
                apply: (stylesheets) => this.config.loadStylesheets(stylesheets)
            }
        };

        try {
            const action = actions[type];
            if (!action) return false;

            const item = action.navigate();
            if (!item) return false;
            
            await action.apply(item);
            
            // Update navigation state
            if (!this.navigation.useUrlParameters) {
                this.storage.setNavigationState(this.navigation.getState());
            }
            
            // Update permalink
            this.updatePermalink();
            
            return true;
        } catch (error) {
            console.error(`Navigation failed for ${type}:`, error);
            return false;
        }
    }
}
