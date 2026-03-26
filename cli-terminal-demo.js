// CLI Terminal Demo - Inline typing animation
// Shows code being typed in a terminal with comments appearing

(function() {
    'use strict';
    
    const DEMO_CODE = {
        javascript: {
            filename: 'calculateAge.js',
            command: 'poly-glot comment calculateAge.js',
            summary: {
                blocks: 1,
                functions: 'calculateAge()',
                tags: '@param, @returns, @throws, @example'
            },
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
        },
        python: {
            filename: 'user_manager.py',
            command: 'poly-glot comment user_manager.py',
            summary: {
                blocks: 1,
                functions: 'create_user()',
                tags: 'Args, Returns, Raises, Examples'
            },
            after: `import uuid
from datetime import datetime

def create_user(username, email, age):
    """
    Creates a new user account with validation.
    
    Args:
        username (str): The desired username (3-20 characters)
        email (str): User's email address
        age (int): User's age (must be 13 or older)
    
    Returns:
        dict: User object with id, username, email, and created_at
    
    Raises:
        ValueError: If username length is invalid
        ValueError: If email format is invalid
        ValueError: If age is below minimum requirement
    
    Examples:
        >>> user = create_user("john_doe", "john@example.com", 25)
        >>> print(user['username'])
        'john_doe'
    """
    if len(username) < 3 or len(username) > 20:
        raise ValueError("Username must be 3-20 characters")
    
    if '@' not in email or '.' not in email:
        raise ValueError("Invalid email format")
    
    if age < 13:
        raise ValueError("User must be at least 13 years old")
    
    return {
        'id': str(uuid.uuid4()),
        'username': username,
        'email': email,
        'created_at': datetime.now()
    }`
        },
        typescript: {
            filename: 'validator.ts',
            command: 'poly-glot comment validator.ts',
            summary: {
                blocks: 1,
                functions: 'validateEmail()',
                tags: '@param, @returns, @throws, @example'
            },
            after: `/**
 * Validates an email address format using regex
 * 
 * @param {string} email - The email address to validate
 * @returns {boolean} True if email format is valid, false otherwise
 * @throws {TypeError} If email parameter is not a string
 * 
 * @example
 * const isValid = validateEmail('user@example.com');
 * console.log(isValid); // true
 */
function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    throw new TypeError('Email must be a string');
  }
  
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}`
        },
        java: {
            filename: 'StringUtils.java',
            command: 'poly-glot comment StringUtils.java',
            summary: {
                blocks: 1,
                functions: 'capitalize()',
                tags: '@param, @return, @throws, @since'
            },
            after: `/**
 * Capitalizes the first letter of a string
 * 
 * @param str The input string to capitalize
 * @return String with first letter capitalized
 * @throws NullPointerException if str is null
 * @throws IllegalArgumentException if str is empty
 * @since 1.0
 * 
 * @example
 * String result = capitalize("hello");
 * // result = "Hello"
 */
public static String capitalize(String str) {
    if (str == null) {
        throw new NullPointerException("Input string cannot be null");
    }
    
    if (str.isEmpty()) {
        throw new IllegalArgumentException("Input string cannot be empty");
    }
    
    return str.substring(0, 1).toUpperCase() + str.substring(1);
}`
        },
        go: {
            filename: 'math.go',
            command: 'poly-glot comment math.go',
            summary: {
                blocks: 1,
                functions: 'Average()',
                tags: 'Parameters, Returns, Example'
            },
            after: `package math

import "errors"

// Average calculates the arithmetic mean of a slice of numbers
//
// Parameters:
//   numbers - Slice of float64 values to average
//
// Returns:
//   float64 - The calculated average
//   error - Returns error if slice is empty
//
// Example:
//   avg, err := Average([]float64{10, 20, 30})
//   // avg = 20.0, err = nil
func Average(numbers []float64) (float64, error) {
    if len(numbers) == 0 {
        return 0, errors.New("cannot calculate average of empty slice")
    }
    
    sum := 0.0
    for _, num := range numbers {
        sum += num
    }
    
    return sum / float64(len(numbers)), nil
}`
        },
        rust: {
            filename: 'parser.rs',
            command: 'poly-glot comment parser.rs',
            summary: {
                blocks: 1,
                functions: 'parse_int()',
                tags: 'Arguments, Returns, Errors, Examples'
            },
            after: `/// Parses a string into a signed 32-bit integer
///
/// # Arguments
///
/// * \`input\` - A string slice containing the number to parse
///
/// # Returns
///
/// * \`Result<i32, ParseIntError>\` - Ok with parsed integer or Err if invalid
///
/// # Errors
///
/// Returns \`ParseIntError\` if the string cannot be parsed as an integer
///
/// # Examples
///
/// \`\`\`
/// let num = parse_int("42").unwrap();
/// assert_eq!(num, 42);
/// \`\`\`
pub fn parse_int(input: &str) -> Result<i32, std::num::ParseIntError> {
    input.trim().parse::<i32>()
}`
        },
        cpp: {
            filename: 'vector_ops.cpp',
            command: 'poly-glot comment vector_ops.cpp',
            summary: {
                blocks: 1,
                functions: 'dotProduct()',
                tags: '@param, @return, @throws, @note'
            },
            after: `#include <vector>
#include <stdexcept>

/**
 * @brief Calculates the dot product of two vectors
 * 
 * @param a First vector of doubles
 * @param b Second vector of doubles
 * @return double The dot product result
 * @throws std::invalid_argument if vectors have different sizes
 * @note Vectors must be the same length
 * 
 * @code
 * std::vector<double> v1 = {1.0, 2.0, 3.0};
 * std::vector<double> v2 = {4.0, 5.0, 6.0};
 * double result = dotProduct(v1, v2); // 32.0
 * @endcode
 */
double dotProduct(const std::vector<double>& a, const std::vector<double>& b) {
    if (a.size() != b.size()) {
        throw std::invalid_argument("Vectors must have the same size");
    }
    
    double sum = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
        sum += a[i] * b[i];
    }
    
    return sum;
}`
        },
        csharp: {
            filename: 'Calculator.cs',
            command: 'poly-glot comment Calculator.cs',
            summary: {
                blocks: 1,
                functions: 'Divide()',
                tags: '<param>, <returns>, <exception>, <example>'
            },
            after: `/// <summary>
/// Divides two numbers with zero-check validation
/// </summary>
/// <param name="dividend">The number to be divided</param>
/// <param name="divisor">The number to divide by</param>
/// <returns>The result of the division</returns>
/// <exception cref="DivideByZeroException">
/// Thrown when divisor is zero
/// </exception>
/// <example>
/// <code>
/// double result = Divide(10, 2);
/// // result = 5.0
/// </code>
/// </example>
public static double Divide(double dividend, double divisor)
{
    if (divisor == 0)
    {
        throw new DivideByZeroException("Cannot divide by zero");
    }
    
    return dividend / divisor;
}`
        },
        ruby: {
            filename: 'string_helper.rb',
            command: 'poly-glot comment string_helper.rb',
            summary: {
                blocks: 1,
                functions: 'truncate()',
                tags: '@param, @return, @raise, @example'
            },
            after: `# Truncates a string to a specified length with ellipsis
#
# @param text [String] The string to truncate
# @param max_length [Integer] Maximum length (default: 50)
# @return [String] Truncated string with '...' if needed
# @raise [ArgumentError] if max_length is less than 3
#
# @example
#   truncate("Hello World", 8)
#   # => "Hello..."
def truncate(text, max_length = 50)
  raise ArgumentError, 'max_length must be at least 3' if max_length < 3
  
  return text if text.length <= max_length
  
  text[0...(max_length - 3)] + '...'
end`
        },
        php: {
            filename: 'ArrayHelper.php',
            command: 'poly-glot comment ArrayHelper.php',
            summary: {
                blocks: 1,
                functions: 'arraySum()',
                tags: '@param, @return, @throws'
            },
            after: `/**
 * Calculates the sum of all numeric values in an array
 * 
 * @param array $numbers Array of numeric values to sum
 * @return float The sum of all array values
 * @throws InvalidArgumentException If array is empty
 * @throws TypeError If array contains non-numeric values
 * 
 * @example
 * $result = arraySum([1, 2, 3, 4]);
 * // $result = 10
 */
function arraySum(array $numbers): float {
    if (empty($numbers)) {
        throw new InvalidArgumentException('Array cannot be empty');
    }
    
    $sum = 0;
    foreach ($numbers as $num) {
        if (!is_numeric($num)) {
            throw new TypeError('All array values must be numeric');
        }
        $sum += $num;
    }
    
    return (float)$sum;
}`
        },
        swift: {
            filename: 'Validator.swift',
            command: 'poly-glot comment Validator.swift',
            summary: {
                blocks: 2,
                functions: 'isValidPassword()',
                tags: '- Parameter, - Returns, - Throws'
            },
            after: `/// Error types for password validation
enum ValidationError: Error {
    case tooShort
    case missingRequiredCharacters
}

/// Validates password strength requirements
///
/// - Parameter password: The password string to validate
/// - Returns: \`true\` if password meets all requirements
/// - Throws: \`ValidationError\` if password is invalid
///
/// Password must contain:
/// - At least 8 characters
/// - One uppercase letter
/// - One lowercase letter
/// - One number
///
/// - Example:
///   \`\`\`swift
///   let isValid = try isValidPassword("Secure123")
///   // isValid = true
///   \`\`\`
func isValidPassword(_ password: String) throws -> Bool {
    guard password.count >= 8 else {
        throw ValidationError.tooShort
    }
    
    let hasUppercase = password.contains { $0.isUppercase }
    let hasLowercase = password.contains { $0.isLowercase }
    let hasNumber = password.contains { $0.isNumber }
    
    return hasUppercase && hasLowercase && hasNumber
}`
        },
        kotlin: {
            filename: 'ListUtils.kt',
            command: 'poly-glot comment ListUtils.kt',
            summary: {
                blocks: 1,
                functions: 'filterEven()',
                tags: '@param, @return, @throws, @sample'
            },
            after: `/**
 * Filters a list to return only even numbers
 *
 * @param numbers List of integers to filter
 * @return List containing only even numbers from input
 * @throws IllegalArgumentException if input list is empty
 *
 * @sample
 * val result = filterEven(listOf(1, 2, 3, 4, 5))
 * // result = [2, 4]
 */
fun filterEven(numbers: List<Int>): List<Int> {
    require(numbers.isNotEmpty()) {
        "Input list cannot be empty"
    }
    
    return numbers.filter { it % 2 == 0 }
}`
        }
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
                    // Also hide code output section
                    const codeOutputSection = document.getElementById('codeOutputSection');
                    if (codeOutputSection) {
                        codeOutputSection.style.display = 'none';
                    }
                }, 500);
            });
        }
    }
    
    async function runDemo() {
        if (isRunning) return;
        isRunning = true;
        
        // Get selected language
        const langSelect = document.getElementById('cliDemoLanguage');
        const selectedLang = langSelect ? langSelect.value : 'javascript';
        const langData = DEMO_CODE[selectedLang] || DEMO_CODE.javascript;
        
        const commandEl = document.getElementById('terminalCommand');
        const outputEl = document.getElementById('terminalOutput');
        const codeDisplayEl = document.getElementById('terminalCodeDisplay');
        const cursorEl = document.querySelector('.terminal-cursor');
        const codeOutputHeader = document.querySelector('.code-output-header h4');
        
        // Clear previous content
        commandEl.textContent = '';
        outputEl.textContent = '';
        codeDisplayEl.innerHTML = '';
        cursorEl.classList.remove('hidden');
        
        // Step 1: Type the command
        const command = langData.command;
        for (let char of command) {
            commandEl.textContent += char;
            await sleep(50);
        }
        
        await sleep(500);
        cursorEl.classList.add('hidden');
        
        // Step 2: Show processing messages
        outputEl.textContent = `✨ Processing ${langData.filename}...\n`;
        await sleep(600);
        
        outputEl.textContent += '📝 Analyzing code structure...\n';
        await sleep(600);
        
        // Step 3: Show success message
        outputEl.textContent += '✅ Comments added successfully!\n';
        await sleep(400);
        
        // Step 4: Show summary
        outputEl.textContent += '\nSummary:\n';
        await sleep(300);
        
        outputEl.textContent += `  • Added ${langData.summary.blocks} documentation block${langData.summary.blocks > 1 ? 's' : ''}\n`;
        await sleep(200);
        
        outputEl.textContent += `  • Documented function: ${langData.summary.functions}\n`;
        await sleep(200);
        
        outputEl.textContent += `  • Added tags: ${langData.summary.tags}\n`;
        await sleep(400);
        
        // Step 5: Show file updated message
        outputEl.textContent += `\n💾 File updated: ${langData.filename}\n`;
        await sleep(600);
        
        // Step 6: Show the code output below
        const codeOutputSection = document.getElementById('codeOutputSection');
        const codeOutputBody = document.getElementById('codeOutputBody');
        
        if (codeOutputSection && codeOutputBody) {
            // Update header with filename
            if (codeOutputHeader) {
                codeOutputHeader.textContent = `📄 ${langData.filename} (after documentation)`;
            }
            
            // Clear previous output
            codeOutputBody.innerHTML = '';
            
            // Show the section
            codeOutputSection.style.display = 'block';
            
            // Add all code lines with highlighting
            const lines = langData.after.split('\n');
            const commentLines = identifyCommentLines(lines, selectedLang);
            
            // Create and add all lines
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineDiv = document.createElement('div');
                lineDiv.className = 'terminal-code-line';
                
                // Highlight comment lines
                if (commentLines.includes(i)) {
                    lineDiv.classList.add('code-added');
                }
                
                lineDiv.innerHTML = highlightCode(line, selectedLang);
                codeOutputBody.appendChild(lineDiv);
            }
            
            // Scroll output into view
            codeOutputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        isRunning = false;
    }
    
    function identifyCommentLines(lines, lang) {
        const commentLines = [];
        let inComment = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // JSDoc-style (JavaScript, TypeScript, Java, C++, C#, PHP)
            if (lang === 'javascript' || lang === 'typescript' || lang === 'java' || 
                lang === 'cpp' || lang === 'csharp' || lang === 'php' || lang === 'kotlin') {
                if (line.startsWith('/**') || line.startsWith('///') || line.startsWith('//!')) {
                    inComment = true;
                    commentLines.push(i);
                } else if (inComment && (line.includes('*/') || line.startsWith('*') || line.startsWith('///'))) {
                    commentLines.push(i);
                    if (line.includes('*/')) inComment = false;
                } else if (inComment) {
                    commentLines.push(i);
                }
            }
            // Python docstrings
            else if (lang === 'python') {
                if (line.startsWith('"""') || line.includes('"""')) {
                    commentLines.push(i);
                    if (!inComment && line.startsWith('"""')) inComment = true;
                    else if (inComment && line.includes('"""')) inComment = false;
                } else if (inComment) {
                    commentLines.push(i);
                }
            }
            // Go comments
            else if (lang === 'go') {
                if (line.startsWith('//')) {
                    commentLines.push(i);
                }
            }
            // Rust doc comments
            else if (lang === 'rust') {
                if (line.startsWith('///') || line.startsWith('//!')) {
                    commentLines.push(i);
                }
            }
            // Ruby comments
            else if (lang === 'ruby') {
                if (line.startsWith('#')) {
                    commentLines.push(i);
                }
            }
            // Swift doc comments
            else if (lang === 'swift') {
                if (line.startsWith('///')) {
                    commentLines.push(i);
                }
            }
        }
        
        return commentLines;
    }
    
    function highlightCode(line) {
        // Simple syntax highlighting - build HTML safely
        
        // Comments - handle separately
        if (line.trim().startsWith('/**') || line.trim().startsWith('*') || line.trim().startsWith('*/')) {
            return `<span class="code-comment">${escapeHtml(line)}</span>`;
        }
        
        // Build highlighted HTML by tokenizing the line
        let html = '';
        let remaining = line;
        
        // Handle inline comments first
        const commentMatch = remaining.match(/^(.*)\/\/ (.*)$/);
        if (commentMatch) {
            html = highlightCodePart(commentMatch[1]) + '<span class="code-comment">// ' + escapeHtml(commentMatch[2]) + '</span>';
            return html;
        }
        
        return highlightCodePart(remaining);
    }
    
    function highlightCodePart(code) {
        // Escape the whole thing first
        let html = escapeHtml(code);
        
        // Replace strings (look for both &quot; and &#39; from escapeHtml)
        html = html.replace(/&#39;([^&#39;]*)&#39;/g, '<span class="code-string">&#39;$1&#39;</span>');
        html = html.replace(/&quot;([^&quot;]*)&quot;/g, '<span class="code-string">&quot;$1&quot;</span>');
        
        // Replace keywords
        html = html.replace(/\b(function|const|let|var|if|return|throw|new|isNaN|else)\b/g, 
            '<span class="code-keyword">$1</span>');
        
        // Replace function calls
        html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, 
            '<span class="code-function">$1</span>(');
        
        // Replace numbers
        html = html.replace(/\b(\d+)\b/g, 
            '<span class="code-number">$1</span>');
        
        return html;
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
