// CLI Demo Modal — poly-glot.ai
// All 12 languages × 3 modes: comment · why · both
// "comment" = standardised doc-block only
// "why"     = inline why-comments only (no doc-block)
// "both"    = doc-block first, then why-comments inline

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // DEMO SAMPLES  (12 languages × { before, comment, why, both })
    // ─────────────────────────────────────────────────────────────────────────
    const SAMPLES = {

        // ── 1. JavaScript ────────────────────────────────────────────────────
        javascript: {
            displayName: 'JavaScript',
            description:  'Age calculator',
            before:
`// calculates user age
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/**
 * Calculates a person's exact age in years from their birth date.
 *
 * @param {string} birthDate - ISO-format date string (YYYY-MM-DD).
 * @returns {number} Whole years elapsed since birthDate.
 * @throws {Error} If birthDate is invalid or set in the future.
 *
 * @example
 * calculateAge('1990-05-15'); // → 35 (in 2026)
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

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`function calculateAge(birthDate) {
    // Why new Date() each call: avoids stale closures in long-running
    // server processes that span midnight.
    const today = new Date();
    const birth = new Date(birthDate);

    // Why explicit NaN check: new Date('garbage') silently returns
    // Invalid Date; without this guard the subtraction returns NaN and
    // propagates silently through downstream calculations.
    if (isNaN(birth.getTime())) {
        throw new Error('Invalid birth date format');
    }
    if (birth > today) {
        throw new Error('Birth date cannot be in the future');
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Why adjust after full-year subtraction: subtracting years alone
    // overcounts by 1 for people whose birthday hasn't happened yet
    // this calendar year (e.g., born Dec 31, checking on Jan 1).
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/**
 * Calculates a person's exact age in years from their birth date.
 *
 * @param {string} birthDate - ISO-format date string (YYYY-MM-DD).
 * @returns {number} Whole years elapsed since birthDate.
 * @throws {Error} If birthDate is invalid or set in the future.
 *
 * @example
 * calculateAge('1990-05-15'); // → 35 (in 2026)
 */
function calculateAge(birthDate) {
    // Why new Date() each call: avoids stale closures in long-running
    // server processes that span midnight.
    const today = new Date();
    const birth = new Date(birthDate);

    // Why explicit NaN check: new Date('garbage') silently returns
    // Invalid Date; without this guard the subtraction returns NaN and
    // propagates silently through downstream calculations.
    if (isNaN(birth.getTime())) {
        throw new Error('Invalid birth date format');
    }
    if (birth > today) {
        throw new Error('Birth date cannot be in the future');
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Why adjust after full-year subtraction: subtracting years alone
    // overcounts by 1 for people whose birthday hasn't happened yet
    // this calendar year (e.g., born Dec 31, checking on Jan 1).
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}`
        },

        // ── 2. Python ────────────────────────────────────────────────────────
        python: {
            displayName: 'Python',
            description:  'Data processor',
            before:
`# process data
def process_data(data, threshold=0.5):
    # filter out invalid items
    valid = [x for x in data if x > threshold]
    # calculate stats
    avg = sum(valid) / len(valid) if valid else 0
    return {'average': avg, 'count': len(valid)}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`def process_data(data, threshold=0.5):
    """
    Filter numerical data and compute aggregate statistics.

    Retains only values strictly above the threshold, then
    computes the mean of the surviving values.

    Args:
        data (list[float]): Raw numerical values to process.
        threshold (float): Minimum value to retain. Defaults to 0.5.

    Returns:
        dict: A dictionary with two keys:
            average (float): Mean of valid values, or 0.0 if none pass.
            count (int): Number of values above the threshold.

    Raises:
        TypeError: If data is not iterable or contains non-numeric values.

    Example:
        >>> process_data([0.3, 0.7, 0.9, 0.2], threshold=0.5)
        {'average': 0.8, 'count': 2}
    """
    valid = [x for x in data if x > threshold]
    avg = sum(valid) / len(valid) if valid else 0
    return {'average': avg, 'count': len(valid)}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`def process_data(data, threshold=0.5):
    # Why list-comp over filter(): list-comp materialises a concrete list
    # that sum() and len() can traverse without double-iteration.
    valid = [x for x in data if x > threshold]

    # Why ternary guard: prevents ZeroDivisionError when every value is
    # below threshold; returning 0 is semantically correct (no valid data).
    avg = sum(valid) / len(valid) if valid else 0

    # Why dict return instead of tuple: named keys make downstream code
    # self-documenting and prevent silent positional-unpacking mistakes.
    return {'average': avg, 'count': len(valid)}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`def process_data(data, threshold=0.5):
    """
    Filter numerical data and compute aggregate statistics.

    Retains only values strictly above the threshold, then
    computes the mean of the surviving values.

    Args:
        data (list[float]): Raw numerical values to process.
        threshold (float): Minimum value to retain. Defaults to 0.5.

    Returns:
        dict: A dictionary with two keys:
            average (float): Mean of valid values, or 0.0 if none pass.
            count (int): Number of values above the threshold.

    Raises:
        TypeError: If data is not iterable or contains non-numeric values.

    Example:
        >>> process_data([0.3, 0.7, 0.9, 0.2], threshold=0.5)
        {'average': 0.8, 'count': 2}
    """
    # Why list-comp over filter(): list-comp materialises a concrete list
    # that sum() and len() can traverse without double-iteration.
    valid = [x for x in data if x > threshold]

    # Why ternary guard: prevents ZeroDivisionError when every value is
    # below threshold; returning 0 is semantically correct (no valid data).
    avg = sum(valid) / len(valid) if valid else 0

    # Why dict return instead of tuple: named keys make downstream code
    # self-documenting and prevent silent positional-unpacking mistakes.
    return {'average': avg, 'count': len(valid)}`
        },

        // ── 3. TypeScript ────────────────────────────────────────────────────
        typescript: {
            displayName: 'TypeScript',
            description:  'API client',
            before:
`// fetch user data
async function fetchUser(userId: string) {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/**
 * Fetches a user record from the REST API by ID.
 *
 * @param userId - Unique identifier of the user to retrieve.
 * @returns Promise resolving to the parsed user JSON object.
 * @throws {Error} When the network request fails or the server
 *   returns a non-2xx status code.
 *
 * @example
 * \`\`\`typescript
 * const user = await fetchUser('usr_42');
 * console.log(user.email);
 * \`\`\`
 */
async function fetchUser(userId: string): Promise<unknown> {
    const response = await fetch(\`/api/users/\${userId}\`);

    if (!response.ok) {
        throw new Error(\`Failed to fetch user: \${response.statusText}\`);
    }

    return response.json();
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`async function fetchUser(userId: string): Promise<unknown> {
    const response = await fetch(\`/api/users/\${userId}\`);

    // Why check response.ok before .json(): fetch() only rejects on
    // network failure, not on HTTP 4xx/5xx — without this guard a 404
    // would silently return an error body as if it were valid data.
    if (!response.ok) {
        // Why include statusText: gives callers actionable context
        // (e.g., "404 Not Found") without a separate status check.
        throw new Error(\`Failed to fetch user: \${response.statusText}\`);
    }

    // Why return response.json() directly: the caller owns the await
    // chain; returning the promise keeps the function composable.
    return response.json();
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/**
 * Fetches a user record from the REST API by ID.
 *
 * @param userId - Unique identifier of the user to retrieve.
 * @returns Promise resolving to the parsed user JSON object.
 * @throws {Error} When the network request fails or the server
 *   returns a non-2xx status code.
 *
 * @example
 * \`\`\`typescript
 * const user = await fetchUser('usr_42');
 * console.log(user.email);
 * \`\`\`
 */
async function fetchUser(userId: string): Promise<unknown> {
    const response = await fetch(\`/api/users/\${userId}\`);

    // Why check response.ok before .json(): fetch() only rejects on
    // network failure, not on HTTP 4xx/5xx — without this guard a 404
    // would silently return an error body as if it were valid data.
    if (!response.ok) {
        // Why include statusText: gives callers actionable context
        // (e.g., "404 Not Found") without a separate status check.
        throw new Error(\`Failed to fetch user: \${response.statusText}\`);
    }

    // Why return response.json() directly: the caller owns the await
    // chain; returning the promise keeps the function composable.
    return response.json();
}`
        },

        // ── 4. Java ──────────────────────────────────────────────────────────
        java: {
            displayName: 'Java',
            description:  'String utility',
            before:
`// check if string is palindrome
public boolean isPalindrome(String str) {
    str = str.replaceAll("\\s+", "").toLowerCase();
    int left = 0, right = str.length() - 1;
    while (left < right) {
        if (str.charAt(left++) != str.charAt(right--)) return false;
    }
    return true;
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/**
 * Determines whether a string is a palindrome.
 *
 * <p>Whitespace is stripped and the comparison is case-insensitive,
 * so {@code "A man a plan a canal Panama"} returns {@code true}.
 *
 * @param str the candidate string; must not be {@code null}
 * @return {@code true} if {@code str} reads identically forwards
 *         and backwards after normalisation; {@code false} otherwise
 * @throws NullPointerException if {@code str} is {@code null}
 */
public boolean isPalindrome(String str) {
    str = str.replaceAll("\\s+", "").toLowerCase();

    int left  = 0;
    int right = str.length() - 1;

    while (left < right) {
        if (str.charAt(left++) != str.charAt(right--)) {
            return false;
        }
    }

    return true;
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`public boolean isPalindrome(String str) {
    // Why replaceAll before toLowerCase: normalising whitespace first
    // prevents edge cases where Unicode whitespace affects case mapping.
    str = str.replaceAll("\\s+", "").toLowerCase();

    int left  = 0;
    int right = str.length() - 1;

    // Why two-pointer instead of StringBuilder.reverse(): avoids
    // allocating a second string — O(1) space vs O(n) for a full copy.
    while (left < right) {
        if (str.charAt(left++) != str.charAt(right--)) {
            // Why return false immediately: early exit skips unnecessary
            // comparisons once a mismatch is confirmed.
            return false;
        }
    }

    return true;
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/**
 * Determines whether a string is a palindrome.
 *
 * <p>Whitespace is stripped and the comparison is case-insensitive,
 * so {@code "A man a plan a canal Panama"} returns {@code true}.
 *
 * @param str the candidate string; must not be {@code null}
 * @return {@code true} if {@code str} reads identically forwards
 *         and backwards after normalisation; {@code false} otherwise
 * @throws NullPointerException if {@code str} is {@code null}
 */
public boolean isPalindrome(String str) {
    // Why replaceAll before toLowerCase: normalising whitespace first
    // prevents edge cases where Unicode whitespace affects case mapping.
    str = str.replaceAll("\\s+", "").toLowerCase();

    int left  = 0;
    int right = str.length() - 1;

    // Why two-pointer instead of StringBuilder.reverse(): avoids
    // allocating a second string — O(1) space vs O(n) for a full copy.
    while (left < right) {
        if (str.charAt(left++) != str.charAt(right--)) {
            // Why return false immediately: early exit skips unnecessary
            // comparisons once a mismatch is confirmed.
            return false;
        }
    }

    return true;
}`
        },

        // ── 5. C++ ───────────────────────────────────────────────────────────
        cpp: {
            displayName: 'C++',
            description:  'Binary search',
            before:
`// binary search
int binarySearch(std::vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/**
 * @brief Searches a sorted vector for a target value.
 *
 * Performs standard binary search in O(log n) time.
 * The vector must be sorted in ascending order; behaviour
 * is undefined for unsorted input.
 *
 * @param arr    Reference to the sorted integer vector.
 * @param target The integer value to locate.
 * @return Zero-based index of target if found, or -1 if absent.
 *
 * @example
 * @code
 * std::vector<int> v{1, 3, 5, 7, 9};
 * binarySearch(v, 5); // returns 2
 * @endcode
 */
int binarySearch(std::vector<int>& arr, int target) {
    int left  = 0;
    int right = static_cast<int>(arr.size()) - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;
        if (arr[mid] < target)  left  = mid + 1;
        else                    right = mid - 1;
    }

    return -1;
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`int binarySearch(std::vector<int>& arr, int target) {
    int left  = 0;
    int right = static_cast<int>(arr.size()) - 1;

    while (left <= right) {
        // Why (left + (right-left)/2) not (left+right)/2:
        // prevents signed integer overflow when both indices are
        // large — a classic C++ pitfall with 32-bit int.
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;

        // Why separate branches for < and >: makes the narrowing
        // logic explicit and avoids implicit-else confusion during
        // optimisation passes or code review.
        if (arr[mid] < target) {
            left  = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    // Why -1 sentinel: aligns with the std::string::npos convention
    // and avoids wrapping the return in std::optional for a utility.
    return -1;
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/**
 * @brief Searches a sorted vector for a target value.
 *
 * Performs standard binary search in O(log n) time.
 * The vector must be sorted in ascending order; behaviour
 * is undefined for unsorted input.
 *
 * @param arr    Reference to the sorted integer vector.
 * @param target The integer value to locate.
 * @return Zero-based index of target if found, or -1 if absent.
 *
 * @example
 * @code
 * std::vector<int> v{1, 3, 5, 7, 9};
 * binarySearch(v, 5); // returns 2
 * @endcode
 */
int binarySearch(std::vector<int>& arr, int target) {
    int left  = 0;
    int right = static_cast<int>(arr.size()) - 1;

    while (left <= right) {
        // Why (left + (right-left)/2) not (left+right)/2:
        // prevents signed integer overflow when both indices are
        // large — a classic C++ pitfall with 32-bit int.
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;

        // Why separate branches for < and >: makes the narrowing
        // logic explicit and avoids implicit-else confusion during
        // optimisation passes or code review.
        if (arr[mid] < target) {
            left  = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    // Why -1 sentinel: aligns with the std::string::npos convention
    // and avoids wrapping the return in std::optional for a utility.
    return -1;
}`
        },

        // ── 6. C# ────────────────────────────────────────────────────────────
        csharp: {
            displayName: 'C#',
            description:  'Email validator',
            before:
`// validate email
public bool IsValidEmail(string email) {
    if (string.IsNullOrWhiteSpace(email)) return false;
    var pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
    return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/// <summary>
/// Determines whether an email address is syntactically valid.
/// </summary>
/// <remarks>
/// Uses a lightweight regex: one @ symbol, non-empty local part,
/// and a domain containing at least one dot. Full RFC 5321
/// compliance is intentionally out of scope.
/// </remarks>
/// <param name="email">The email string to validate.</param>
/// <returns>
///   <c>true</c> if <paramref name="email"/> matches the expected
///   format; <c>false</c> if null, whitespace, or malformed.
/// </returns>
/// <example>
/// <code>
/// IsValidEmail("user@example.com"); // true
/// IsValidEmail("not-an-email");     // false
/// </code>
/// </example>
public bool IsValidEmail(string email) {
    if (string.IsNullOrWhiteSpace(email)) return false;

    var pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
    return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`public bool IsValidEmail(string email) {
    // Why IsNullOrWhiteSpace instead of == null: catches empty strings
    // and whitespace-only strings that the regex would incorrectly pass.
    if (string.IsNullOrWhiteSpace(email)) return false;

    // Why a simple pattern over full RFC 5321 regex: production email
    // validation should confirm deliverability, not parse grammar;
    // over-strict patterns reject valid addresses like user+tag@host.
    var pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";

    // Why IgnoreCase: the domain part is case-insensitive per RFC 5321;
    // the flag prevents false negatives on uppercase TLDs from some
    // mobile keyboards at zero performance cost.
    return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/// <summary>
/// Determines whether an email address is syntactically valid.
/// </summary>
/// <remarks>
/// Uses a lightweight regex: one @ symbol, non-empty local part,
/// and a domain containing at least one dot. Full RFC 5321
/// compliance is intentionally out of scope.
/// </remarks>
/// <param name="email">The email string to validate.</param>
/// <returns>
///   <c>true</c> if <paramref name="email"/> matches the expected
///   format; <c>false</c> if null, whitespace, or malformed.
/// </returns>
public bool IsValidEmail(string email) {
    // Why IsNullOrWhiteSpace instead of == null: catches empty strings
    // and whitespace-only strings that the regex would incorrectly pass.
    if (string.IsNullOrWhiteSpace(email)) return false;

    // Why a simple pattern over full RFC 5321 regex: production email
    // validation should confirm deliverability, not parse grammar;
    // over-strict patterns reject valid addresses like user+tag@host.
    var pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";

    // Why IgnoreCase: the domain part is case-insensitive per RFC 5321;
    // the flag prevents false negatives on uppercase TLDs from some
    // mobile keyboards at zero performance cost.
    return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
}`
        },

        // ── 7. Go ────────────────────────────────────────────────────────────
        go: {
            displayName: 'Go',
            description:  'HTTP handler',
            before:
`// handle health check
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`// HealthCheckHandler responds with HTTP 200 and a JSON health payload.
//
// It is designed for load balancers and uptime monitors that require a
// lightweight liveness probe. The request body and headers are ignored —
// only network connectivity is verified.
//
// Response body:
//
//	{"status": "ok"}
//
// Example:
//
//	http.HandleFunc("/health", HealthCheckHandler)
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
    // Why WriteHeader before Encode: Go sends headers automatically on
    // the first Write; being explicit here makes the intended status
    // visible in code review and easier to change (e.g., 503 on
    // degraded state) without hunting for an implicit send.
    w.WriteHeader(http.StatusOK)

    // Why json.NewEncoder(w) instead of json.Marshal + w.Write:
    // NewEncoder streams directly to the ResponseWriter, avoiding an
    // intermediate []byte allocation for this small fixed-size payload.
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) //nolint:errcheck
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`// HealthCheckHandler responds with HTTP 200 and a JSON health payload.
//
// It is designed for load balancers and uptime monitors that require a
// lightweight liveness probe. The request body and headers are ignored —
// only network connectivity is verified.
//
// Response body:
//
//	{"status": "ok"}
//
// Example:
//
//	http.HandleFunc("/health", HealthCheckHandler)
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
    // Why WriteHeader before Encode: Go sends headers automatically on
    // the first Write; being explicit here makes the intended status
    // visible in code review and easier to change (e.g., 503 on
    // degraded state) without hunting for an implicit send.
    w.WriteHeader(http.StatusOK)

    // Why json.NewEncoder(w) instead of json.Marshal + w.Write:
    // NewEncoder streams directly to the ResponseWriter, avoiding an
    // intermediate []byte allocation for this small fixed-size payload.
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) //nolint:errcheck
}`
        },

        // ── 8. Rust ──────────────────────────────────────────────────────────
        rust: {
            displayName: 'Rust',
            description:  'Slice utility',
            before:
`// find max value
fn find_max(numbers: &[i32]) -> Option<i32> {
    if numbers.is_empty() { return None; }
    Some(*numbers.iter().max().unwrap())
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/// Returns the maximum value in a slice of integers.
///
/// Yields \`None\` for an empty slice and \`Some(max)\` otherwise.
/// Ownership is not taken — the slice is borrowed for the call only.
///
/// # Arguments
///
/// * \`numbers\` — a borrowed slice of \`i32\` values to inspect.
///
/// # Returns
///
/// * \`Some(i32)\` — the largest value if the slice is non-empty.
/// * \`None\`      — if the slice contains no elements.
///
/// # Examples
///
/// \`\`\`
/// assert_eq!(find_max(&[1, 5, 3, 9, 2]), Some(9));
/// assert_eq!(find_max(&[]),              None);
/// \`\`\`
fn find_max(numbers: &[i32]) -> Option<i32> {
    if numbers.is_empty() {
        return None;
    }
    Some(*numbers.iter().max().unwrap())
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`fn find_max(numbers: &[i32]) -> Option<i32> {
    // Why explicit early return instead of matching on iter().max():
    // the guard documents the empty-slice contract at the top of the
    // function, making it immediately visible to callers reading only
    // the first few lines.
    if numbers.is_empty() {
        return None;
    }

    // Why unwrap() after the is_empty guard: the guard above guarantees
    // the iterator is non-empty so max() will always be Some —
    // the unwrap cannot panic and avoids a redundant Option layer.
    Some(*numbers.iter().max().unwrap())
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/// Returns the maximum value in a slice of integers.
///
/// Yields \`None\` for an empty slice and \`Some(max)\` otherwise.
/// Ownership is not taken — the slice is borrowed for the call only.
///
/// # Arguments
///
/// * \`numbers\` — a borrowed slice of \`i32\` values to inspect.
///
/// # Returns
///
/// * \`Some(i32)\` — the largest value if the slice is non-empty.
/// * \`None\`      — if the slice contains no elements.
///
/// # Examples
///
/// \`\`\`
/// assert_eq!(find_max(&[1, 5, 3, 9, 2]), Some(9));
/// assert_eq!(find_max(&[]),              None);
/// \`\`\`
fn find_max(numbers: &[i32]) -> Option<i32> {
    // Why explicit early return instead of matching on iter().max():
    // the guard documents the empty-slice contract at the top of the
    // function, making it immediately visible to callers reading only
    // the first few lines.
    if numbers.is_empty() {
        return None;
    }

    // Why unwrap() after the is_empty guard: the guard above guarantees
    // the iterator is non-empty so max() will always be Some —
    // the unwrap cannot panic and avoids a redundant Option layer.
    Some(*numbers.iter().max().unwrap())
}`
        },

        // ── 9. Ruby ──────────────────────────────────────────────────────────
        ruby: {
            displayName: 'Ruby',
            description:  'String helper',
            before:
`# truncate text
def truncate(text, max_length = 100)
    return text if text.length <= max_length
    text[0, max_length - 3] + '...'
end`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`# Truncates a string to a maximum length, appending an ellipsis.
#
# If the string is already within the limit it is returned unchanged.
# The ellipsis counts toward the max_length budget so the returned
# string never exceeds max_length characters.
#
# @param text       [String]  The source string to truncate.
# @param max_length [Integer] Maximum character count including ellipsis.
#   Defaults to 100.
#
# @return [String] Original string if within limit; truncated form otherwise.
#
# @example
#   truncate("Hello, world!", 8)  #=> "Hello..."
#   truncate("Hi", 100)           #=> "Hi"
def truncate(text, max_length = 100)
    return text if text.length <= max_length
    text[0, max_length - 3] + '...'
end`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`def truncate(text, max_length = 100)
    # Why guard with early return: avoids the slice + concatenation
    # allocations for the common case where no truncation is needed.
    return text if text.length <= max_length

    # Why (max_length - 3): reserves exactly three characters for the
    # ellipsis, ensuring the result is never longer than max_length.
    # Using the single-character "…" (U+2026) would be shorter but
    # breaks rendering in some ASCII-only terminals and log viewers.
    text[0, max_length - 3] + '...'
end`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`# Truncates a string to a maximum length, appending an ellipsis.
#
# If the string is already within the limit it is returned unchanged.
# The ellipsis counts toward the max_length budget so the returned
# string never exceeds max_length characters.
#
# @param text       [String]  The source string to truncate.
# @param max_length [Integer] Maximum character count including ellipsis.
#   Defaults to 100.
#
# @return [String] Original string if within limit; truncated form otherwise.
#
# @example
#   truncate("Hello, world!", 8)  #=> "Hello..."
#   truncate("Hi", 100)           #=> "Hi"
def truncate(text, max_length = 100)
    # Why guard with early return: avoids the slice + concatenation
    # allocations for the common case where no truncation is needed.
    return text if text.length <= max_length

    # Why (max_length - 3): reserves exactly three characters for the
    # ellipsis, ensuring the result is never longer than max_length.
    # Using the single-character "…" (U+2026) would be shorter but
    # breaks rendering in some ASCII-only terminals and log viewers.
    text[0, max_length - 3] + '...'
end`
        },

        // ── 10. PHP ──────────────────────────────────────────────────────────
        php: {
            displayName: 'PHP',
            description:  'Array utility',
            before:
`// group items by key
function groupBy(array $items, string $key): array {
    $groups = [];
    foreach ($items as $item) {
        $val = $item[$key] ?? 'unknown';
        $groups[$val][] = $item;
    }
    return $groups;
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/**
 * Groups an array of associative arrays by the value of a shared key.
 *
 * Items that lack the specified key are collected under the 'unknown'
 * group rather than being silently dropped, preserving data integrity
 * for downstream consumers.
 *
 * @param array<int, array<string, mixed>> $items
 *   Flat list of associative arrays to group.
 * @param string $key
 *   The key whose value determines group membership.
 *
 * @return array<string, array<int, array<string, mixed>>>
 *   Map of group-name to list of matching items.
 *
 * @example
 * $rows = [
 *     ['type' => 'fruit', 'name' => 'apple'],
 *     ['type' => 'veg',   'name' => 'carrot'],
 * ];
 * groupBy($rows, 'type'); // ['fruit' => [...], 'veg' => [...]]
 */
function groupBy(array $items, string $key): array {
    $groups = [];
    foreach ($items as $item) {
        $val = $item[$key] ?? 'unknown';
        $groups[$val][] = $item;
    }
    return $groups;
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`function groupBy(array $items, string $key): array {
    $groups = [];

    foreach ($items as $item) {
        // Why null-coalesce to 'unknown' instead of skipping: dropping
        // items silently makes missing-data bugs very hard to diagnose;
        // a dedicated 'unknown' bucket makes the gap immediately visible.
        $val = $item[$key] ?? 'unknown';

        // Why $groups[$val][] instead of array_push: the [] shorthand
        // auto-initialises the sub-array on first use, removing the need
        // for an isset() guard and keeping the loop body minimal.
        $groups[$val][] = $item;
    }

    return $groups;
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/**
 * Groups an array of associative arrays by the value of a shared key.
 *
 * Items that lack the specified key are collected under the 'unknown'
 * group rather than being silently dropped, preserving data integrity
 * for downstream consumers.
 *
 * @param array<int, array<string, mixed>> $items
 *   Flat list of associative arrays to group.
 * @param string $key
 *   The key whose value determines group membership.
 *
 * @return array<string, array<int, array<string, mixed>>>
 *   Map of group-name to list of matching items.
 */
function groupBy(array $items, string $key): array {
    $groups = [];

    foreach ($items as $item) {
        // Why null-coalesce to 'unknown' instead of skipping: dropping
        // items silently makes missing-data bugs very hard to diagnose;
        // a dedicated 'unknown' bucket makes the gap immediately visible.
        $val = $item[$key] ?? 'unknown';

        // Why $groups[$val][] instead of array_push: the [] shorthand
        // auto-initialises the sub-array on first use, removing the need
        // for an isset() guard and keeping the loop body minimal.
        $groups[$val][] = $item;
    }

    return $groups;
}`
        },

        // ── 11. Swift ────────────────────────────────────────────────────────
        swift: {
            displayName: 'Swift',
            description:  'Collection helper',
            before:
`// chunk array into pages
func chunked<T>(array: [T], size: Int) -> [[T]] {
    var chunks: [[T]] = []
    var index = 0
    while index < array.count {
        chunks.append(Array(array[index..<min(index + size, array.count)]))
        index += size
    }
    return chunks
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/// Splits an array into consecutive sub-arrays of a fixed size.
///
/// The last chunk may contain fewer elements than \`size\` when the
/// array length is not evenly divisible. Returns an empty array when
/// the source is empty or \`size\` is less than or equal to zero.
///
/// - Parameters:
///   - array: The source array to partition. Generic over element type \`T\`.
///   - size:  Maximum number of elements per chunk. Must be > 0.
///
/// - Returns: An array of sub-arrays, each at most \`size\` elements long.
///
/// - Example:
/// \`\`\`swift
/// chunked(array: [1, 2, 3, 4, 5], size: 2) // [[1,2],[3,4],[5]]
/// \`\`\`
func chunked<T>(array: [T], size: Int) -> [[T]] {
    guard size > 0 else { return [] }

    var chunks: [[T]] = []
    var index = 0

    while index < array.count {
        let end = min(index + size, array.count)
        chunks.append(Array(array[index..<end]))
        index += size
    }

    return chunks
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`func chunked<T>(array: [T], size: Int) -> [[T]] {
    // Why guard size > 0: an invalid size causes an infinite loop
    // (index never advances) or a runtime crash on slice creation.
    guard size > 0 else { return [] }

    var chunks: [[T]] = []
    var index = 0

    while index < array.count {
        // Why min(index + size, array.count): prevents the upper bound
        // from exceeding the valid index range on the final chunk,
        // avoiding an out-of-bounds trap in Swift debug builds.
        let end = min(index + size, array.count)
        chunks.append(Array(array[index..<end]))

        // Why advance unconditionally by size: each iteration consumes
        // exactly one chunk-worth of elements; the while condition
        // handles the terminal case where fewer elements remain.
        index += size
    }

    return chunks
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/// Splits an array into consecutive sub-arrays of a fixed size.
///
/// The last chunk may contain fewer elements than \`size\` when the
/// array length is not evenly divisible. Returns an empty array when
/// the source is empty or \`size\` is less than or equal to zero.
///
/// - Parameters:
///   - array: The source array to partition. Generic over element type \`T\`.
///   - size:  Maximum number of elements per chunk. Must be > 0.
///
/// - Returns: An array of sub-arrays, each at most \`size\` elements long.
///
/// - Example:
/// \`\`\`swift
/// chunked(array: [1, 2, 3, 4, 5], size: 2) // [[1,2],[3,4],[5]]
/// \`\`\`
func chunked<T>(array: [T], size: Int) -> [[T]] {
    // Why guard size > 0: an invalid size causes an infinite loop
    // (index never advances) or a runtime crash on slice creation.
    guard size > 0 else { return [] }

    var chunks: [[T]] = []
    var index = 0

    while index < array.count {
        // Why min(index + size, array.count): prevents the upper bound
        // from exceeding the valid index range on the final chunk,
        // avoiding an out-of-bounds trap in Swift debug builds.
        let end = min(index + size, array.count)
        chunks.append(Array(array[index..<end]))

        // Why advance unconditionally by size: each iteration consumes
        // exactly one chunk-worth of elements; the while condition
        // handles the terminal case where fewer elements remain.
        index += size
    }

    return chunks
}`
        },

        // ── 12. Kotlin ───────────────────────────────────────────────────────
        kotlin: {
            displayName: 'Kotlin',
            description:  'Retry with backoff',
            before:
`// retry with backoff
fun <T> retry(times: Int, block: () -> T): T {
    var lastError: Exception? = null
    repeat(times) { attempt ->
        try { return block() } catch (e: Exception) {
            lastError = e
            Thread.sleep(100L * (attempt + 1))
        }
    }
    throw lastError ?: RuntimeException("Retry failed")
}`,

            // ── comment mode ─────────────────────────────────────────────────
            comment:
`/**
 * Retries a block up to [times] attempts with linear backoff.
 *
 * Each failed attempt waits \`100ms × (attempt + 1)\` before the next
 * retry, giving downstream services time to recover from transient
 * failures. If all attempts fail, the last captured exception is rethrown.
 *
 * @param T     The return type produced by [block].
 * @param times Maximum number of attempts. Should be ≥ 1.
 * @param block The operation to execute and potentially retry.
 * @return The result of the first successful invocation of [block].
 * @throws Exception The last exception thrown after all retries are exhausted.
 *
 * @sample
 * val data = retry(3) { httpClient.get("https://api.example.com/data") }
 */
fun <T> retry(times: Int, block: () -> T): T {
    var lastError: Exception? = null

    repeat(times) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            lastError = e
            Thread.sleep(100L * (attempt + 1))
        }
    }

    throw lastError ?: RuntimeException("Retry failed after $times attempts")
}`,

            // ── why mode ─────────────────────────────────────────────────────
            why:
`fun <T> retry(times: Int, block: () -> T): T {
    // Why nullable lastError instead of a sentinel value: Kotlin's type
    // system enforces handling the null case, preventing an accidental
    // throw of a meaningless RuntimeException when times == 0.
    var lastError: Exception? = null

    repeat(times) { attempt ->
        try {
            // Why non-local return inside try: Kotlin's non-local return
            // exits the enclosing function (not just the lambda), so a
            // successful call immediately propagates the result to the caller.
            return block()
        } catch (e: Exception) {
            lastError = e

            // Why linear not exponential backoff: linear is gentler in
            // unit tests and sufficient for most transient HTTP errors;
            // switch to exponential if retrying against flaky databases.
            Thread.sleep(100L * (attempt + 1))
        }
    }

    // Why Elvis ?: RuntimeException: if times == 0 the loop never runs
    // and lastError stays null — the fallback ensures we always throw
    // a meaningful exception rather than crashing with a NullPointerException.
    throw lastError ?: RuntimeException("Retry failed after $times attempts")
}`,

            // ── both mode ────────────────────────────────────────────────────
            both:
`/**
 * Retries a block up to [times] attempts with linear backoff.
 *
 * Each failed attempt waits \`100ms × (attempt + 1)\` before the next
 * retry, giving downstream services time to recover from transient
 * failures. If all attempts fail, the last captured exception is rethrown.
 *
 * @param T     The return type produced by [block].
 * @param times Maximum number of attempts. Should be ≥ 1.
 * @param block The operation to execute and potentially retry.
 * @return The result of the first successful invocation of [block].
 * @throws Exception The last exception thrown after all retries are exhausted.
 */
fun <T> retry(times: Int, block: () -> T): T {
    // Why nullable lastError instead of a sentinel value: Kotlin's type
    // system enforces handling the null case, preventing an accidental
    // throw of a meaningless RuntimeException when times == 0.
    var lastError: Exception? = null

    repeat(times) { attempt ->
        try {
            // Why non-local return inside try: Kotlin's non-local return
            // exits the enclosing function (not just the lambda), so a
            // successful call immediately propagates the result to the caller.
            return block()
        } catch (e: Exception) {
            lastError = e

            // Why linear not exponential backoff: linear is gentler in
            // unit tests and sufficient for most transient HTTP errors;
            // switch to exponential if retrying against flaky databases.
            Thread.sleep(100L * (attempt + 1))
        }
    }

    // Why Elvis ?: RuntimeException: if times == 0 the loop never runs
    // and lastError stays null — the fallback ensures we always throw
    // a meaningful exception rather than crashing with a NullPointerException.
    throw lastError ?: RuntimeException("Retry failed after $times attempts")
}`
        }

    }; // end SAMPLES

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /** Type code character-by-character with a blinking cursor */
    async function typeCode(el, code, speed) {
        speed = speed || 13;
        el.textContent = '';
        el.classList.add('typing');
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let current = '';
            for (const ch of line) {
                current += ch;
                el.textContent = lines.slice(0, i).join('\n') + (i > 0 ? '\n' : '') + current;
                await sleep((ch === ' ' || ch === '\t') ? speed / 3 : speed);
            }
            if (i < lines.length - 1) {
                el.textContent += '\n';
                await sleep(speed * 2);
            }
        }
        setTimeout(() => el.classList.remove('typing'), 500);
    }

    /** Returns the correct after-content for the active mode */
    function getAfterContent(sample) {
        const modeEl = document.getElementById('cliDemoMode');
        const mode   = modeEl ? modeEl.value : 'comment';
        return sample[mode] || sample.comment;
    }

    /** Returns a human label for the current mode */
    function getModeLabel() {
        const modeEl = document.getElementById('cliDemoMode');
        const mode   = modeEl ? modeEl.value : 'comment';
        const labels = { comment: 'Doc Comments', why: 'Why Comments', both: 'Both Modes' };
        return labels[mode] || 'Doc Comments';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE DEMO
    // ─────────────────────────────────────────────────────────────────────────
    async function showLanguageDemo(lang) {
        const sample = SAMPLES[lang];
        if (!sample) return;

        // Swap grid → panels
        const selector = document.getElementById('cliDemoLanguageGrid').parentElement;
        const panels   = document.getElementById('cliDemoPanels');
        selector.style.display = 'none';
        panels.style.display   = 'grid';

        // Update After panel header to reflect mode
        const afterHeader = document.querySelector('#cliDemoPanels .cli-demo-panel:last-child .cli-demo-panel-title');
        if (afterHeader) {
            afterHeader.textContent = `✅ After: ${getModeLabel()}`;
        }

        const beforeCode = document.querySelector('#cliDemoBefore code');
        const afterCode  = document.querySelector('#cliDemoAfter code');
        beforeCode.textContent = '';
        afterCode.textContent  = '';

        document.querySelectorAll('.cli-demo-lang-card').forEach(c => c.classList.remove('selected'));

        // Animate before panel in and type
        const beforePanel = document.getElementById('cliDemoBefore');
        beforePanel.style.opacity   = '1';
        beforePanel.style.transform = 'scale(1)';
        await sleep(300);
        await typeCode(beforeCode, sample.before, 12);
        await sleep(600);

        // Animate after panel in and type the mode-correct content
        const afterPanel = document.getElementById('cliDemoAfter');
        afterPanel.style.opacity   = '1';
        afterPanel.style.transform = 'scale(1)';
        await sleep(300);
        await typeCode(afterCode, getAfterContent(sample), 10);

        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('cli_demo_language_selected', {
                language: lang,
                mode:     document.getElementById('cliDemoMode')?.value || 'comment'
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GRID
    // ─────────────────────────────────────────────────────────────────────────
    function populateLanguageGrid() {
        const grid = document.getElementById('cliDemoLanguageGrid');
        if (!grid) return;

        Object.keys(SAMPLES).forEach(lang => {
            const s    = SAMPLES[lang];
            const card = document.createElement('div');
            card.className    = 'cli-demo-lang-card';
            card.dataset.lang = lang;
            card.innerHTML    = `
                <div class="cli-demo-lang-name">${s.displayName}</div>
                <div class="cli-demo-lang-desc">${s.description}</div>
            `;
            card.addEventListener('click', () => showLanguageDemo(lang));
            grid.appendChild(card);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODAL OPEN / CLOSE
    // ─────────────────────────────────────────────────────────────────────────
    function openModal() {
        const modal = document.getElementById('cliDemoModal');
        if (!modal) return;
        modal.classList.add('active');
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('cli_demo_opened', { source: 'cli_section' });
        }
    }

    function closeModal() {
        const modal = document.getElementById('cliDemoModal');
        if (!modal) return;
        modal.classList.remove('active');

        setTimeout(() => {
            const selector = document.getElementById('cliDemoLanguageGrid');
            if (selector) selector.parentElement.style.display = 'block';
            const panels = document.getElementById('cliDemoPanels');
            if (panels) panels.style.display = 'none';
            document.querySelectorAll('.cli-demo-lang-card').forEach(c => c.classList.remove('selected'));
            // Reset after-panel header
            const afterHeader = document.querySelector('#cliDemoPanels .cli-demo-panel:last-child .cli-demo-panel-title');
            if (afterHeader) afterHeader.textContent = '✅ After: Professional Documentation';
        }, 300);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    function init() {
        const btn   = document.getElementById('cliDemoBtn');
        const modal = document.getElementById('cliDemoModal');
        const close = document.getElementById('cliDemoModalClose');

        if (!btn || !modal) return;

        populateLanguageGrid();

        btn.addEventListener('click', openModal);
        close.addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
