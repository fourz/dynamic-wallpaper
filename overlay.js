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
    
    document.getElementById("prevBtn").addEventListener("click", async () => {
        await content.navigateContent(-1);
    });
    
    document.getElementById("nextBtn").addEventListener("click", async () => {
        await content.navigateContent(1);
    });
    
    document.getElementById("prevWallBtn").addEventListener("click", async () => {
        await content.navigateWallpaper(-1);
    });
    
    document.getElementById("nextWallBtn").addEventListener("click", async () => {
        await content.navigateWallpaper(1);
    });
    
    document.getElementById("prevStyleBtn").addEventListener("click", async () => {
        await content.navigateStylesheet(-1);
    });
    
    document.getElementById("nextStyleBtn").addEventListener("click", async () => {
        await content.navigateStylesheet(1);
    });
    
    layout.initFadeToggle(storage);
});
