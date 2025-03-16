/**
 * Main application entry point
 * Initializes and coordinates all manager instances
 * Sets up event listeners for user interactions
 * Delegates operations to appropriate managers
 */
import { NavigationManager } from './js/navigation.js';
import { StorageManager } from './js/storage.js';
import { ConfigManager } from './js/config.js';
import { LayoutManager } from './js/layout.js';
import { ContentManager } from './js/content.js';

const navigation = new NavigationManager();
const storage = new StorageManager();
const config = new ConfigManager();
const layout = new LayoutManager();
const content = new ContentManager(storage, navigation, config, layout);

document.addEventListener("DOMContentLoaded", () => {
    content.initialize();
    
    // Create a single, reusable keyboard event handler
    const handleKeyboardNavigation = (event) => {
        // Check if we should ignore this event (e.g., when typing in form controls)
        if (event.target.tagName === 'INPUT' || 
            event.target.tagName === 'TEXTAREA' || 
            event.target.tagName === 'SELECT') {
            return;
        }
        
        const result = navigation.handleKeyPress(event);
        if (result !== null) {
            event.preventDefault();
            content.updateContent();
        }
    };

    // Apply keyboard event listener directly to window for global capture
    window.addEventListener('keydown', handleKeyboardNavigation);
    
    // Prevent space from scrolling the page regardless of focus
    window.addEventListener('keypress', (event) => {
        if (event.key === ' ' && 
            event.target.tagName !== 'INPUT' && 
            event.target.tagName !== 'TEXTAREA') {
            event.preventDefault();
        }
    });
    
    // Keep focus management simple - just make sure clicks don't lose keyboard navigation
    document.addEventListener('mousedown', () => {
        // Reset any focus that might interfere with keyboard navigation
        if (document.activeElement && 
            document.activeElement !== document.body &&
            document.activeElement.tagName !== 'BUTTON') {
            document.activeElement.blur();
        }
    });
    
    document.getElementById("prevBtn").addEventListener("click", () => {
        content.navigateContent(-1);
    });
    
    document.getElementById("nextBtn").addEventListener("click", () => {
        content.navigateContent(1);
    });
    
    document.getElementById("prevWallBtn").addEventListener("click", () => {
        content.navigateWallpaper(-1);
    });
    
    document.getElementById("nextWallBtn").addEventListener("click", () => {
        content.navigateWallpaper(1);
    });
    
    document.getElementById("prevStyleBtn").addEventListener("click", () => {
        content.navigateStylesheet(-1);
    });
    
    document.getElementById("nextStyleBtn").addEventListener("click", () => {
        content.navigateStylesheet(1);
    });
    
    // Add keyboard focus debugging helper if needed
    window.checkFocus = () => {
        console.log('Active element:', document.activeElement);
        console.log('Body has focus:', document.activeElement === document.body);
    };
    
    layout.initFadeToggle(storage);
    
    // Debugging helper
    window.checkKeyboardNav = () => {
        console.log('Keyboard navigation active: ', 
            !document.querySelector('input:focus, textarea:focus, select:focus'));
    };
});
