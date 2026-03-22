# Poly-Glot Analytics 📊

## Overview

Poly-Glot includes a privacy-focused analytics system that tracks user interactions **locally** on the client side. No data is sent to external servers - all analytics are stored in the browser's localStorage.

## Privacy First 🔒

**What we track:**
- ✅ Page views and session duration
- ✅ Language selections
- ✅ Category views
- ✅ Code copying events
- ✅ Code analysis usage
- ✅ Template exports
- ✅ Search queries (length only, not content)
- ✅ Favorite actions

**What we DON'T track:**
- ❌ Personal information
- ❌ IP addresses
- ❌ Actual code content
- ❌ Search query content (only length)
- ❌ Cookies or external tracking
- ❌ Cross-site data

## How It Works

### Automatic Tracking

Analytics automatically tracks:
1. **Page View** - When the page loads
2. **Session Duration** - How long users spend on the app
3. **User Interactions** - Language changes, category views, etc.
4. **Session End** - When the user closes/leaves the page

### Data Storage

All analytics data is stored in the browser's localStorage:
- `polyglot_analytics` - Recent events (last 100)
- `polyglot_analytics_summary` - Session summaries (last 50)

## Viewing Analytics

### Console Dashboard

Open your browser's developer console and type:

```javascript
showAnalytics()
```

This displays:
- Total sessions
- Current session events
- All-time event count
- Latest session details
- Languages used
- Categories viewed
- Codes copied
- Analyses performed

### Example Output

```
📊 Poly-Glot Analytics Dashboard
═══════════════════════════════════
Total Sessions: 12
Current Session Events: 8
All Time Events: 156
═══════════════════════════════════
Latest Session:
  Duration: 5m 32s
  Events: 15
  Languages: python, javascript, typescript
  Categories: syntax, functions, best-practices
  Codes Copied: 4
  Analyses: 2
═══════════════════════════════════
Commands:
  analytics.exportData() - Export analytics data
  analytics.clearData() - Clear all analytics
  analytics.getSummary() - Get summary object
```

## Advanced Usage

### Export Analytics Data

To export all analytics data as JSON:

```javascript
window.polyglotAnalytics.exportData()
```

This downloads a file: `polyglot-analytics-[timestamp].json`

### Get Summary Object

To get the analytics summary programmatically:

```javascript
const summary = window.polyglotAnalytics.getSummary()
console.log(summary)
```

Returns:
```javascript
{
  total_sessions: 12,
  current_session_events: 8,
  all_time_events: 156,
  sessions: [
    {
      session_id: "session_1234567890_xyz",
      start_time: "2026-03-22T12:00:00.000Z",
      end_time: "2026-03-22T12:05:32.000Z",
      duration_ms: 332000,
      event_count: 15,
      languages_used: ["python", "javascript"],
      categories_viewed: ["syntax", "functions"],
      codes_copied: 4,
      analyses_performed: 2
    },
    // ... more sessions
  ]
}
```

### Clear All Data

To clear all analytics data:

```javascript
window.polyglotAnalytics.clearData()
```

## Events Tracked

### Page Events
- `page_view` - Initial page load
- `page_hidden` - Tab becomes inactive
- `page_visible` - Tab becomes active
- `session_end` - User leaves the page

### User Actions
- `language_changed` - User selects a different language
- `category_viewed` - User clicks on a category
- `code_copied` - User copies a code template
- `code_analyzed` - User analyzes their code
- `template_exported` - User exports templates
- `favorite_action` - User adds/removes favorites
- `search_performed` - User searches templates

## Event Structure

Each event has this structure:

```javascript
{
  session_id: "session_1234567890_xyz",
  event_name: "language_changed",
  timestamp: "2026-03-22T12:00:00.000Z",
  data: {
    language: "python",
    previous_language: "javascript"
  }
}
```

## For Developers

### Manual Event Tracking

You can track custom events:

```javascript
window.polyglotAnalytics.trackEvent('custom_event', {
  custom_data: 'value'
})
```

### Available Methods

```javascript
// Track specific actions
analytics.trackLanguageChange(language)
analytics.trackCategoryView(category)
analytics.trackCodeCopy(codeType)
analytics.trackCodeAnalysis(codeLength, commentRatio)
analytics.trackExport(language)
analytics.trackFavorite(action, itemName)
analytics.trackSearch(query)

// Utility methods
analytics.getSummary()
analytics.exportData()
analytics.clearData()
analytics.showDashboard()
```

## Session Management

### Session ID

Each session gets a unique ID:
```
session_[timestamp]_[random]
```

Example: `session_1711108800000_xyz123abc`

### Session Duration

Sessions are tracked from page load until:
- User closes the tab/window
- User navigates away
- Browser is closed

Duration is calculated and included in the session summary.

## Data Retention

- **Events**: Last 100 events kept
- **Sessions**: Last 50 sessions kept
- Older data is automatically removed to prevent storage overflow

## Browser Compatibility

Analytics works in all modern browsers with localStorage support:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## Privacy Compliance

This analytics system is:
- ✅ **GDPR Compliant** - No personal data collected
- ✅ **CCPA Compliant** - No data sold or shared
- ✅ **Cookie-Free** - Uses only localStorage
- ✅ **Transparent** - All data accessible to users
- ✅ **User-Controlled** - Users can clear data anytime

## FAQ

### Q: Where is my data stored?
**A:** All data is stored locally in your browser's localStorage. Nothing is sent to external servers.

### Q: Can I disable analytics?
**A:** Yes! Open the console and run:
```javascript
window.polyglotAnalytics.clearData()
```
Then refresh the page to start fresh.

### Q: Who can see my analytics data?
**A:** Only you! The data never leaves your browser.

### Q: What happens if I clear my browser data?
**A:** All analytics will be deleted along with other localStorage data.

### Q: Can I export my data?
**A:** Yes! Run `analytics.exportData()` in the console to download your data as JSON.

### Q: How much storage does this use?
**A:** Minimal - typically less than 50KB. Old data is automatically cleaned up.

## Future Enhancements

Planned features:
- [ ] Visual analytics dashboard (in-app)
- [ ] Aggregate statistics across users (opt-in)
- [ ] Export to CSV format
- [ ] Customizable retention periods
- [ ] Analytics comparison between sessions

## Support

For questions or issues:
- Open an issue on GitHub: https://github.com/hmoses/poly-glot/issues
- View the code: `analytics.js`

---

**Made with privacy in mind** 🔒
