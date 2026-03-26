// CLI Terminal Demo - Inline typing animation
// Shows code being typed in a terminal with comments appearing

(function() {
    'use strict';
    
    const DEMO_CODE = {
        javascript: {
            filename: 'calculateAge.js',
            command: 'poly-glot comment calculateAge.js',
            commandWhy: 'poly-glot why calculateAge.js',
            summary: {
                blocks: 1,
                functions: 'calculateAge()',
                tags: '@param, @returns, @throws, @example'
            },
            summaryWhy: {
                lines: 4,
                focus: 'calculateAge()',
                style: 'inline // why-comments'
            },
            afterWhy: `function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);

  // isNaN check is safer than try/catch here — invalid strings silently
  // produce NaN rather than throwing, so explicit guard is needed
  if (isNaN(birth.getTime())) {
    throw new Error('Invalid birth date format');
  }

  // Reject future dates early rather than returning a negative age,
  // which would be a silent incorrect result
  if (birth > today) {
    throw new Error('Birth date cannot be in the future');
  }

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // Can't rely solely on year diff — a Dec 31 birthday hasn't occurred
  // yet for someone born next month, so we subtract one year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
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
        },
        python: {
            filename: 'user_manager.py',
            command: 'poly-glot comment user_manager.py',
            commandWhy: 'poly-glot why user_manager.py',
            summaryWhy: {
                lines: 5,
                focus: 'create_user()',
                style: 'inline # why-comments'
            },
            afterWhy: `import uuid
from datetime import datetime

def create_user(username, email, age):
    # uuid4 over uuid1 — avoids embedding the host MAC address,
    # which would be a privacy leak in user-facing IDs
    user_id = str(uuid.uuid4())

    # Minimum age enforced here rather than in the DB constraint so we
    # can return a clean domain error instead of a raw IntegrityError
    if age < 13:
        raise ValueError("Users must be 13 or older (COPPA compliance)")

    # strip() before length check — a username of all spaces would
    # pass a naive len() check but is functionally empty
    if not 3 <= len(username.strip()) <= 20:
        raise ValueError("Username must be 3-20 characters")

    # Basic format check only — full deliverability validation requires
    # a send attempt; we avoid that cost at signup time
    if '@' not in email or '.' not in email.split('@')[-1]:
        raise ValueError("Invalid email format")

    return {
        'id': user_id,
        'username': username.strip(),
        'email': email.lower(), # normalise to lowercase to prevent duplicate accounts
        'age': age,
        'created_at': datetime.utcnow().isoformat()
    }`,
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
            commandWhy: 'poly-glot why validator.ts',
            summaryWhy: {
                lines: 4,
                focus: 'validateEmail()',
                style: 'inline // why-comments'
            },
            afterWhy: `export function validateEmail(email: string): boolean {
  // Trimming here rather than requiring callers to do it — form inputs
  // often carry accidental whitespace that shouldn't cause failures
  const trimmed = email.trim();

  // RFC 5321 allows up to 254 chars; anything longer is almost certainly
  // an injection attempt or a bug, not a real address
  if (trimmed.length > 254) return false;

  // Regex intentionally permissive — exact RFC 5322 compliance produces
  // a 6KB regex that's unreadable and still misses edge cases; a simple
  // structural check is a better trade-off here
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}`,
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
            commandWhy: 'poly-glot why StringUtils.java',
            summaryWhy: {
                lines: 4,
                focus: 'truncate()',
                style: 'inline // why-comments'
            },
            afterWhy: `public class StringUtils {
    public static String truncate(String text, int maxLength) {
        // Null guard returns null rather than throwing — callers treating
        // this as a display utility shouldn't need a try/catch
        if (text == null) return null;

        // maxLength includes the ellipsis, so we compare against
        // maxLength - 3 to avoid exceeding the requested limit
        if (text.length() <= maxLength) return text;

        // substring end index is exclusive in Java, so no off-by-one here
        return text.substring(0, maxLength - 3) + "...";
    }
}`,
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
            commandWhy: 'poly-glot why math.go',
            summaryWhy: {
                lines: 4,
                focus: 'SafeDivide()',
                style: 'inline // why-comments'
            },
            afterWhy: `package math

import "errors"

func SafeDivide(a, b float64) (float64, error) {
    // Return an error rather than panicking — division by zero in Go
    // doesn't produce NaN like some languages; it would panic, which
    // crashes the goroutine and is unrecoverable in a server context
    if b == 0 {
        return 0, errors.New("division by zero")
    }

    // Named return values were considered but skipped — with only one
    // success path, naked returns would obscure what's being returned
    return a / b, nil
}`,
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
            commandWhy: 'poly-glot why parser.rs',
            summaryWhy: {
                lines: 4,
                focus: 'parse_int()',
                style: 'inline // why-comments'
            },
            afterWhy: `// Returns Result rather than Option — callers need to know whether
// parsing failed vs the input being intentionally absent
pub fn parse_int(s: &str) -> Result<i32, String> {
    // trim() before parse() — the standard library's parse() is strict
    // and will reject leading/trailing whitespace that humans expect to be ignored
    let trimmed = s.trim();

    // Shadowing 's' with 'trimmed' is deliberate — prevents accidentally
    // using the un-trimmed original elsewhere in this function
    trimmed.parse::<i32>()
        // map_err converts the stdlib ParseIntError into our String error type
        // without needing a custom error enum for this simple utility
        .map_err(|e| format!("Failed to parse '{}': {}", trimmed, e))
}`,
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
            commandWhy: 'poly-glot why vector_ops.cpp',
            summaryWhy: {
                lines: 4,
                focus: 'dotProduct()',
                style: 'inline // why-comments'
            },
            afterWhy: `#include <vector>
#include <stdexcept>

// Takes vectors by const reference rather than value to avoid
// copying potentially large vectors on every call
double dotProduct(const std::vector<double>& a, const std::vector<double>& b) {
    // Size check before the loop — mismatched sizes would silently
    // produce a mathematically incorrect result, not a crash
    if (a.size() != b.size()) {
        throw std::invalid_argument("Vectors must be the same length");
    }

    double result = 0.0;
    // Using index-based loop over range-for so we can access both
    // vectors simultaneously without zip or index bookkeeping
    for (size_t i = 0; i < a.size(); ++i) {
        result += a[i] * b[i];
    }
    return result;
}`,
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
            commandWhy: 'poly-glot why Calculator.cs',
            summaryWhy: {
                lines: 4,
                focus: 'Divide()',
                style: 'inline // why-comments'
            },
            afterWhy: `public class Calculator {
    // decimal instead of double — financial calculations require exact
    // decimal representation; double's binary floating point introduces
    // rounding errors that compound over many operations
    public decimal Divide(decimal numerator, decimal denominator) {
        // Explicit zero check before division — C# throws DivideByZeroException
        // for integer division but silently returns Infinity for decimal,
        // which would propagate silently into downstream calculations
        if (denominator == 0)
            throw new ArgumentException("Denominator cannot be zero");

        return numerator / denominator;
    }
}`,
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
            commandWhy: 'poly-glot why string_helper.rb',
            summaryWhy: {
                lines: 3,
                focus: 'truncate()',
                style: 'inline # why-comments'
            },
            afterWhy: `def truncate(text, max_length)
  # Return nil rather than raising — this is a display helper called
  # from views where nil is handled gracefully by ERB; an exception
  # would crash the entire render
  return nil if text.nil?

  return text if text.length <= max_length

  # Subtract 3 before slicing so the ellipsis fits within max_length,
  # not beyond it — a common off-by-one in truncation utilities
  text[0, max_length - 3] + "..."
end`,
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
            commandWhy: 'poly-glot why ArrayHelper.php',
            summaryWhy: {
                lines: 4,
                focus: 'sumArray()',
                style: 'inline // why-comments'
            },
            afterWhy: `<?php
function sumArray(array $numbers): float {
    // Return 0.0 for empty arrays rather than null — callers doing
    // arithmetic on the result shouldn't need a null check
    if (empty($numbers)) {
        return 0.0;
    }

    $sum = 0;
    foreach ($numbers as $num) {
        // is_numeric check instead of is_int/is_float — allows numeric
        // strings like "3.14" that arrive from form inputs or JSON decoding
        if (!is_numeric($num)) {
            throw new TypeError('All array values must be numeric');
        }
        $sum += $num;
    }

    // Cast to float on return — $sum could be int if all inputs were
    // whole numbers, but callers expect a consistent float return type
    return (float)$sum;
}`,
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
            commandWhy: 'poly-glot why Validator.swift',
            summaryWhy: {
                lines: 4,
                focus: 'isValidPassword()',
                style: 'inline // why-comments'
            },
            afterWhy: `enum ValidationError: Error {
    case tooShort
    case missingRequiredCharacters
}

func isValidPassword(_ password: String) throws -> Bool {
    // 8 is the NIST SP 800-63B minimum; we enforce it here rather than
    // in the UI so server-side validation can't be bypassed
    guard password.count >= 8 else {
        throw ValidationError.tooShort
    }

    // Each check is separate so we can surface a specific error
    // message to the user rather than a generic "password too weak"
    let hasUppercase = password.contains { $0.isUppercase }
    let hasLowercase = password.contains { $0.isLowercase }
    let hasNumber = password.contains { $0.isNumber }

    // && rather than early return — we want all three booleans evaluated
    // so future code can report which specific requirements are unmet
    return hasUppercase && hasLowercase && hasNumber
}`,
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
            commandWhy: 'poly-glot why ListUtils.kt',
            summaryWhy: {
                lines: 3,
                focus: 'filterEven()',
                style: 'inline // why-comments'
            },
            afterWhy: `fun filterEven(numbers: List<Int>): List<Int> {
    // require() over if/throw — it produces a clear IllegalArgumentException
    // with the message, which is the idiomatic Kotlin contract-check pattern
    require(numbers.isNotEmpty()) {
        "Input list cannot be empty"
    }

    // filter {} instead of a manual loop — the stdlib implementation
    // is optimised and avoids intermediate list allocations
    return numbers.filter { it % 2 == 0 }
}`,
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
        
        // Get selected language and mode
        const langSelect = document.getElementById('cliDemoLanguage');
        const modeToggle = document.getElementById('cliDemoMode');
        const selectedLang = langSelect ? langSelect.value : 'javascript';
        const isWhyMode = modeToggle ? modeToggle.value === 'why' : false;
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
        
        // Pick command + output based on mode
        const command = isWhyMode ? (langData.commandWhy || langData.command) : langData.command;
        const afterCode = isWhyMode ? (langData.afterWhy || langData.after) : langData.after;
        const summary = isWhyMode ? (langData.summaryWhy || langData.summary) : langData.summary;
        
        // Step 1: Type the command
        for (let char of command) {
            commandEl.textContent += char;
            await sleep(50);
        }
        
        await sleep(500);
        cursorEl.classList.add('hidden');
        
        // Step 2: Show processing messages
        outputEl.textContent = `✨ Processing ${langData.filename}...\n`;
        await sleep(600);
        
        if (isWhyMode) {
            outputEl.textContent += '🔍 Identifying non-obvious decisions...\n';
            await sleep(600);
            outputEl.textContent += '✅ Why-comments added successfully!\n';
            await sleep(400);
            outputEl.textContent += '\nSummary:\n';
            await sleep(300);
            outputEl.textContent += `  • Added ${summary.lines} why-comment${summary.lines > 1 ? 's' : ''}\n`;
            await sleep(200);
            outputEl.textContent += `  • Focus: ${summary.focus}\n`;
            await sleep(200);
            outputEl.textContent += `  • Style: ${summary.style}\n`;
        } else {
            outputEl.textContent += '📝 Analyzing code structure...\n';
            await sleep(600);
            outputEl.textContent += '✅ Comments added successfully!\n';
            await sleep(400);
            outputEl.textContent += '\nSummary:\n';
            await sleep(300);
            outputEl.textContent += `  • Added ${summary.blocks} documentation block${summary.blocks > 1 ? 's' : ''}\n`;
            await sleep(200);
            outputEl.textContent += `  • Documented function: ${summary.functions}\n`;
            await sleep(200);
            outputEl.textContent += `  • Added tags: ${summary.tags}\n`;
        }
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
                const headerLabel = isWhyMode ? 'after why-comments' : 'after documentation';
                codeOutputHeader.textContent = `📄 ${langData.filename} (${headerLabel})`;
            }
            
            // Clear previous output
            codeOutputBody.innerHTML = '';
            
            // Show the section
            codeOutputSection.style.display = 'block';
            
            // Add all code lines with highlighting
            const lines = afterCode.split('\n');
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
        let inBlockComment = false;

        // Languages that use # for comments
        const hashCommentLangs = new Set(['python', 'ruby']);
        // Languages that use // for comments
        const slashCommentLangs = new Set(['javascript', 'typescript', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'swift', 'kotlin']);

        for (let i = 0; i < lines.length; i++) {
            const raw  = lines[i];
            const line = raw.trim();

            // Block comment open (/** ... */)
            if (line.startsWith('/**') || line.startsWith('/*')) {
                inBlockComment = true;
                commentLines.push(i);
                if (line.includes('*/') && !line.startsWith('/**')) inBlockComment = false;
                continue;
            }
            if (inBlockComment) {
                commentLines.push(i);
                if (line.includes('*/')) inBlockComment = false;
                continue;
            }

            // Python / Ruby triple-quote docstrings
            if (lang === 'python' && (line.startsWith('"""') || line.startsWith("'''"))) {
                commentLines.push(i);
                continue;
            }

            // Single-line // comment (leading or inline trailing)
            if (slashCommentLangs.has(lang)) {
                if (line.startsWith('//')) {
                    commentLines.push(i);
                } else if (raw.includes(' // ')) {
                    // inline why-comment at end of line — highlight the whole line
                    commentLines.push(i);
                }
                continue;
            }

            // Hash comment languages
            if (hashCommentLangs.has(lang)) {
                if (line.startsWith('#')) {
                    commentLines.push(i);
                } else if (raw.includes(' # ')) {
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
        
        // Handle inline // comments (both leading and trailing)
        const leadingSlash = remaining.match(/^(\s*\/\/.*)$/);
        if (leadingSlash) {
            return `<span class="code-comment">${escapeHtml(remaining)}</span>`;
        }
        const trailingSlash = remaining.match(/^(.*?)( \/\/ .*)$/);
        if (trailingSlash) {
            html = highlightCodePart(trailingSlash[1]) + '<span class="code-comment">' + escapeHtml(trailingSlash[2]) + '</span>';
            return html;
        }
        // Handle inline # comments (Python / Ruby)
        const trailingHash = remaining.match(/^(.*?)( # .*)$/);
        if (trailingHash) {
            html = highlightCodePart(trailingHash[1]) + '<span class="code-comment">' + escapeHtml(trailingHash[2]) + '</span>';
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
