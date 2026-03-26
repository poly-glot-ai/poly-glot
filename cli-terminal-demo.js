// CLI Terminal Demo - Inline typing animation
// Shows code being typed in a terminal with comments appearing

(function() {
    'use strict';
    
    const DEMO_CODE = {
        before: `function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}`,
        after: `/**
 * Calculates a person's age based on their birth date
 * 
 * @param {string} birthDate - The birth date in ISO format (YYYY-MM-DD)
 * @returns {number} The calculated age in years
 * @throws {Error} If birthDate is invalid or in the future
 * 
 * @example
 * const age = calculateAge('1990-05-15');
 * console.log(age); // 35
 */
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    
    if (isNaN(birth.getTime())) {
        throw new Error('Invalid birth date format');
    }
    
    if (birth > today) {
        throw new Error('Birth date cannot be in the future');
    }
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}`
    };
    
    let isRunning = false;
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function init() {
        const demoBtn = document.getElementById('cliDemoBtn');
        const terminalDemo = document.getElementById('cliTerminalDemo');
        const replayBtn = document.getElementById('replayDemo');
        const closeBtn = document.getElementById('closeDemo');
        
        if (!demoBtn || !terminalDemo) return;
        
        demoBtn.addEventListener('click', async () => {
            if (isRunning) return;
            
            // Show terminal
            terminalDemo.style.display = 'block';
            setTimeout(() => terminalDemo.classList.add('active'), 50);
            
            // Scroll to terminal
            terminalDemo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Run demo
            await runDemo();
            
            // Track analytics
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('cli_terminal_demo_played', {
                    source: 'cli_section'
                });
            }
        });
        
        if (replayBtn) {
            replayBtn.addEventListener('click', async () => {
                if (isRunning) return;
                await runDemo();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                terminalDemo.classList.remove('active');
                setTimeout(() => {
                    terminalDemo.style.display = 'none';
                }, 500);
            });
        }
    }
    
    async function runDemo() {
        if (isRunning) return;
        isRunning = true;
        
        const commandEl = document.getElementById('terminalCommand');
        const outputEl = document.getElementById('terminalOutput');
        const codeDisplayEl = document.getElementById('terminalCodeDisplay');
        const cursorEl = document.querySelector('.terminal-cursor');
        
        // Clear previous content
        commandEl.textContent = '';
        outputEl.textContent = '';
        codeDisplayEl.innerHTML = '';
        cursorEl.classList.remove('hidden');
        
        // Step 1: Type the command
        const command = 'poly-glot comment calculateAge.js';
        for (let char of command) {
            commandEl.textContent += char;
            await sleep(50);
        }
        
        await sleep(500);
        cursorEl.classList.add('hidden');
        
        // Step 2: Show processing message
        outputEl.textContent = '✨ Processing calculateAge.js...\n📝 Adding JSDoc comments...\n';
        await sleep(1000);
        
        // Step 3: Type the code with comments appearing
        const lines = DEMO_CODE.after.split('\n');
        const commentLines = [];
        const codeLines = [];
        
        // Separate comment lines from code lines
        let inComment = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('/**')) {
                inComment = true;
                commentLines.push(i);
            } else if (inComment && line.trim().includes('*/')) {
                commentLines.push(i);
                inComment = false;
            } else if (inComment) {
                commentLines.push(i);
            } else {
                codeLines.push(i);
            }
        }
        
        // Type code line by line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineDiv = document.createElement('div');
            lineDiv.className = 'terminal-code-line';
            
            // Check if this is a comment line
            const isComment = commentLines.includes(i);
            
            if (isComment) {
                lineDiv.classList.add('code-added');
            }
            
            // Add syntax highlighting
            lineDiv.innerHTML = highlightCode(line);
            
            codeDisplayEl.appendChild(lineDiv);
            
            // Scroll to bottom
            codeDisplayEl.scrollTop = codeDisplayEl.scrollHeight;
            
            // Wait longer for comment lines to emphasize them
            if (isComment) {
                await sleep(80);
            } else {
                await sleep(40);
            }
        }
        
        // Step 4: Show completion message
        await sleep(800);
        outputEl.textContent += '\n✅ Comments added successfully!\n💡 File saved: calculateAge.js\n';
        
        isRunning = false;
    }
    
    function highlightCode(line) {
        // Simple syntax highlighting
        let highlighted = line;
        
        // Comments
        if (line.trim().startsWith('/**') || line.trim().startsWith('*') || line.trim().startsWith('*/')) {
            return `<span class="code-comment">${escapeHtml(line)}</span>`;
        }
        
        // Keywords
        highlighted = highlighted.replace(/\b(function|const|let|var|if|return|throw|new|isNaN)\b/g, 
            '<span class="code-keyword">$1</span>');
        
        // Function names
        highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, 
            '<span class="code-function">$1</span>(');
        
        // Strings
        highlighted = highlighted.replace(/'([^']*)'/g, 
            '<span class="code-string">\'$1\'</span>');
        highlighted = highlighted.replace(/"([^"]*)"/g, 
            '<span class="code-string">"$1"</span>');
        
        // Numbers
        highlighted = highlighted.replace(/\b(\d+)\b/g, 
            '<span class="code-number">$1</span>');
        
        return highlighted;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
