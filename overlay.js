/**
 * Entry point implementing:
 * - Lazy loading: Wait for DOM before initializing
 * - Error boundary: Top-level error handling
 * - Graceful degradation: Show error state on failure
 */
import { Application } from './js/app.js';

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const app = new Application();
        
        // Save state before page is unloaded or refreshed
        window.addEventListener('beforeunload', () => {
            // Don't save state if in permalink mode
            if (app.navigation && !app.navigation.useUrlParameters) {
                app.storage.setNavigationState(app.navigation.getState());
            }
        });
        
        await app.initialize();
    } catch (error) {
        // Provide user feedback on fatal errors
        console.error("Application failed to initialize:", error);
        document.getElementById("content").innerHTML = 
            `<p class="error">Failed to initialize application: ${error.message}</p>`;
    }
});
