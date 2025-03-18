/**
 * Application orchestrator using:
 * - Dependency injection: Components receive their dependencies
 * - Command pattern: Actions encapsulated as first-class functions
 * - Event delegation: Centralized event handling
 */
import { NavigationManager } from './navigation.js';
import { StorageManager } from './storage.js';
import { ConfigManager } from './config.js';
import { LayoutManager } from './layout.js';
import { ContentManager } from './content.js';
import { DOMUtils } from './utils.js';

export class Application {
    constructor() {
        // Initialize components in dependency order
        this.navigation = new NavigationManager();
        this.storage = new StorageManager();
        this.config = new ConfigManager();
        this.layout = new LayoutManager();
        
        // Inject dependencies using composition
        this.content = new ContentManager(
            this.storage, 
            this.navigation, 
            this.config, 
            this.layout
        );
        
        // Map UI actions to commands for event handling
        this.commands = {
            // Navigation commands use curried functions for direction
            'prevBtn': () => this.content.navigateContent(-1),
            'nextBtn': () => this.content.navigateContent(1),
            'prevWallBtn': () => this.content.navigateWallpaper(-1),
            'nextWallBtn': () => this.content.navigateWallpaper(1),
            'prevStyleBtn': () => this.content.navigateStylesheet(-1),
            'nextStyleBtn': () => this.content.navigateStylesheet(1)
        };
    }
    
    async initialize() {
        // Bootstrap application in defined order
        await this.content.initialize();
        
        // Wire up UI using command pattern
        Object.entries(this.commands).forEach(([id, command]) => {
            const element = DOMUtils.getElement(id);
            if (element) {
                element.addEventListener('click', async () => await command());
            }
        });
        
        // Initialize UI state management
        this.layout.initFadeToggle(this.storage);
        
        return true;
    }
}
