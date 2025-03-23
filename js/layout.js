/**
 * Controls content layout and visual presentation
 * Implements a state machine for fade behaviors
 */
import { DOMUtils, StateUtils } from './utils.js';

export class LayoutManager {
    constructor() {
        // Configuration
        this.FADE_DELAY = 40000;        // 40 seconds for content fade
        this.UI_FADE_DELAY = 2000;      // 2 seconds for UI controls fade
        
        // Define states
        this.fadeStates = ['default', 'usage', 'fade-out', 'wallpaper'];
        
        // DOM selectors (cached for performance)
        this.contentSelector = '#content';
        this.buttonSelector = '.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn, .permalink-btn';
        
        // State tracking
        this.fadeState = 'default';
        this.cleanupFunctions = [];
    }

    // Content formatting methods
    formatContent(item) {
        if (!item) return '';
        
        // Handle heading style specially
        if (item.style === "heading") {
            return this.formatHeading(item.title);
        }
        
        // Start with the title if present
        let content = item.title && item.style !== "heading" 
            ? `<h2>${item.title}</h2>` 
            : '';
            
        // Add description if present
        if (item.description) {
            // Apply link substitution if available
            const description = item.processedLinks 
                ? this.substituteLinks(item.description, item.processedLinks) 
                : item.description;
                
            content += `<p class="description">${description}</p>`;
        }
        
        // Add code block if present
        if (item.code) {
            content += this.formatCode(item.code);
        }
        
        // Add paragraphs if present
        if (item.paragraphs) {
            content += this.formatParagraphs(item.paragraphs);
        }
        
        // Format based on content type
        if (item.block) {
            return this.wrapContent(content + this.formatBlock(item.block, item.processedLinks));
        }
        
        if (item.list) {
            return this.wrapContent(content + this.formatList(item.list, false, item.processedLinks));
        }
        
        if (item.numberedList) {
            return this.wrapContent(content + this.formatList(item.numberedList, true, item.processedLinks));
        }
        
        if (item.table) {
            return this.wrapContent(content + this.formatTable(this.processTableLinks(item.table, item.processedLinks)));
        }
        
        // Default case - just wrap the title and any new elements
        return this.wrapContent(content);
    }
    
    formatCode(code) {
        const codeItems = Array.isArray(code) ? code : [code];
        return `<div class="code-block">${codeItems
            .map(item => item === "" ? "\n" : `<code>${item}</code>`)
            .join('')}</div>`;
    }
    
    formatParagraphs(paragraphs) {
        return Array.isArray(paragraphs) 
            ? paragraphs.map(p => `<p class="content-paragraph">${p}</p>`).join('\n')
            : `<p class="content-paragraph">${paragraphs}</p>`;
    }
    
    // Helper methods for content formatting
    wrapContent(content) {
        return `<div class="flex-wrap">${content}</div>`;
    }
    
    formatHeading(title) {
        return `<div style="width:100%; text-align:center; margin-bottom:1.5rem; flex-basis:100%;">
            <h1>${title}</h1>
        </div>`;
    }
    
    formatBlock(blocks, linkMap) {
        if (linkMap && Object.keys(linkMap).length > 0) {
            return blocks.map(text => 
                `<p class="block-text">${this.substituteLinks(text, linkMap)}</p>`
            ).join('');
        }
        
        return blocks.map(text => `<p class="block-text">${text}</p>`).join('');
    }
    
    formatList(items, isNumbered, linkMap) {
        const tag = isNumbered ? 'ol' : 'ul';
        
        // Apply link substitution if available
        let listItems;
        if (linkMap && Object.keys(linkMap).length > 0) {
            listItems = items.map(item => 
                `<li>${this.substituteLinks(item, linkMap)}</li>`
            ).join('');
        } else {
            listItems = items.map(item => `<li>${item}</li>`).join('');
        }
        
        return `<${tag}>${listItems}</${tag}>`;
    }
    
    formatTable(tableData) {
        const headers = tableData.headers.map(h => `<th>${h}</th>`).join('');
        const rows = tableData.rows.map(row => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');
        
        return `
            <table>
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    
    // Process table cells for link substitution
    processTableLinks(table, linkMap) {
        if (!linkMap || Object.keys(linkMap).length === 0) {
            return table;
        }
        
        // Create a deep copy to avoid modifying the original
        const processedTable = {
            headers: [...table.headers],
            rows: table.rows.map(row => [...row])
        };
        
        // Process each cell in each row
        processedTable.rows = processedTable.rows.map(row => 
            row.map(cell => this.substituteLinks(cell, linkMap))
        );
        
        return processedTable;
    }
    
    // Substitute link tokens in text content
    substituteLinks(text, linkMap) {
        if (!text || !linkMap || Object.keys(linkMap).length === 0) {
            return text;
        }
        
        // Replace all tokens with their corresponding links
        let result = text;
        Object.entries(linkMap).forEach(([token, linkData]) => {
            const regex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const title = linkData.hover ? ` title="${linkData.hover}"` : '';
            const linkHtml = `<a href="${linkData.url}" target="_blank" class="content-link" rel="noopener noreferrer"${title}>${linkData.display}</a>`;
            result = result.replace(regex, linkHtml);
        });
        
        return result;
    }

    // Fade state management
    initFadeToggle(storage) {
        // Get saved state or use default
        this.fadeState = storage.getFadeState();
        
        // Set up toggle button
        const fadeToggleBtn = DOMUtils.getElement('fadeToggleBtn');
        if (!fadeToggleBtn) return;
        
        this.updateFadeButtonState(fadeToggleBtn);
        this.applyFadeState();
        
        // Set up click handler
        fadeToggleBtn.addEventListener('click', () => {
            this.fadeState = StateUtils.cycleState(this.fadeState, this.fadeStates);
            storage.setFadeState(this.fadeState);
            
            this.updateFadeButtonState(fadeToggleBtn);
            this.applyFadeState();
        });
    }
    
    updateFadeButtonState(button) {
        // Reset and apply current state class
        button.className = 'fade-toggle-btn';
        button.classList.add(this.fadeState);
        
        // Set descriptive title
        const titles = {
            'default': 'Default Mode: UI fades in/out on hover',
            'usage': 'Usage Mode: Always visible',
            'fade-out': 'Fade-Out Mode: Content fades after 40s',
            'wallpaper': 'Wallpaper Mode: All elements fade away after 40s'
        };
        
        button.title = titles[this.fadeState] || `Fade Mode: ${this.fadeState}`;
    }
    
    applyFadeState() {
        // Clean up previous state
        this.cleanupState();
        
        // Get DOM elements
        const contentDiv = DOMUtils.getElement('content');
        const buttons = DOMUtils.getElements(this.buttonSelector);
        
        // Reset state
        this.resetElementStates(contentDiv, buttons);
        
        // Apply current state
        contentDiv.classList.add(this.fadeState);
        DOMUtils.applyToAll(buttons, btn => btn.classList.add(this.fadeState));
        
        // Apply state-specific behavior
        switch (this.fadeState) {
            case 'default':
                this.applyDefaultState(buttons);
                break;
            case 'usage':
                this.applyUsageState(buttons);
                break;
            case 'fade-out':
                this.applyFadeOutState('0.3');
                break;
            case 'wallpaper':
                this.applyFadeOutState('0');
                break;
        }
    }
    
    resetElementStates(contentDiv, buttons) {
        // Remove all state classes
        contentDiv.classList.remove(...this.fadeStates);
        
        // Reset buttons
        DOMUtils.applyToAll(buttons, btn => {
            btn.classList.remove(...this.fadeStates);
            btn.style.opacity = '1';
        });
        
        // Reset content opacity
        contentDiv.style.opacity = '1';
    }
    
    // State implementations
    applyDefaultState(buttons) {
        // Initially hide buttons
        DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '0');
        
        // Show on mouse movement
        const handleMouseMove = () => {
            if (this.fadeState !== 'default') return;
            
            // Show buttons
            DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '1');
            
            // Set timeout to hide buttons after delay
            clearTimeout(this.uiFadeTimeout);
            this.uiFadeTimeout = setTimeout(() => {
                if (this.fadeState === 'default') {
                    DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '0');
                }
            }, this.UI_FADE_DELAY);
        };
        
        // Set up event listener
        document.addEventListener('mousemove', handleMouseMove);
        
        // Register for cleanup
        this.registerCleanup(() => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(this.uiFadeTimeout);
        });
    }
    
    applyUsageState(buttons) {
        // Always show buttons in usage mode
        const opacity = getComputedStyle(document.documentElement)
            .getPropertyValue('--ui-usage-opacity').trim() || '1';
            
        DOMUtils.applyToAll(buttons, btn => btn.style.opacity = opacity);
    }
    
    applyFadeOutState(targetOpacity) {
        const contentDiv = DOMUtils.getElement('content');
        const buttons = DOMUtils.getElements(this.buttonSelector);
        let lastActivityTime = Date.now();
        
        // Show everything on activity
        const handleActivity = () => {
            lastActivityTime = Date.now();
            contentDiv.style.opacity = '1';
            DOMUtils.applyToAll(buttons, btn => btn.style.opacity = '1');
        };
        
        // Check for inactivity and fade if inactive
        const checkInactivity = () => {
            if (this.fadeState !== 'fade-out' && this.fadeState !== 'wallpaper') return;
            
            const inactiveTime = Date.now() - lastActivityTime;
            if (inactiveTime >= this.FADE_DELAY) {
                contentDiv.style.opacity = targetOpacity;
                DOMUtils.applyToAll(buttons, btn => btn.style.opacity = targetOpacity);
            }
            
            this.fadeTimeout = setTimeout(checkInactivity, 1000);
        };
        
        // Set up handlers
        document.addEventListener('mousemove', handleActivity);
        this.fadeTimeout = setTimeout(checkInactivity, 1000);
        
        // Register for cleanup
        this.registerCleanup(() => {
            document.removeEventListener('mousemove', handleActivity);
            clearTimeout(this.fadeTimeout);
        });
    }
    
    // Cleanup management
    registerCleanup(cleanupFn) {
        this.cleanupFunctions.push(cleanupFn);
    }
    
    cleanupState() {
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
    }

    // Permalink button update
    updatePermalinkButton(permalinkData) {
        if (!permalinkData) return;
        
        const permalinkBtn = document.getElementById('permalinkBtn');
        if (permalinkBtn) {
            permalinkBtn.href = permalinkData.url;
            
            // Set descriptive title
            const title = permalinkData.fileName 
                ? `Permalink to: ${permalinkData.fileName}` 
                : 'Permalink to this page';
                
            permalinkBtn.title = title;
            
            // Ensure button is visible
            permalinkBtn.style.display = 'flex';
        }
    }
}
