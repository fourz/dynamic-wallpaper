/**
 * Controls content layout and visual presentation
 * Implemented as a mathematical state machine for fade behaviors
 */
import { DOMUtils, StateUtils } from './utils.js';

export class LayoutManager {
    constructor() {
        this.FADE_DELAY = 40000;
        this.UI_FADE_DELAY = 2000;
        
        // Define fade state machine transitions (mathematical state diagram)
        this.fadeStates = ['default', 'usage', 'fade-out', 'wallpaper'];
        this.stateMachine = StateUtils.createStateMachine('default', {
            'default': { next: 'usage' },
            'usage': { next: 'fade-out' },
            'fade-out': { next: 'wallpaper' },
            'wallpaper': { next: 'default' }
        });
        
        // Cache DOM selectors for performance
        this.selectors = {
            content: '#content',
            buttons: '.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn, .permalink-btn'
        };
        
        // Cleanup handlers
        this.cleanupFunctions = [];
        this.fadeState = 'default';
    }

    // Formatting methods
    formatList(items, isNumbered = false) {
        const listType = isNumbered ? 'ol' : 'ul';
        const listItems = items.map(item => `<li>${item}</li>`).join('');
        return `<div class="flex-wrap">${'<' + listType}>${listItems}</${listType}></div>`;
    }

    formatTable(tableData) {
        const headers = tableData.headers.map(h => `<th>${h}</th>`).join('');
        const rows = tableData.rows.map(row => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');
        
        return `
            <div class="flex-wrap">
                <table>
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    formatBlock(blocks) {
        return blocks.map(text => `<p class="block-text">${text}</p>`).join('');
    }

    isUsingStylesheet(name) {
        return document.querySelector(`link[href*="${name}.css"]`) !== null;
    }

    formatContent(item) {
        let content = '';
        
        if (item.style === "heading") {
            if (this.isUsingStylesheet('small') || this.isUsingStylesheet('tiny')) {
                return `<div style="width:100%; text-align:center; margin-bottom:1.5rem; flex-basis:100%;"><h1>${item.title}</h1></div>`;
            }
            return `<div class="flex-wrap"><h1>${item.title}</h1></div>`;
        }
        
        if (item.title && item.style !== "heading") {
            content = `<h2>${item.title}</h2>`;
        }
        
        if (item.block) {
            return `<div class="flex-wrap">${content}${this.formatBlock(item.block)}</div>`;
        }
        
        if (item.list) {
            return `<div class="flex-wrap">${content}${this.formatList(item.list)}</div>`;
        }
        if (item.numberedList) {
            return `<div class="flex-wrap">${content}${this.formatList(item.numberedList, true)}</div>`;
        }
        if (item.table) {
            return `<div class="flex-wrap">${content}${this.formatTable(item.table)}</div>`;
        }
        if (item.title && !content) {
            return `<div class="flex-wrap">${content}</div>`;
        }
        return '';
    }

    // State machine-based fade toggle
    initFadeToggle(storage) {
        this.fadeState = storage.getFadeState() || 'default';
        const fadeToggleBtn = DOMUtils.getElement('fadeToggleBtn');
        
        this.updateFadeButtonState(fadeToggleBtn);
        this.applyFadeState();
        
        fadeToggleBtn.addEventListener('click', () => {
            // Use mathematical state transition
            this.fadeState = StateUtils.cycleState(this.fadeState, this.fadeStates);
            storage.setFadeState(this.fadeState);
            
            this.updateFadeButtonState(fadeToggleBtn);
            this.applyFadeState();
        });
    }

    updateFadeButtonState(button) {
        // Function composition for class manipulation
        button.className = 'fade-toggle-btn';
        button.classList.add(this.fadeState);
        
        // Map of states to descriptions (mathematical function)
        const titles = {
            'default': 'Default Mode: UI fades in/out on hover',
            'usage': 'Usage Mode: Always visible',
            'fade-out': 'Fade-Out Mode: Content fades after 40s',
            'wallpaper': 'Wallpaper Mode: All elements fade away after 40s'
        };
        
        button.title = titles[this.fadeState] || `Fade Mode: ${this.fadeState}`;
    }

    // Apply state using algebraic state machine
    applyFadeState() {
        this.cleanupState();
        
        // State implementation map (mathematical function mapping)
        const stateImplementation = {
            'default': this.applyDefaultState.bind(this),
            'usage': this.applyUsageState.bind(this),
            'fade-out': () => this.applyFadeOutState('0.3'),
            'wallpaper': () => this.applyFadeOutState('0')
        };
        
        // Apply classes to elements
        const contentDiv = DOMUtils.getElement('content');
        const buttons = DOMUtils.getElements(this.selectors.buttons);
        
        // Reset DOM state (idempotent operation)
        contentDiv.classList.remove(...this.fadeStates);
        DOMUtils.applyToAll(buttons, btn => {
            btn.classList.remove(...this.fadeStates);
            btn.style.opacity = '1';
        });
        contentDiv.style.opacity = '1';
        
        // Apply current state
        contentDiv.classList.add(this.fadeState);
        DOMUtils.applyToAll(buttons, btn => btn.classList.add(this.fadeState));
        
        // Execute state-specific logic
        if (stateImplementation[this.fadeState]) {
            stateImplementation[this.fadeState]();
        }
    }
    
    // State-specific implementations
    applyDefaultState() {
        const buttons = DOMUtils.getElements(this.selectors.buttons);
        
        // Set initial state
        DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '0');
        
        // Define mousemove handler
        const handleMouseMove = () => {
            if (this.fadeState !== 'default') return;
            
            DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '1');
            
            clearTimeout(this.uiFadeTimeout);
            this.uiFadeTimeout = setTimeout(() => {
                if (this.fadeState === 'default') {
                    DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '0');
                }
            }, this.UI_FADE_DELAY);
        };
        
        // Setup and register for cleanup
        document.addEventListener('mousemove', handleMouseMove);
        this.registerCleanup(() => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(this.uiFadeTimeout);
        });
    }
    
    applyUsageState() {
        const buttons = DOMUtils.getElements(this.selectors.buttons);
        const opacity = getComputedStyle(document.documentElement)
            .getPropertyValue('--ui-usage-opacity').trim() || '1';
            
        DOMUtils.applyToAll(buttons, btn => btn.style.opacity = opacity);
    }
    
    applyFadeOutState(targetOpacity) {
        const contentDiv = DOMUtils.getElement('content');
        const buttons = DOMUtils.getElements(this.selectors.buttons);
        
        // Track last activity time
        let lastActivityTime = Date.now();
        
        // Define handlers using pure functions
        const handleActivity = () => {
            lastActivityTime = Date.now();
            contentDiv.style.opacity = '1';
            DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '1');
        };
        
        const checkInactivity = () => {
            if (this.fadeState !== 'fade-out' && this.fadeState !== 'wallpaper') return;
            
            const inactiveTime = Date.now() - lastActivityTime;
            if (inactiveTime >= this.FADE_DELAY) {
                contentDiv.style.opacity = targetOpacity;
                DOMUtils.applyToAll(buttons, btn => btn.style.opacity = targetOpacity);
            }
            
            this.fadeTimeout = setTimeout(checkInactivity, 1000);
        };
        
        // Setup handlers
        document.addEventListener('mousemove', handleActivity);
        this.fadeTimeout = setTimeout(checkInactivity, 1000);
        
        // Register cleanup
        this.registerCleanup(() => {
            document.removeEventListener('mousemove', handleActivity);
            clearTimeout(this.fadeTimeout);
        });
    }
    
    // Cleanup management using functional approach
    registerCleanup(cleanupFn) {
        this.cleanupFunctions.push(cleanupFn);
    }
    
    cleanupState() {
        // Execute all cleanup functions
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
    }

    // Add method to update only the permalink button UI
    updatePermalinkButton(permalinkData) {
        if (!permalinkData) return;
        
        const permalinkBtn = document.getElementById('permalinkBtn');
        if (permalinkBtn) {
            permalinkBtn.href = permalinkData.url;
            permalinkBtn.title = `Permalink to: ${permalinkData.fileName}`;
        }
    }
}
