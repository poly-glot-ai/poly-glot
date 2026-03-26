/**
 * Sample code snippets for interactive demo
 * Each sample includes before (uncommented/poorly commented) and after (well-documented) versions
 */

export interface DemoSample {
    language: string;
    displayName: string;
    before: string;
    after: string;
    description: string;
}

export const DEMO_SAMPLES: Record<string, DemoSample> = {
    javascript: {
        language: 'javascript',
        displayName: 'JavaScript',
        description: 'Age calculator with JSDoc comments',
        before: `// calculates user age
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    // check if birthday happened this year
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
 * console.log(age); // 35 (in 2026)
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
        language: 'python',
        displayName: 'Python',
        description: 'Data processor with Google-style docstrings',
        before: `# process data
def process_data(data, threshold=0.5):
    # filter out invalid items
    valid = [x for x in data if x > threshold]
    # calculate stats
    avg = sum(valid) / len(valid) if valid else 0
    return {'average': avg, 'count': len(valid)}`,
        after: `def process_data(data, threshold=0.5):
    """
    Process numerical data by filtering and calculating statistics.
    
    Filters out values below a threshold and computes aggregate statistics
    on the remaining valid data points.
    
    Args:
        data (list[float]): List of numerical values to process
        threshold (float, optional): Minimum value to include. Defaults to 0.5.
    
    Returns:
        dict: Dictionary containing:
            - average (float): Mean of valid values, or 0 if none valid
            - count (int): Number of values above threshold
    
    Raises:
        TypeError: If data is not iterable or contains non-numeric values
    
    Example:
        >>> process_data([0.3, 0.7, 0.9, 0.2], threshold=0.5)
        {'average': 0.8, 'count': 2}
    """
    # Filter out values below the threshold
    valid = [x for x in data if x > threshold]
    
    # Calculate average, handling empty list case
    avg = sum(valid) / len(valid) if valid else 0
    
    return {'average': avg, 'count': len(valid)}`
    },

    typescript: {
        language: 'typescript',
        displayName: 'TypeScript',
        description: 'API client with TSDoc comments',
        before: `// fetch user data
async function fetchUser(userId: string) {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
}`,
        after: `/**
 * Fetches user data from the API by user ID
 * 
 * @param userId - The unique identifier of the user to fetch
 * @returns Promise resolving to the user data object
 * @throws {Error} If the API request fails or returns non-OK status
 * 
 * @example
 * \`\`\`typescript
 * const user = await fetchUser('user-123');
 * console.log(user.name);
 * \`\`\`
 */
async function fetchUser(userId: string): Promise<any> {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
        throw new Error(\`Failed to fetch user: \${response.statusText}\`);
    }
    
    return response.json();
}`
    },

    java: {
        language: 'java',
        displayName: 'Java',
        description: 'String utility with Javadoc',
        before: `// check if string is palindrome
public boolean isPalindrome(String str) {
    str = str.replaceAll("\\\\s+", "").toLowerCase();
    int left = 0, right = str.length() - 1;
    while (left < right) {
        if (str.charAt(left++) != str.charAt(right--)) return false;
    }
    return true;
}`,
        after: `/**
 * Checks if a given string is a palindrome (reads the same forwards and backwards).
 * 
 * This method ignores whitespace and is case-insensitive.
 * 
 * @param str the string to check for palindrome property
 * @return {@code true} if the string is a palindrome, {@code false} otherwise
 * @throws NullPointerException if str is null
 * 
 * @example
 * <pre>
 * isPalindrome("A man a plan a canal Panama") // returns true
 * isPalindrome("Hello") // returns false
 * </pre>
 */
public boolean isPalindrome(String str) {
    // Remove whitespace and convert to lowercase for comparison
    str = str.replaceAll("\\\\s+", "").toLowerCase();
    
    int left = 0;
    int right = str.length() - 1;
    
    // Compare characters from both ends moving inward
    while (left < right) {
        if (str.charAt(left++) != str.charAt(right--)) {
            return false;
        }
    }
    
    return true;
}`
    },

    go: {
        language: 'go',
        displayName: 'Go',
        description: 'HTTP handler with GoDoc',
        before: `// handle health check
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}`,
        after: `// HealthCheckHandler returns the health status of the service.
// It always responds with HTTP 200 and a JSON payload indicating the service is operational.
//
// This endpoint is typically used by load balancers and monitoring systems to verify
// that the service is running and responsive.
//
// Parameters:
//   - w: http.ResponseWriter to write the response
//   - r: *http.Request containing the incoming request (unused)
//
// Response format:
//   {"status": "ok"}
//
// Example usage:
//   http.HandleFunc("/health", HealthCheckHandler)
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
    // Set successful status code
    w.WriteHeader(http.StatusOK)
    
    // Encode and send JSON response
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}`
    },

    rust: {
        language: 'rust',
        displayName: 'Rust',
        description: 'Vector operation with Rust doc comments',
        before: `// find max value
fn find_max(numbers: &[i32]) -> Option<i32> {
    if numbers.is_empty() { return None; }
    Some(*numbers.iter().max().unwrap())
}`,
        after: `/// Finds the maximum value in a slice of integers.
///
/// Returns \`None\` if the slice is empty, otherwise returns \`Some(max_value)\`.
///
/// # Arguments
///
/// * \`numbers\` - A slice of i32 values to search
///
/// # Returns
///
/// * \`Some(i32)\` - The maximum value if the slice is not empty
/// * \`None\` - If the slice is empty
///
/// # Examples
///
/// \`\`\`
/// let numbers = vec![1, 5, 3, 9, 2];
/// assert_eq!(find_max(&numbers), Some(9));
///
/// let empty: Vec<i32> = vec![];
/// assert_eq!(find_max(&empty), None);
/// \`\`\`
fn find_max(numbers: &[i32]) -> Option<i32> {
    // Return None early if the slice is empty
    if numbers.is_empty() {
        return None;
    }
    
    // Use iterator to find maximum value
    Some(*numbers.iter().max().unwrap())
}`
    }
};

export function getSampleLanguages(): string[] {
    return Object.keys(DEMO_SAMPLES);
}

export function getSample(language: string): DemoSample | null {
    return DEMO_SAMPLES[language] || null;
}
