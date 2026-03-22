"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesSidebarProvider = void 0;
// ─── Template data ────────────────────────────────────────────────────────────
// Stored as plain objects (no template literals with nested backticks) so that
// they serialize to JSON cleanly and can be safely injected into webview HTML.
const TEMPLATES = {
    javascript: {
        name: 'JavaScript / TypeScript',
        singleLine: '// Single-line comment',
        multiLine: ['/**', ' * Multi-line comment', ' * describing something', ' */'].join('\n'),
        functionDoc: [
            '/**',
            ' * Brief description of what this function does.',
            ' *',
            ' * @param {string} name - The name parameter',
            ' * @param {number} age  - The age parameter',
            ' * @returns {boolean} True if valid, false otherwise',
            ' * @throws {TypeError} If name is not a string',
            ' */',
        ].join('\n'),
        tip: 'Use JSDoc for functions, classes, and modules. Tools like VS Code IntelliSense and TypeDoc parse these automatically.',
    },
    python: {
        name: 'Python',
        singleLine: '# Single-line comment',
        multiLine: ['"""', 'Multi-line docstring.', 'Describes a module or class.', '"""'].join('\n'),
        functionDoc: [
            'def my_function(name: str, age: int) -> bool:',
            '    """',
            '    Brief one-line summary.',
            '',
            '    Args:',
            '        name (str): The name of the user.',
            '        age  (int): The age of the user.',
            '',
            '    Returns:',
            '        bool: True if valid, False otherwise.',
            '',
            '    Raises:',
            '        ValueError: If age is negative.',
            '    """',
        ].join('\n'),
        tip: 'Google-style docstrings (Args/Returns/Raises) are the most readable. Tools like Sphinx and pdoc3 parse them.',
    },
    java: {
        name: 'Java',
        singleLine: '// Single-line comment',
        multiLine: ['/*', ' * Multi-line comment', ' */'].join('\n'),
        functionDoc: [
            '/**',
            ' * Brief description of the method.',
            ' *',
            ' * @param  name  the name of the entity',
            ' * @param  age   the age of the entity',
            ' * @return {@code true} if valid, {@code false} otherwise',
            ' * @throws IllegalArgumentException if name is null',
            ' */',
        ].join('\n'),
        tip: 'Javadoc comments are parsed by IDEs and build tools. Always document public APIs.',
    },
    csharp: {
        name: 'C#',
        singleLine: '// Single-line comment',
        multiLine: ['/* Multi-line comment', ' * across lines', ' */'].join('\n'),
        functionDoc: [
            '/// <summary>',
            '/// Brief description of the method.',
            '/// </summary>',
            '/// <param name="name">The name parameter.</param>',
            '/// <param name="age">The age parameter.</param>',
            '/// <returns>True if valid; otherwise false.</returns>',
            '/// <exception cref="ArgumentNullException">',
            '///   Thrown when <paramref name="name"/> is null.',
            '/// </exception>',
        ].join('\n'),
        tip: 'XML doc comments are processed by IntelliSense and tools like Sandcastle or DocFX.',
    },
    cpp: {
        name: 'C / C++',
        singleLine: '// Single-line comment',
        multiLine: ['/* Multi-line comment', ' * over multiple lines', ' */'].join('\n'),
        functionDoc: [
            '/**',
            ' * @brief  Brief one-line description.',
            ' *',
            ' * @param[in]  name  The name string.',
            ' * @param[in]  age   The age value.',
            ' * @return  0 on success, negative on error.',
            ' *',
            ' * @note  Thread-safe — uses internal mutex.',
            ' */',
        ].join('\n'),
        tip: 'Doxygen-style comments work in both C and C++. Run doxygen with your Doxyfile to generate HTML docs.',
    },
    go: {
        name: 'Go',
        singleLine: '// Single-line comment',
        multiLine: ['// Block comment — Go uses', '// consecutive // lines', '// rather than /* */.'].join('\n'),
        functionDoc: [
            '// MyFunction does something useful.',
            '// It accepts name and age and returns whether they are valid.',
            '//',
            '// Example:',
            '//',
            '//\tok := MyFunction("Alice", 30)',
            'func MyFunction(name string, age int) bool {',
        ].join('\n'),
        tip: 'GoDoc uses // comments directly above declarations. The first sentence becomes the summary.',
    },
    rust: {
        name: 'Rust',
        singleLine: '// Single-line comment',
        multiLine: ['// Multi-line: Rust uses', '// consecutive // lines', '// or block /* */.'].join('\n'),
        functionDoc: [
            '/// Brief one-line summary.',
            '///',
            '/// # Arguments',
            '///',
            '/// * `name` - The name of the entity.',
            '/// * `age`  - The age of the entity.',
            '///',
            '/// # Returns',
            '///',
            '/// `true` if valid, `false` otherwise.',
            '///',
            '/// # Examples',
            '///',
            '/// ```',
            '/// let ok = my_function("Alice", 30);',
            '/// assert!(ok);',
            '/// ```',
        ].join('\n'),
        tip: 'rustdoc generates HTML docs from /// comments. Use //! for module-level docs.',
    },
    ruby: {
        name: 'Ruby',
        singleLine: '# Single-line comment',
        multiLine: ['=begin', 'Multi-line comment block.', 'Used rarely in practice.', '=end'].join('\n'),
        functionDoc: [
            '# Checks whether the given name and age are valid.',
            '#',
            '# @param name [String] the name to validate',
            '# @param age  [Integer] the age to validate',
            '# @return [Boolean] true if both are valid',
            '# @raise [ArgumentError] if name is nil',
        ].join('\n'),
        tip: 'YARD (yardoc) is the de-facto Ruby doc tool. Use @param, @return, @raise tags.',
    },
    php: {
        name: 'PHP',
        singleLine: '// Single-line comment  or  # hash style',
        multiLine: ['/* Multi-line comment', ' * over multiple lines', ' */'].join('\n'),
        functionDoc: [
            '/**',
            ' * Brief description of the function.',
            ' *',
            ' * @param string $name The name parameter.',
            ' * @param int    $age  The age parameter.',
            ' *',
            ' * @return bool True if valid, false otherwise.',
            ' *',
            ' * @throws \\InvalidArgumentException When name is empty.',
            ' */',
        ].join('\n'),
        tip: 'PHPDoc is parsed by IDEs and phpDocumentor. Use @throws for exceptions and @var for properties.',
    },
    swift: {
        name: 'Swift',
        singleLine: '// Single-line comment',
        multiLine: ['/* Multi-line comment', ' * over lines', ' */'].join('\n'),
        functionDoc: [
            '/// Brief one-line summary.',
            '///',
            '/// - Parameters:',
            '///   - name: The name of the entity.',
            '///   - age:  The age of the entity.',
            '/// - Returns: `true` if valid; `false` otherwise.',
            '/// - Throws: `ValidationError.invalidName` if name is empty.',
        ].join('\n'),
        tip: 'Swift markup uses /// and is rendered in Xcode Quick Help. DocC (Apple) builds full documentation sites.',
    },
    kotlin: {
        name: 'Kotlin',
        singleLine: '// Single-line comment',
        multiLine: ['/* Multi-line comment', ' * over multiple lines', ' */'].join('\n'),
        functionDoc: [
            '/**',
            ' * Brief description of the function.',
            ' *',
            ' * @param name the name of the entity',
            ' * @param age  the age of the entity',
            ' * @return `true` if valid, `false` otherwise',
            ' * @throws IllegalArgumentException if name is blank',
            ' */',
        ].join('\n'),
        tip: 'KDoc is Kotlin\'s Javadoc equivalent. Use @sample to link to usage examples in docs.',
    },
    sql: {
        name: 'SQL',
        singleLine: '-- Single-line comment',
        multiLine: ['/* Multi-line comment', ' * spanning lines', ' */'].join('\n'),
        functionDoc: [
            '-- ============================================================',
            '-- Procedure : usp_GetUserById',
            '-- Purpose   : Retrieve a single user record by primary key.',
            '-- Parameters: @UserId INT — the user ID to look up',
            '-- Returns   : Single row from dbo.Users, or empty set.',
            '-- Modified  : 2025-01-15  HMoses  Initial version',
            '-- ============================================================',
        ].join('\n'),
        tip: 'SQL lacks native doc tooling — header blocks are the convention. Include purpose, params, and change log.',
    },
};
// ─── Sidebar WebviewViewProvider ──────────────────────────────────────────────
class TemplatesSidebarProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
    }
    getHtml(webview) {
        // Safely inject template data as JSON — avoids backtick/escaping issues
        const templatesJson = JSON.stringify(TEMPLATES);
        const nonce = getNonce();
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Poly-Glot Templates</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, -apple-system, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 12px;
    }
    h2 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
      color: var(--vscode-sideBarTitle-foreground, #cccccc);
    }
    select, button {
      width: 100%;
      padding: 6px 8px;
      margin-bottom: 10px;
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border);
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }
    select:focus, button:focus { outline: 1px solid var(--vscode-focusBorder); }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      font-weight: 500;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .section { margin-bottom: 14px; }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
    }
    pre {
      background: var(--vscode-textCodeBlock-background, #1e1e1e);
      color: var(--vscode-textPreformat-foreground, #d4d4d4);
      padding: 10px;
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
      font-size: 11.5px;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-x: auto;
    }
    .copy-btn {
      background: transparent;
      color: var(--vscode-descriptionForeground);
      border: 1px solid var(--vscode-widget-border, #444);
      font-size: 11px;
      padding: 3px 8px;
      width: auto;
      margin-bottom: 6px;
    }
    .copy-btn:hover { background: var(--vscode-list-hoverBackground); }
    .tip {
      background: var(--vscode-inputValidation-infoBackground, #063b49);
      border-left: 3px solid var(--vscode-inputValidation-infoBorder, #007acc);
      padding: 8px 10px;
      border-radius: 0 4px 4px 0;
      font-size: 11.5px;
      color: var(--vscode-foreground);
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <h2>📝 Comment Templates</h2>

  <div class="section">
    <div class="section-label">Language</div>
    <select id="langSelect"></select>
  </div>

  <div class="section">
    <div class="section-label">Single-line</div>
    <button class="copy-btn" data-target="singlePre">Copy</button>
    <pre id="singlePre"></pre>
  </div>

  <div class="section">
    <div class="section-label">Multi-line</div>
    <button class="copy-btn" data-target="multiPre">Copy</button>
    <pre id="multiPre"></pre>
  </div>

  <div class="section">
    <div class="section-label">Function / Method doc</div>
    <button class="copy-btn" data-target="funcPre">Copy</button>
    <pre id="funcPre"></pre>
  </div>

  <div class="section">
    <div class="section-label">💡 Pro tip</div>
    <div class="tip" id="tipBox"></div>
  </div>

  <script nonce="${nonce}">
    const TEMPLATES = ${templatesJson};

    const langSelect = document.getElementById('langSelect');
    const singlePre  = document.getElementById('singlePre');
    const multiPre   = document.getElementById('multiPre');
    const funcPre    = document.getElementById('funcPre');
    const tipBox     = document.getElementById('tipBox');

    // Populate dropdown
    Object.entries(TEMPLATES).forEach(([key, val]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = val.name;
      langSelect.appendChild(opt);
    });

    function render(key) {
      const t = TEMPLATES[key];
      if (!t) return;
      singlePre.textContent = t.singleLine;
      multiPre.textContent  = t.multiLine;
      funcPre.textContent   = t.functionDoc;
      tipBox.textContent    = t.tip;
    }

    langSelect.addEventListener('change', () => render(langSelect.value));
    render(langSelect.value || Object.keys(TEMPLATES)[0]);

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const text = document.getElementById(targetId).textContent;
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.textContent;
          btn.textContent = '✓ Copied!';
          setTimeout(() => { btn.textContent = orig; }, 1800);
        });
      });
    });
  </script>
</body>
</html>`;
    }
}
exports.TemplatesSidebarProvider = TemplatesSidebarProvider;
TemplatesSidebarProvider.viewType = 'polyglot.templatesView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=sidebar.js.map