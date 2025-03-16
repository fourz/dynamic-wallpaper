export class StorageManager {
    constructor() {
        this.storage = window.localStorage;
    }

    // Fade state management
    getFadeState() {
        return this.storage.getItem('fadeToggleEnabled') === 'true';
    }

    setFadeState(enabled) {
        this.storage.setItem('fadeToggleEnabled', enabled);
    }

    // Navigation state management
    getNavigationState() {
        try {
            return JSON.parse(this.storage.getItem('navigationState')) || {};
        } catch {
            return {};
        }
    }

    setNavigationState(state) {
        this.storage.setItem('navigationState', JSON.stringify(state));
    }

    // Theme/Style preferences
    getStylePreference() {
        return this.storage.getItem('stylePreference');
    }

    setStylePreference(style) {
        this.storage.setItem('stylePreference', style);
    }

    // Clear all stored data
    clearAll() {
        this.storage.clear();
    }
}
