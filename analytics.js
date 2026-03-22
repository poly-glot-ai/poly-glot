/**
 * Poly-Glot Analytics Tracker
 * Privacy-focused analytics for tracking user interactions
 * No personal data collected - only usage patterns
 */

class PolyGlotAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.apiEndpoint = 'https://api.github.com/repos/hmoses/poly-glot/issues';
        
        // Initialize analytics
        this.init();
    }

    /**
     * Initialize analytics tracking
     */
    init() {
        // Track page view
        this.trackEvent('page_view', {
            url: window.location.href,
            referrer: document.referrer || 'direct',
            timestamp: new Date().toISOString()
        });

        // Track session duration on page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });

        console.log('📊 Poly-Glot Analytics initialized (Session ID:', this.sessionId, ')');
    }

    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Track an event
     */
    trackEvent(eventName, data = {}) {
        const event = {
            session_id: this.sessionId,
            event_name: eventName,
            timestamp: new Date().toISOString(),
            data: data
        };

        this.events.push(event);
        
        // Store in localStorage for persistence
        this.saveToLocalStorage(event);

        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('📊 Analytics Event:', eventName, data);
        }
    }

    /**
     * Track language selection
     */
    trackLanguageChange(language) {
        this.trackEvent('language_changed', {
            language: language,
            previous_language: this.currentLanguage || null
        });
        this.currentLanguage = language;
    }

    /**
     * Track category navigation
     */
    trackCategoryView(category) {
        this.trackEvent('category_viewed', {
            category: category
        });
    }

    /**
     * Track code copying
     */
    trackCodeCopy(codeType) {
        this.trackEvent('code_copied', {
            code_type: codeType
        });
    }

    /**
     * Track code analysis
     */
    trackCodeAnalysis(codeLength, commentRatio) {
        this.trackEvent('code_analyzed', {
            code_length: codeLength,
            comment_ratio: commentRatio
        });
    }

    /**
     * Track template export
     */
    trackExport(language) {
        this.trackEvent('template_exported', {
            language: language
        });
    }

    /**
     * Track favorite actions
     */
    trackFavorite(action, itemName) {
        this.trackEvent('favorite_action', {
            action: action, // 'add' or 'remove'
            item: itemName
        });
    }

    /**
     * Track search usage
     */
    trackSearch(query) {
        this.trackEvent('search_performed', {
            query_length: query.length
        });
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const duration = Date.now() - this.startTime;
        this.trackEvent('session_end', {
            duration_ms: duration,
            duration_readable: this.formatDuration(duration),
            total_events: this.events.length
        });

        // Send summary to localStorage
        this.saveSummary();
    }

    /**
     * Format duration in human-readable format
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Save event to localStorage
     */
    saveToLocalStorage(event) {
        try {
            let analytics = JSON.parse(localStorage.getItem('polyglot_analytics') || '{"events": []}');
            analytics.events.push(event);
            
            // Keep only last 100 events to prevent storage overflow
            if (analytics.events.length > 100) {
                analytics.events = analytics.events.slice(-100);
            }
            
            localStorage.setItem('polyglot_analytics', JSON.stringify(analytics));
        } catch (e) {
            console.warn('Analytics localStorage error:', e);
        }
    }

    /**
     * Save session summary
     */
    saveSummary() {
        try {
            let summaries = JSON.parse(localStorage.getItem('polyglot_analytics_summary') || '{"sessions": []}');
            
            const summary = {
                session_id: this.sessionId,
                start_time: new Date(this.startTime).toISOString(),
                end_time: new Date().toISOString(),
                duration_ms: Date.now() - this.startTime,
                event_count: this.events.length,
                languages_used: [...new Set(this.events
                    .filter(e => e.event_name === 'language_changed')
                    .map(e => e.data.language))],
                categories_viewed: [...new Set(this.events
                    .filter(e => e.event_name === 'category_viewed')
                    .map(e => e.data.category))],
                codes_copied: this.events.filter(e => e.event_name === 'code_copied').length,
                analyses_performed: this.events.filter(e => e.event_name === 'code_analyzed').length
            };
            
            summaries.sessions.push(summary);
            
            // Keep only last 50 sessions
            if (summaries.sessions.length > 50) {
                summaries.sessions = summaries.sessions.slice(-50);
            }
            
            localStorage.setItem('polyglot_analytics_summary', JSON.stringify(summaries));
        } catch (e) {
            console.warn('Analytics summary error:', e);
        }
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        try {
            const summaries = JSON.parse(localStorage.getItem('polyglot_analytics_summary') || '{"sessions": []}');
            const events = JSON.parse(localStorage.getItem('polyglot_analytics') || '{"events": []}');
            
            return {
                total_sessions: summaries.sessions.length,
                current_session_events: this.events.length,
                all_time_events: events.events.length,
                sessions: summaries.sessions
            };
        } catch (e) {
            console.warn('Get summary error:', e);
            return null;
        }
    }

    /**
     * Export analytics data
     */
    exportData() {
        const data = {
            summary: this.getSummary(),
            current_session: {
                session_id: this.sessionId,
                events: this.events
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `polyglot-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📊 Analytics data exported');
    }

    /**
     * Clear all analytics data
     */
    clearData() {
        localStorage.removeItem('polyglot_analytics');
        localStorage.removeItem('polyglot_analytics_summary');
        this.events = [];
        console.log('📊 Analytics data cleared');
    }

    /**
     * Display analytics dashboard in console
     */
    showDashboard() {
        const summary = this.getSummary();
        
        console.log('%c📊 Poly-Glot Analytics Dashboard', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
        console.log('%c═══════════════════════════════════', 'color: #7dd3fc;');
        console.log('%cTotal Sessions:', 'font-weight: bold;', summary.total_sessions);
        console.log('%cCurrent Session Events:', 'font-weight: bold;', this.events.length);
        console.log('%cAll Time Events:', 'font-weight: bold;', summary.all_time_events);
        console.log('%c═══════════════════════════════════', 'color: #7dd3fc;');
        
        if (summary.sessions.length > 0) {
            const latest = summary.sessions[summary.sessions.length - 1];
            console.log('%cLatest Session:', 'font-weight: bold;');
            console.log('  Duration:', this.formatDuration(latest.duration_ms));
            console.log('  Events:', latest.event_count);
            console.log('  Languages:', latest.languages_used.join(', ') || 'None');
            console.log('  Categories:', latest.categories_viewed.join(', ') || 'None');
            console.log('  Codes Copied:', latest.codes_copied);
            console.log('  Analyses:', latest.analyses_performed);
        }
        
        console.log('%c═══════════════════════════════════', 'color: #7dd3fc;');
        console.log('%cCommands:', 'font-weight: bold;');
        console.log('  analytics.exportData() - Export analytics data');
        console.log('  analytics.clearData() - Clear all analytics');
        console.log('  analytics.getSummary() - Get summary object');
    }
}

// Initialize analytics
const analytics = new PolyGlotAnalytics();

// Make analytics available globally for debugging
window.polyglotAnalytics = analytics;

// Expose dashboard command
window.showAnalytics = () => analytics.showDashboard();

console.log('%c💡 Tip: Type showAnalytics() to view usage statistics', 'color: #7dd3fc; font-style: italic;');
