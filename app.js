// Comment patterns and templates for all supported languages
const commentPatterns = {
    python: {
        single: '#',
        multiStart: '"""',
        multiEnd: '"""',
        docstringStart: '"""',
        docstringEnd: '"""',
        docStyle: 'Sphinx/Google/NumPy',
        functionExample: `def calculate_average(numbers):
    """
    Calculate the arithmetic mean of a list of numbers.
    
    Args:
        numbers (list): A list of numeric values
        
    Returns:
        float: The average of the numbers
        
    Raises:
        ValueError: If the list is empty
        
    Example:
        >>> calculate_average([1, 2, 3, 4, 5])
        3.0
    """
    if not numbers:
        raise ValueError("Cannot calculate average of empty list")
    
    # Sum all numbers and divide by count
    return sum(numbers) / len(numbers)`,
        classExample: `class BankAccount:
    """
    A class representing a bank account with basic operations.
    
    Attributes:
        account_number (str): The unique account identifier
        balance (float): The current account balance
        owner (str): The name of the account owner
    """
    
    def __init__(self, account_number, owner, initial_balance=0):
        """Initialize a new bank account."""
        self.account_number = account_number
        self.owner = owner
        self.balance = initial_balance
    
    def deposit(self, amount):
        """
        Add funds to the account.
        
        Args:
            amount (float): The amount to deposit
            
        Returns:
            float: The new balance
        """
        # Validate positive amount
        if amount > 0:
            self.balance += amount
        return self.balance`,
        bestPractices: [
            'Use docstrings for all public modules, functions, classes, and methods',
            'Follow PEP 257 docstring conventions',
            'Use inline comments sparingly - prefer clear variable names',
            'Keep comments on their own line above the code they describe',
            'Use TODO, FIXME, and NOTE tags for code markers',
            'Document complex algorithms and business logic',
            'Keep docstrings in present tense (e.g., "Returns" not "Return")'
        ]
    },
    
    javascript: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '/**',
        docstringEnd: '*/',
        docStyle: 'JSDoc',
        functionExample: `/**
 * Calculate the factorial of a number using recursion
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial of n
 * @throws {Error} If n is negative
 * @example
 * // returns 120
 * factorial(5);
 */
function factorial(n) {
    // Base case: factorial of 0 is 1
    if (n === 0) return 1;
    
    // Validate input
    if (n < 0) {
        throw new Error('Factorial not defined for negative numbers');
    }
    
    // Recursive case: n! = n * (n-1)!
    return n * factorial(n - 1);
}`,
        classExample: `/**
 * Represents a shopping cart in an e-commerce application
 * @class
 */
class ShoppingCart {
    /**
     * Create a shopping cart
     * @param {string} userId - The ID of the user
     */
    constructor(userId) {
        this.userId = userId;
        this.items = [];
        this.createdAt = new Date();
    }
    
    /**
     * Add an item to the cart
     * @param {Object} item - The item to add
     * @param {string} item.id - Product ID
     * @param {number} item.quantity - Quantity to add
     * @param {number} item.price - Price per unit
     * @returns {number} Total number of items in cart
     */
    addItem(item) {
        // Check if item already exists in cart
        const existingItem = this.items.find(i => i.id === item.id);
        
        if (existingItem) {
            // Update quantity if item exists
            existingItem.quantity += item.quantity;
        } else {
            // Add new item to cart
            this.items.push(item);
        }
        
        return this.items.length;
    }
}`,
        bestPractices: [
            'Use JSDoc format for function and class documentation',
            'Document all public APIs and exported functions',
            'Keep single-line comments brief and meaningful',
            'Avoid obvious comments that just restate the code',
            'Use TODO and FIXME comments with issue tracker references',
            'Comment complex regex patterns and bit operations',
            'Document assumptions and edge cases'
        ]
    },
    
    java: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '/**',
        docstringEnd: '*/',
        docStyle: 'Javadoc',
        functionExample: `/**
 * Searches for a target value in a sorted array using binary search
 * 
 * @param arr the sorted array to search
 * @param target the value to find
 * @return the index of the target, or -1 if not found
 * @throws IllegalArgumentException if array is null
 */
public static int binarySearch(int[] arr, int target) {
    if (arr == null) {
        throw new IllegalArgumentException("Array cannot be null");
    }
    
    int left = 0;
    int right = arr.length - 1;
    
    // Continue searching while search space is valid
    while (left <= right) {
        // Calculate middle index (prevents overflow)
        int mid = left + (right - left) / 2;
        
        // Check if target is at middle
        if (arr[mid] == target) {
            return mid;
        }
        
        // If target is greater, ignore left half
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            // If target is smaller, ignore right half
            right = mid - 1;
        }
    }
    
    // Target not found
    return -1;
}`,
        classExample: `/**
 * Represents a user account in the system
 * 
 * <p>This class handles user authentication and profile management.
 * It implements best practices for password security and session management.</p>
 * 
 * @author Development Team
 * @version 1.0
 * @since 2024-01-01
 */
public class UserAccount {
    /** The unique identifier for this user */
    private final String userId;
    
    /** The user's email address (used for login) */
    private String email;
    
    /** Flag indicating if the account is active */
    private boolean isActive;
    
    /**
     * Constructs a new user account with the specified email
     * 
     * @param email the user's email address
     * @throws IllegalArgumentException if email is invalid
     */
    public UserAccount(String email) {
        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email format");
        }
        this.userId = generateUserId();
        this.email = email;
        this.isActive = true;
    }
}`,
        bestPractices: [
            'Use Javadoc for all public classes, methods, and fields',
            'Include @param, @return, @throws tags in method documentation',
            'Add @author and @version tags to class documentation',
            'Document thread safety and synchronization requirements',
            'Use inline comments for complex algorithms only',
            'Follow Oracle\'s Javadoc guidelines',
            'Generate HTML documentation with javadoc tool'
        ]
    },
    
    cpp: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '/**',
        docstringEnd: '*/',
        docStyle: 'Doxygen',
        functionExample: `/**
 * @brief Performs quicksort on an array segment
 * 
 * This is a divide-and-conquer algorithm that sorts by partitioning
 * the array around a pivot element.
 * 
 * @param arr Pointer to the array to sort
 * @param low Starting index of the segment
 * @param high Ending index of the segment
 * 
 * @note Time complexity: O(n log n) average, O(n²) worst case
 * @warning Array must be valid and indices must be within bounds
 */
void quickSort(int* arr, int low, int high) {
    // Base case: single element or empty
    if (low >= high) {
        return;
    }
    
    // Partition the array and get pivot index
    int pivotIndex = partition(arr, low, high);
    
    // Recursively sort left partition
    quickSort(arr, low, pivotIndex - 1);
    
    // Recursively sort right partition
    quickSort(arr, pivotIndex + 1, high);
}`,
        classExample: `/**
 * @class Vector3D
 * @brief Represents a 3-dimensional vector with x, y, z components
 * 
 * Provides standard vector operations including addition, subtraction,
 * dot product, cross product, and normalization.
 */
class Vector3D {
private:
    double x, y, z;  ///< Vector components
    
public:
    /**
     * @brief Constructs a vector with specified components
     * @param x X-component
     * @param y Y-component
     * @param z Z-component
     */
    Vector3D(double x = 0.0, double y = 0.0, double z = 0.0)
        : x(x), y(y), z(z) {}
    
    /**
     * @brief Calculates the magnitude (length) of the vector
     * @return The magnitude as a double
     */
    double magnitude() const {
        // Use Pythagorean theorem in 3D
        return std::sqrt(x*x + y*y + z*z);
    }
};`,
        bestPractices: [
            'Use Doxygen-style comments for API documentation',
            'Document memory ownership and lifetime expectations',
            'Clearly mark thread-safe vs non-thread-safe code',
            'Comment RAII patterns and resource management',
            'Document template parameters and constraints',
            'Use @brief, @param, @return, @note, @warning tags',
            'Comment performance considerations and Big-O complexity'
        ]
    },
    
    csharp: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '///',
        docstringEnd: '',
        docStyle: 'XML Documentation',
        functionExample: `/// <summary>
/// Validates an email address using regex pattern matching
/// </summary>
/// <param name="email">The email address to validate</param>
/// <returns>True if email format is valid, false otherwise</returns>
/// <exception cref="ArgumentNullException">
/// Thrown when email parameter is null
/// </exception>
public static bool ValidateEmail(string email)
{
    if (email == null)
    {
        throw new ArgumentNullException(nameof(email));
    }
    
    // Regex pattern for basic email validation
    string pattern = @"^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
    
    // Check if email matches pattern
    return Regex.IsMatch(email, pattern);
}`,
        classExample: `/// <summary>
/// Represents a product in the inventory system
/// </summary>
/// <remarks>
/// This class handles product information and stock management.
/// Implements INotifyPropertyChanged for data binding support.
/// </remarks>
public class Product
{
    /// <summary>
    /// Gets or sets the unique product identifier
    /// </summary>
    public string ProductId { get; set; }
    
    /// <summary>
    /// Gets or sets the product name
    /// </summary>
    public string Name { get; set; }
    
    /// <summary>
    /// Calculates the discounted price based on percentage
    /// </summary>
    /// <param name="discountPercent">
    /// The discount percentage (0-100)
    /// </param>
    /// <returns>The discounted price</returns>
    public decimal CalculateDiscountedPrice(decimal discountPercent)
    {
        // Ensure discount is within valid range
        discountPercent = Math.Clamp(discountPercent, 0, 100);
        
        // Calculate final price after discount
        return Price * (1 - discountPercent / 100);
    }
}`,
        bestPractices: [
            'Use XML documentation comments for all public members',
            'Include <summary>, <param>, <returns>, <exception> tags',
            'Add <example> sections with code samples when helpful',
            'Document async methods and their cancellation behavior',
            'Use <remarks> for additional details and usage notes',
            'Enable XML documentation file generation in project settings',
            'Follow Microsoft\'s documentation guidelines'
        ]
    },
    
    go: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '//',
        docstringEnd: '',
        docStyle: 'GoDoc',
        functionExample: `// CalculateDistance computes the Euclidean distance between two points.
// It takes two Point structs and returns the distance as a float64.
// The calculation uses the standard distance formula: sqrt((x2-x1)² + (y2-y1)²)
//
// Example:
//   p1 := Point{X: 0, Y: 0}
//   p2 := Point{X: 3, Y: 4}
//   dist := CalculateDistance(p1, p2) // Returns 5.0
func CalculateDistance(p1, p2 Point) float64 {
    // Calculate differences in x and y coordinates
    dx := p2.X - p1.X
    dy := p2.Y - p1.Y
    
    // Apply Pythagorean theorem
    return math.Sqrt(dx*dx + dy*dy)
}`,
        classExample: `// Server represents an HTTP server with configuration and state.
// It manages request handling, middleware, and graceful shutdown.
type Server struct {
    // addr is the TCP address to listen on
    addr string
    
    // router handles incoming HTTP requests
    router *http.ServeMux
    
    // logger provides structured logging
    logger *log.Logger
}

// NewServer creates a new Server instance with the provided address.
// It initializes the router and logger with sensible defaults.
//
// The addr parameter should be in the format "host:port", e.g., ":8080"
// Returns a pointer to the newly created Server.
func NewServer(addr string) *Server {
    return &Server{
        addr:   addr,
        router: http.NewServeMux(),
        logger: log.New(os.Stdout, "SERVER: ", log.LstdFlags),
    }
}`,
        bestPractices: [
            'Start comments with the name of the thing being described',
            'Use complete sentences with proper punctuation',
            'Document all exported functions, types, and constants',
            'Keep comments concise - go doc style, not verbose',
            'Use examples in comments for complex functionality',
            'Document goroutine safety and concurrent usage',
            'Run go doc to verify documentation renders correctly'
        ]
    },
    
    rust: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '///',
        docstringEnd: '',
        docStyle: 'Rustdoc',
        functionExample: `/// Reverses a string slice in place using byte-level manipulation.
///
/// # Arguments
///
/// * \`s\` - A mutable reference to the string to reverse
///
/// # Examples
///
/// \`\`\`
/// let mut text = String::from("hello");
/// reverse_string(&mut text);
/// assert_eq!(text, "olleh");
/// \`\`\`
///
/// # Safety
///
/// This function assumes the string contains valid UTF-8.
pub fn reverse_string(s: &mut String) {
    // Convert to bytes for efficient manipulation
    let bytes = unsafe { s.as_bytes_mut() };
    
    // Use two-pointer technique
    let mut left = 0;
    let mut right = bytes.len().saturating_sub(1);
    
    // Swap characters from both ends
    while left < right {
        bytes.swap(left, right);
        left += 1;
        right -= 1;
    }
}`,
        classExample: `/// A thread-safe counter with atomic operations.
///
/// \`AtomicCounter\` provides a simple way to maintain a shared counter
/// across multiple threads without explicit locking.
///
/// # Examples
///
/// \`\`\`
/// use std::sync::Arc;
/// use std::thread;
///
/// let counter = Arc::new(AtomicCounter::new());
/// let counter_clone = Arc::clone(&counter);
///
/// thread::spawn(move || {
///     counter_clone.increment();
/// });
/// \`\`\`
pub struct AtomicCounter {
    /// The internal counter value
    value: AtomicUsize,
}

impl AtomicCounter {
    /// Creates a new \`AtomicCounter\` initialized to zero.
    pub fn new() -> Self {
        Self {
            value: AtomicUsize::new(0),
        }
    }
}`,
        bestPractices: [
            'Use /// for outer documentation, //! for module/crate docs',
            'Include # Examples, # Arguments, # Returns sections',
            'Document panic conditions in # Panics section',
            'Mark unsafe code with # Safety explanations',
            'Add doctests in code examples (they run as tests)',
            'Document lifetimes and generic constraints',
            'Use #[doc(hidden)] to hide internal implementation details'
        ]
    },
    
    ruby: {
        single: '#',
        multiStart: '=begin',
        multiEnd: '=end',
        docstringStart: '#',
        docstringEnd: '',
        docStyle: 'RDoc/YARD',
        functionExample: `# Calculates the nth Fibonacci number using memoization
#
# @param n [Integer] the position in the Fibonacci sequence
# @param memo [Hash] optional memoization cache
# @return [Integer] the Fibonacci number at position n
# @raise [ArgumentError] if n is negative
#
# @example Calculate the 10th Fibonacci number
#   fibonacci(10) #=> 55
def fibonacci(n, memo = {})
  # Validate input
  raise ArgumentError, 'n must be non-negative' if n < 0
  
  # Base cases
  return n if n <= 1
  
  # Return cached value if available
  return memo[n] if memo.key?(n)
  
  # Calculate and cache result
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)
end`,
        classExample: `# Represents a book in a library management system
#
# This class handles book information, checkout status,
# and availability tracking.
#
# @author Library Development Team
class Book
  # @return [String] the book's ISBN
  attr_reader :isbn
  
  # @return [String] the book's title
  attr_accessor :title
  
  # Creates a new Book instance
  #
  # @param isbn [String] the unique ISBN identifier
  # @param title [String] the book title
  # @param author [String] the author name
  def initialize(isbn, title, author)
    # Validate ISBN format
    raise ArgumentError, 'Invalid ISBN' unless valid_isbn?(isbn)
    
    @isbn = isbn
    @title = title
    @author = author
    @checked_out = false
  end
end`,
        bestPractices: [
            'Use YARD tags (@param, @return, @raise, @example) for documentation',
            'Document all public methods and classes',
            'Use inline comments sparingly for complex logic only',
            'Follow Ruby style guide for comment formatting',
            'Add @author and @since tags to classes',
            'Document duck typing and expected interfaces',
            'Use meaningful method and variable names to reduce comment needs'
        ]
    },
    
    php: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '/**',
        docstringEnd: '*/',
        docStyle: 'PHPDoc',
        functionExample: `/**
 * Sanitizes user input to prevent XSS attacks
 * 
 * @param string $input The raw user input to sanitize
 * @param bool $allowHTML Whether to allow safe HTML tags
 * @return string The sanitized string safe for output
 * 
 * @example
 * $clean = sanitizeInput($_POST['username']);
 */
function sanitizeInput($input, $allowHTML = false) {
    // Remove null bytes
    $input = str_replace(chr(0), '', $input);
    
    if ($allowHTML) {
        // Allow only safe HTML tags
        $input = strip_tags($input, '<p><a><b><i>');
    } else {
        // Convert special characters to HTML entities
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    }
    
    return trim($input);
}`,
        classExample: `/**
 * Database connection manager with PDO
 * 
 * @package App\\Database
 * @author Development Team
 */
class DatabaseManager {
    /**
     * @var PDO The PDO database connection
     */
    private $connection;
    
    /**
     * Private constructor to prevent direct instantiation
     * 
     * @param array $config Database configuration array
     * @throws PDOException If connection fails
     */
    private function __construct(array $config) {
        // Build DSN string
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s',
            $config['host'],
            $config['database']
        );
        
        // Create PDO connection
        $this->connection = new PDO($dsn, $config['username'], $config['password']);
    }
}`,
        bestPractices: [
            'Use PHPDoc blocks for all classes, methods, and functions',
            'Include @param, @return, @throws tags with type hints',
            'Add @var tags for class properties',
            'Document magic methods (__get, __set, etc.)',
            'Use @package and @subpackage for organization',
            'Follow PSR-5 PHPDoc standard (draft)',
            'Generate documentation with phpDocumentor'
        ]
    },
    
    typescript: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '/**',
        docstringEnd: '*/',
        docStyle: 'TSDoc',
        functionExample: `/**
 * Fetches user data from the API with retry logic
 * 
 * @param userId - The unique identifier of the user
 * @param options - Optional configuration for the request
 * @returns A promise that resolves to the user object
 * @throws {NetworkError} If all retry attempts fail
 * 
 * @public
 */
async function fetchUserData(
    userId: string,
    options: RequestOptions = {}
): Promise<User> {
    const maxRetries = options.retry ?? 3;
    let lastError: Error;
    
    // Attempt request with retries
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(\`/api/users/\${userId}\`);
            return await response.json() as User;
        } catch (error) {
            lastError = error as Error;
            await delay(Math.pow(2, attempt) * 1000);
        }
    }
    
    throw lastError;
}`,
        classExample: `/**
 * Generic cache implementation with TTL support
 * 
 * @typeParam K - The type of cache keys
 * @typeParam V - The type of cached values
 * 
 * @public
 */
class Cache<K, V> {
    /**
     * Internal storage for cache entries
     * @internal
     */
    private store: Map<K, CacheEntry<V>>;
    
    /**
     * Creates a new Cache instance
     * 
     * @param ttl - Time-to-live in milliseconds
     */
    constructor(ttl: number = 300000) {
        this.store = new Map();
        this.ttl = ttl;
    }
    
    /**
     * Stores a value in the cache
     * 
     * @param key - The cache key
     * @param value - The value to cache
     */
    set(key: K, value: V): this {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttl });
        return this;
    }
}`,
        bestPractices: [
            'Use TSDoc format (@param, @returns, @throws, @typeParam)',
            'Leverage TypeScript\'s type system - comments augment, not replace types',
            'Document complex generic constraints and type relationships',
            'Use @public, @private, @internal tags for API visibility',
            'Add @example blocks with code snippets',
            'Document async behavior and promise resolutions',
            'Use @deprecated tag with migration instructions'
        ]
    },
    
    swift: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '///',
        docstringEnd: '',
        docStyle: 'Swift Markup',
        functionExample: `/// Validates a password against security requirements
///
/// - Parameters:
///   - password: The password string to validate
///   - minLength: Minimum required length (default: 8)
/// - Returns: A tuple with validation result and optional error message
/// - Throws: \`ValidationError.empty\` if password is empty
///
/// - Important: This is a basic validator.
func validatePassword(_ password: String, minLength: Int = 8) throws -> (isValid: Bool, message: String?) {
    // Check for empty password
    guard !password.isEmpty else {
        throw ValidationError.empty
    }
    
    // Check minimum length
    guard password.count >= minLength else {
        return (false, "Password must be at least \\(minLength) characters")
    }
    
    return (true, nil)
}`,
        classExample: `/// A model representing a user profile in the application
///
/// - Important: This class conforms to \`Codable\` for JSON serialization
/// - Author: iOS Development Team
class UserProfile: Codable {
    // MARK: - Properties
    
    /// The unique identifier for this user
    let id: UUID
    
    /// The user's full name
    var fullName: String
    
    // MARK: - Initialization
    
    /// Creates a new user profile
    ///
    /// - Parameters:
    ///   - fullName: The user's complete name
    ///   - email: A valid email address
    init(fullName: String, email: String) throws {
        self.id = UUID()
        self.fullName = fullName
        self.email = email
    }
}`,
        bestPractices: [
            'Use Swift Markup with -, Parameters:, Returns:, Throws: syntax',
            'Organize code with // MARK: - Section Name comments',
            'Document all public APIs, especially in frameworks/libraries',
            'Use - Important:, - Note:, - Warning: for special attention',
            'Include code examples in documentation',
            'Document thread safety and async behavior',
            'Generate documentation with Xcode or jazzy'
        ]
    },
    
    kotlin: {
        single: '//',
        multiStart: '/*',
        multiEnd: '*/',
        docstringStart: '/**',
        docstringEnd: '*/',
        docStyle: 'KDoc',
        functionExample: `/**
 * Performs a deep copy of a list of objects
 *
 * @param T The type of elements in the list
 * @param source The source list to copy
 * @return A new list containing cloned elements
 *
 * @sample
 * val original = listOf(MyObject("a"))
 * val copy = deepCopy(original)
 */
fun <T : Cloneable> deepCopy(source: List<T>): List<T> {
    // Create mutable list for results
    val result = mutableListOf<T>()
    
    // Clone each element
    for (item in source) {
        @Suppress("UNCHECKED_CAST")
        val cloned = item::class.java
            .getDeclaredMethod("clone")
            .invoke(item) as T
        
        result.add(cloned)
    }
    
    return result.toList()
}`,
        classExample: `/**
 * A reactive data holder that notifies observers of changes
 *
 * @param T The type of data held
 * @property value The current value
 *
 * @sample
 * val liveData = LiveData<String>()
 * liveData.observe { newValue ->
 *     println("Value: $newValue")
 * }
 */
class LiveData<T> {
    /**
     * The current value held by this LiveData
     */
    var value: T? = null
        set(newValue) {
            if (field != newValue) {
                field = newValue
                notifyObservers(newValue)
            }
        }
    
    /**
     * Registers an observer function
     */
    fun observe(observer: (T?) -> Unit): Disposable {
        observers.add(observer)
        observer(value)
        return Disposable { observers.remove(observer) }
    }
}`,
        bestPractices: [
            'Use KDoc format similar to JavaDoc (@param, @return, @throws)',
            'Document all public APIs, especially in libraries',
            'Use @sample tag with actual code examples',
            'Document nullable vs non-nullable parameters explicitly',
            'Add @suppress for internal implementation details',
            'Document coroutine behavior and threading requirements',
            'Generate docs with Dokka tool'
        ]
    }
};

// Example code snippets for various categories
const examples = {
    python: [
        { 
            title: 'API Endpoint Handler',
            category: 'API Integration',
            code: `@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """
    Retrieve user information by ID.
    
    Args:
        user_id (str): The unique user identifier
        
    Returns:
        Response: JSON response with user data or error
    """
    try:
        # Query database for user
        user = db.users.find_one({'_id': user_id})
        
        if not user:
            abort(404, description="User not found")
        
        return jsonify(user), 200
    except DatabaseError as e:
        logger.error(f"Database error: {e}")
        abort(500)`
        }
    ],
    javascript: [
        {
            title: 'React Component',
            category: 'Components',
            code: `/**
 * UserProfile component displays user information
 * @component
 */
function UserProfile({ userId, onEdit }) {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        // Fetch user data on mount
        async function fetchUser() {
            const response = await fetch(\`/api/users/\${userId}\`);
            setUser(await response.json());
        }
        fetchUser();
    }, [userId]);
    
    if (!user) return <div>Loading...</div>;
    
    return (
        <div className="user-profile">
            <h2>{user.name}</h2>
            <button onClick={() => onEdit(user)}>Edit</button>
        </div>
    );
}`
        }
    ]
};

// Global state
let currentLanguage = 'python';
let currentCategory = 'syntax';
let favorites = JSON.parse(localStorage.getItem('codeFavorites') || '[]');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    renderTemplateContent();
    setupEventListeners();
});

// Render template content based on current language and category
function renderTemplateContent() {
    const content = document.getElementById('templateContent');
    const lang = commentPatterns[currentLanguage];
    
    let html = '';
    
    switch(currentCategory) {
        case 'syntax':
            html = renderSyntaxTemplates(lang);
            break;
        case 'functions':
            html = renderFunctionTemplate(lang);
            break;
        case 'classes':
            html = renderClassTemplate(lang);
            break;
        case 'best-practices':
            html = renderBestPractices(lang);
            break;
        case 'examples':
            html = renderExamples();
            break;
        case 'editor':
            return; // Keep editor visible
        case 'favorites':
            html = renderFavorites();
            break;
    }
    
    content.innerHTML = html;
}

function renderSyntaxTemplates(lang) {
    return `
        <div class="code-block">
            <div class="code-block-header">
                <span class="code-block-title">Single-line Comment</span>
                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <pre><code><span class="syntax-comment">${lang.single} This is a single-line comment</span></code></pre>
        </div>
        
        <div class="code-block">
            <div class="code-block-header">
                <span class="code-block-title">Multi-line Comment</span>
                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <pre><code><span class="syntax-comment">${lang.multiStart}
This is a multi-line comment
It can span multiple lines
${lang.multiEnd}</span></code></pre>
        </div>
        
        <div class="code-block">
            <div class="code-block-header">
                <span class="code-block-title">Documentation Comment (${lang.docStyle})</span>
                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <pre><code><span class="syntax-comment">${lang.docstringStart}
Documentation comment for functions/classes
Used by documentation generators
${lang.docstringEnd || ''}</span></code></pre>
        </div>
    `;
}

function renderFunctionTemplate(lang) {
    return `
        <div class="code-block">
            <div class="code-block-header">
                <span class="code-block-title">Well-Documented Function Example</span>
                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <pre><code>${highlightCode(lang.functionExample)}</code></pre>
        </div>
    `;
}

function renderClassTemplate(lang) {
    return `
        <div class="code-block">
            <div class="code-block-header">
                <span class="code-block-title">Well-Documented Class Example</span>
                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <pre><code>${highlightCode(lang.classExample)}</code></pre>
        </div>
    `;
}

function renderBestPractices(lang) {
    return `
        <div class="best-practices">
            <h4>${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)} Best Practices</h4>
            <ul>
                ${lang.bestPractices.map(practice => `<li>${practice}</li>`).join('')}
            </ul>
        </div>
        
        <div class="best-practices">
            <h4>General Best Practices</h4>
            <ul>
                <li>Write comments that explain "why", not "what"</li>
                <li>Keep comments up-to-date when code changes</li>
                <li>Avoid redundant comments that just restate the code</li>
                <li>Use consistent formatting throughout your codebase</li>
                <li>Comment complex algorithms and business logic</li>
                <li>Document assumptions, edge cases, and limitations</li>
            </ul>
        </div>
    `;
}

function renderExamples() {
    const langExamples = examples[currentLanguage] || [];
    if (langExamples.length === 0) {
        return '<p style="color: #b4b4c8;">No examples available for this language yet.</p>';
    }
    
    return langExamples.map(example => `
        <div class="example-card" onclick='loadExample(${JSON.stringify(example).replace(/'/g, "&apos;")})'>
            <h4>${example.title}</h4>
            <p>${example.category}</p>
            <span class="example-tag">${currentLanguage}</span>
        </div>
    `).join('');
}

function renderFavorites() {
    if (favorites.length === 0) {
        return '<p style="color: #b4b4c8;">No favorites yet. Click the ⭐ icon to save templates.</p>';
    }
    
    return favorites.map((fav, index) => `
        <div class="code-block">
            <div class="code-block-header">
                <span class="code-block-title">${fav.title} (${fav.language})</span>
                <div>
                    <button class="favorite-btn active" onclick="removeFavorite(${index})">⭐</button>
                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                </div>
            </div>
            <pre><code>${highlightCode(fav.code)}</code></pre>
        </div>
    `).join('');
}

function highlightCode(code) {
    return code
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\/\/.*$/gm, match => `<span class="syntax-comment">${match}</span>`)
        .replace(/#.*$/gm, match => `<span class="syntax-comment">${match}</span>`)
        .replace(/\/\*[\s\S]*?\*\//g, match => `<span class="syntax-comment">${match}</span>`)
        .replace(/"""[\s\S]*?"""/g, match => `<span class="syntax-comment">${match}</span>`)
        .replace(/\/\*\*[\s\S]*?\*\//g, match => `<span class="syntax-comment">${match}</span>`)
        .replace(/\b(def|class|function|const|let|var|public|private|static|async|await|return|if|else|for|while|try|catch|throw|import|from)\b/g, match => `<span class="syntax-keyword">${match}</span>`)
        .replace(/"[^"]*"|'[^']*'|`[^`]*`/g, match => `<span class="syntax-string">${match}</span>`);
}

function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('pre code').textContent;
    const title = codeBlock.querySelector('.code-block-title')?.textContent || 'unknown';
    
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
        
        // Track code copy
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackCodeCopy(title);
        }
    });
}

function loadExample(example) {
    document.getElementById('codeEditor').value = example.code;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === 'editor') {
            item.classList.add('active');
        }
    });
    currentCategory = 'editor';
    document.getElementById('templateContent').innerHTML = `
        <div class="code-block">
            <div class="code-block-header">
                <span class="code-block-title">${example.title}</span>
                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <pre><code>${highlightCode(example.code)}</code></pre>
        </div>
    `;
}

function analyzeCode() {
    const code = document.getElementById('codeEditor').value;
    const suggestions = document.getElementById('suggestions');
    
    if (!code.trim()) {
        suggestions.innerHTML = '<div class="suggestion-box"><h4>No Code to Analyze</h4><p>Please enter some code.</p></div>';
        return;
    }
    
    const lang = commentPatterns[currentLanguage];
    const lines = code.split('\n');
    const issues = [];
    
    // Check for functions without documentation
    const functionRegex = /(def |function |func |fn |public |private )/;
    lines.forEach((line, index) => {
        if (functionRegex.test(line)) {
            const prevLine = lines[index - 1] || '';
            if (!prevLine.includes(lang.docstringStart) && !prevLine.includes(lang.single)) {
                issues.push(`Line ${index + 1}: Function without documentation`);
            }
        }
    });
    
    // Calculate comment ratio
    const commentLines = lines.filter(line => 
        line.trim().startsWith(lang.single) || 
        line.includes(lang.multiStart) ||
        line.includes(lang.docstringStart)
    ).length;
    const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith(lang.single)).length;
    const ratio = codeLines > 0 ? (commentLines / codeLines * 100).toFixed(1) : 0;
    
    let html = `
        <div class="analysis-result">
            <h4>Code Analysis Results</h4>
            <p><strong>Total Lines:</strong> ${lines.length}</p>
            <p><strong>Code Lines:</strong> ${codeLines}</p>
            <p><strong>Comment Lines:</strong> ${commentLines}</p>
            <p><strong>Comment Ratio:</strong> ${ratio}%</p>
        </div>
    `;
    
    if (issues.length > 0) {
        html += `
            <div class="suggestion-box">
                <h4>Suggestions</h4>
                ${issues.map(issue => `<p>→ ${issue}</p>`).join('')}
            </div>
        `;
    } else {
        html += `<div class="analysis-result"><h4>✓ Well Commented</h4></div>`;
    }
    
    suggestions.innerHTML = html;
    
    // Track code analysis
    if (window.polyglotAnalytics) {
        window.polyglotAnalytics.trackCodeAnalysis(code.length, ratio);
    }
}

function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('codeFavorites', JSON.stringify(favorites));
    renderTemplateContent();
    
    // Track favorite removal
    if (window.polyglotAnalytics) {
        window.polyglotAnalytics.trackFavorite('remove', 'item_' + index);
    }
}

function exportTemplates() {
    const lang = commentPatterns[currentLanguage];
    const content = `# ${currentLanguage.toUpperCase()} Comment Templates

## Syntax
Single-line: ${lang.single}
Multi-line: ${lang.multiStart} ... ${lang.multiEnd}
Documentation: ${lang.docStyle}

## Function Example
${lang.functionExample}

## Class Example
${lang.classExample}

## Best Practices
${lang.bestPractices.map((p, i) => `${i + 1}. ${p}`).join('\n')}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentLanguage}-comments.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Track template export
    if (window.polyglotAnalytics) {
        window.polyglotAnalytics.trackExport(currentLanguage);
    }
}

function setupEventListeners() {
    document.getElementById('language').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        renderTemplateContent();
        
        // Track language change
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackLanguageChange(currentLanguage);
        }
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
            renderTemplateContent();
            
            // Track category view
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackCategoryView(currentCategory);
            }
        });
    });

    document.getElementById('analyzeBtn').addEventListener('click', analyzeCode);
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        document.getElementById('codeEditor').value = '';
        document.getElementById('suggestions').innerHTML = '';
    });

    document.getElementById('exportBtn').addEventListener('click', exportTemplates);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.nav-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'block' : 'none';
        });
        
        // Track search
        if (query && window.polyglotAnalytics) {
            window.polyglotAnalytics.trackSearch(query);
        }
    });

    // Support button handler
    document.getElementById('supportBtn').addEventListener('click', () => {
        // Track support button click
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('support_clicked', {
                source: 'header_button'
            });
        }
        // Link now opens Buy Me a Coffee page in new tab
    });
}

// ============================================
// DEMO SECTION FUNCTIONALITY
// ============================================

function initializeDemo() {
    const playBtn = document.getElementById('playDemoBtn');
    const resetBtn = document.getElementById('resetDemoBtn');
    const tryItBtn = document.getElementById('tryItNowBtn');
    const demoStats = document.getElementById('demoStats');
    const demoPanels = document.querySelectorAll('.demo-panel');
    
    let isPlaying = false;
    
    // Code snippets for typing animation
    const beforeCode = `// calculates user age
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
}`;

    const afterCode = `/**
 * Calculates a person's age based on their birth date
 * 
 * @param {string} birthDate - The birth date in ISO format (YYYY-MM-DD)
 * @returns {number} The calculated age in years
 * @throws {Error} If birthDate is invalid or in the future
 * 
 * @example
 * const age = calculateAge('1990-05-15');
 * console.log(age); // 35 (in 2025)
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
}`;

    // Function to type code line by line
    async function typeCode(codeElement, code, speed = 30) {
        codeElement.textContent = '';
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let currentLine = '';
            
            // Type each character in the line
            for (let char of line) {
                currentLine += char;
                codeElement.textContent = lines.slice(0, i).join('\n') + 
                    (i > 0 ? '\n' : '') + currentLine;
                await sleep(speed);
            }
            
            // Add newline if not last line
            if (i < lines.length - 1) {
                codeElement.textContent += '\n';
            }
        }
    }
    
    // Play demo animation
    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.disabled = true;
        playBtn.textContent = '⏸️ Playing...';
        
        // Track demo play
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('demo_played', {
                source: 'demo_section'
            });
        }
        
        // Get badge containers
        const beforeIssues = demoPanels[0].querySelector('.demo-issues');
        const afterBenefits = demoPanels[1].querySelector('.demo-benefits');
        
        // Hide badges initially
        beforeIssues.style.opacity = '0';
        afterBenefits.style.opacity = '0';
        
        // Step 1: Activate "Before" panel and type code
        demoPanels[0].classList.add('active');
        const beforeCodeElement = demoPanels[0].querySelector('.demo-code code');
        await typeCode(beforeCodeElement, beforeCode, 20);
        
        // Show red warning badges after code completes
        await sleep(300);
        beforeIssues.style.transition = 'opacity 0.5s ease-in';
        beforeIssues.style.opacity = '1';
        await sleep(1500);
        
        // Step 2: Activate "After" panel and type improved code
        demoPanels[1].classList.add('active');
        const afterCodeElement = demoPanels[1].querySelector('.demo-code code');
        await typeCode(afterCodeElement, afterCode, 15);
        
        // Show green success badges after code completes
        await sleep(300);
        afterBenefits.style.transition = 'opacity 0.5s ease-in';
        afterBenefits.style.opacity = '1';
        await sleep(1500);
        
        // Step 3: Show stats
        demoStats.style.display = 'flex';
        await sleep(2000);
        
        // Reset button
        playBtn.textContent = '✓ Demo Complete';
        playBtn.disabled = false;
        isPlaying = false;
    });
    
    // Reset demo
    resetBtn.addEventListener('click', () => {
        demoPanels.forEach(panel => panel.classList.remove('active'));
        demoStats.style.display = 'none';
        playBtn.textContent = '▶️ Play Demo';
        playBtn.disabled = false;
        isPlaying = false;
        
        // Clear code content (back to empty state)
        const beforeCodeElement = demoPanels[0].querySelector('.demo-code code');
        const afterCodeElement = demoPanels[1].querySelector('.demo-code code');
        beforeCodeElement.textContent = '';
        afterCodeElement.textContent = '';
        
        // Reset badge visibility
        const beforeIssues = demoPanels[0].querySelector('.demo-issues');
        const afterBenefits = demoPanels[1].querySelector('.demo-benefits');
        beforeIssues.style.opacity = '0';
        afterBenefits.style.opacity = '0';
        
        // Track demo reset
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('demo_reset', {
                source: 'demo_section'
            });
        }
    });
    
    // Try it now - scroll to main content
    tryItBtn.addEventListener('click', () => {
        const mainContent = document.querySelector('.main-content');
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Auto-select JavaScript and show functions
        const languageSelect = document.getElementById('language');
        languageSelect.value = 'javascript';
        languageSelect.dispatchEvent(new Event('change'));
        
        // Highlight the function examples category
        setTimeout(() => {
            const functionNav = document.querySelector('[data-category="functions"]');
            if (functionNav) {
                functionNav.click();
            }
        }, 500);
        
        // Track CTA click
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('demo_cta_clicked', {
                source: 'demo_section',
                action: 'try_it_now'
            });
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize demo when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    initializeDemo();
}
