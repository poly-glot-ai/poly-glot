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
    
    const clearBtnEl = document.getElementById('clearBtn');
    if (clearBtnEl) clearBtnEl.addEventListener('click', () => {
        const ce = document.getElementById('codeEditor'); if(ce) ce.value = '';
        const sg = document.getElementById('suggestions'); if(sg) sg.innerHTML = '';
    });

    // ── Score Input button (Your Code panel) ──
    const _scoreInputLegacy = document.getElementById('scoreInputBtn');
    if (_scoreInputLegacy) _scoreInputLegacy.addEventListener('click', () => {
        const code = (document.getElementById('cgInput') || document.getElementById('codeEditor') || {value:''}).value.trim();
        if (!code) { alert('Paste some code first.'); return; }
        const btn = document.getElementById('scoreInputBtn');
        btn.classList.toggle('active');
        PolyGlotScorer.renderInline('editorContent', code, null, true);
        if (typeof gtag !== 'undefined') gtag('event', 'score_input_clicked', { site: 'poly-glot' });
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
        
        // Step 3: Show animated scores
        demoStats.style.display = 'flex';
        await sleep(200);
        await animateDemoScores();
        await sleep(1500);
        
        // Reset button
        playBtn.textContent = '✓ Demo Complete';
        playBtn.disabled = false;
        resetBtn.style.display = 'inline-block';
        isPlaying = false;
    });
    
    // Reset demo
    resetBtn.addEventListener('click', () => {
        demoPanels.forEach(panel => panel.classList.remove('active'));
        demoStats.style.display = 'none';
        resetBtn.style.display  = 'none';
        playBtn.textContent = '▶️ Play Demo';
        playBtn.disabled = false;
        isPlaying = false;
        
        // Clear code content
        const beforeCodeElement = demoPanels[0].querySelector('.demo-code code');
        const afterCodeElement  = demoPanels[1].querySelector('.demo-code code');
        beforeCodeElement.textContent = '';
        afterCodeElement.textContent  = '';
        
        // Reset badge visibility
        const beforeIssues  = demoPanels[0].querySelector('.demo-issues');
        const afterBenefits = demoPanels[1].querySelector('.demo-benefits');
        beforeIssues.style.opacity  = '0';
        afterBenefits.style.opacity = '0';

        // Reset all score elements
        ['ragAfter','geoAfter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        ['ragDelta','geoDelta'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.opacity = '0';
        });
        ['ragBarBefore','ragBarAfter',
         'geoBarBefore','geoBarAfter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.transition = 'none'; el.style.width = '0%'; }
        });
        ['metricJSDoc','metricParams','metricReturns',
         'metricExamples','metricThrows','metricCoverage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.opacity = '0';
        });
        
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

// Count up a number from start→end over duration ms
function countUp(elementId, from, to, duration = 1200, suffix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const startTime = performance.now();
    function update(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(from + (to - from) * eased) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Animate a bar to a percentage width
function animateBar(elementId, toPercent, duration = 1200) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.transition = `width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    setTimeout(() => { el.style.width = toPercent + '%'; }, 50);
}

// Fade in an element after delay ms
function fadeInEl(elementId, delay = 0) {
    setTimeout(() => {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.style.transition = 'opacity 0.6s ease';
        el.style.opacity = '1';
    }, delay);
}

// Animate all score sections sequentially — matches markdown.poly-glot.ai pattern
async function animateDemoScores() {
    // RAG: 11 → 91 (+727%)
    animateBar('ragBarBefore', 11, 600);
    await sleep(400);
    animateBar('ragBarAfter', 91, 1200);
    countUp('ragAfter', 0, 91, 1200);
    fadeInEl('ragDelta', 900);
    setTimeout(() => countUp('ragDeltaNum', 0, 727, 1200), 400);

    await sleep(700);

    // GEO: 9 → 84 (+833%)
    animateBar('geoBarBefore', 9, 600);
    await sleep(400);
    animateBar('geoBarAfter', 84, 1200);
    countUp('geoAfter', 0, 84, 1200);
    fadeInEl('geoDelta', 900);
    setTimeout(() => countUp('geoDeltaNum', 0, 833, 1200), 400);

    await sleep(800);

    // Stagger metric pills
    ['metricJSDoc','metricParams','metricReturns',
     'metricExamples','metricThrows','metricCoverage'
    ].forEach((id, i) => fadeInEl(id, i * 130));
}

// Initialize demo when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    initializeDemo();
}

// ===================================
// AI SETTINGS & GENERATION
// ===================================

function initializeAISettings() {
    const modal = document.getElementById('aiSettingsModal');
    const aiSettingsBtn = document.getElementById('aiSettingsBtn');
    const closeBtn = document.getElementById('closeAiSettings');
    const saveBtn = document.getElementById('saveAiSettings');
    const testBtn = document.getElementById('testApiKey');
    const generateBtn = document.getElementById('generateBtn');
    const explainBtn  = document.getElementById('explainBtn');
    
    const providerSelect = document.getElementById('aiProvider');
    const modelSelect = document.getElementById('aiModel');
    const customModelRow   = document.getElementById('customModelRow');
    const customModelInput = document.getElementById('customModelInput');
    const apiKeyInput = document.getElementById('apiKey');
    const toggleVisibilityBtn = document.getElementById('toggleApiKeyVisibility');
    const apiStatus = document.getElementById('apiStatus');

    const CUSTOM_MODEL_KEY   = 'polyglot_custom_model';
    const CUSTOM_OPTION_VALUE = '__custom__';

    /** Show/hide the free-text custom model input row. */
    function toggleCustomModelRow(show) {
        customModelRow.style.display = show ? 'block' : 'none';
        if (show) {
            const saved = localStorage.getItem(CUSTOM_MODEL_KEY) || '';
            customModelInput.value = saved;
            customModelInput.focus();
        }
    }

    /**
     * Returns the model string to actually use for API calls.
     * If the user selected the "custom" option, reads the free-text input.
     */
    function resolveModel() {
        if (modelSelect.value === CUSTOM_OPTION_VALUE) {
            const custom = customModelInput.value.trim();
            return custom || window.aiGenerator.model; // fallback to last valid
        }
        return modelSelect.value;
    }
    
    // Load saved settings
    function loadSettings() {
        providerSelect.value = window.aiGenerator.provider;
        apiKeyInput.value = window.aiGenerator.apiKey;
        updateModelOptions();
        updateApiStatus();
    }
    
    // Update model options based on provider
    function updateModelOptions() {
        const models = window.aiGenerator.getAvailableModels();
        const currentModel = window.aiGenerator.model;
        const isCustomActive = currentModel && !models.find(m => m.value === currentModel);

        modelSelect.innerHTML = '';

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = `${model.label} — ${model.cost} cost`;
            modelSelect.appendChild(option);
        });

        // Always append the "custom" sentinel option at the bottom
        const customOption = document.createElement('option');
        customOption.value = CUSTOM_OPTION_VALUE;
        customOption.textContent = '✏️ Enter custom model name…';
        modelSelect.appendChild(customOption);

        if (isCustomActive) {
            // The saved model isn't in the preset list — restore it in the custom input
            modelSelect.value = CUSTOM_OPTION_VALUE;
            customModelInput.value = currentModel;
            toggleCustomModelRow(true);
        } else {
            modelSelect.value = currentModel;
            toggleCustomModelRow(false);
        }
    }
    
    // Update API status indicator
    function updateApiStatus() {
        const statusText = apiStatus.querySelector('.status-text');
        
        if (window.aiGenerator.isConfigured()) {
            apiStatus.classList.remove('error');
            apiStatus.classList.add('configured');
            statusText.textContent = `✓ ${window.aiGenerator.provider} configured`;
        } else {
            apiStatus.classList.remove('configured', 'error');
            statusText.textContent = 'Not configured';
        }
    }
    
    // Open modal
    aiSettingsBtn.addEventListener('click', () => {
        loadSettings();
        modal.style.display = 'block';
        
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('ai_settings_opened', {
                has_key: window.aiGenerator.isConfigured()
            });
        }
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Provider change
    providerSelect.addEventListener('change', () => {
        window.aiGenerator.saveProvider(providerSelect.value);
        updateModelOptions();
    });
    
    // Model change
    modelSelect.addEventListener('change', () => {
        const isCustom = modelSelect.value === CUSTOM_OPTION_VALUE;
        toggleCustomModelRow(isCustom);
        if (!isCustom) {
            window.aiGenerator.saveModel(modelSelect.value);
        }
        updateApiStatus();
    });

    // Custom model text input — save on change/blur
    customModelInput.addEventListener('input', () => {
        const val = customModelInput.value.trim();
        if (val) localStorage.setItem(CUSTOM_MODEL_KEY, val);
    });
    customModelInput.addEventListener('change', () => {
        const val = customModelInput.value.trim();
        if (val) {
            localStorage.setItem(CUSTOM_MODEL_KEY, val);
            window.aiGenerator.saveModel(val);
        }
    });
    
    // Toggle API key visibility
    toggleVisibilityBtn.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleVisibilityBtn.textContent = '🙈';
        } else {
            apiKeyInput.type = 'password';
            toggleVisibilityBtn.textContent = '👁️';
        }
    });
    
    // Save settings
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('⚠️ Please enter an API key');
            return;
        }
        
        window.aiGenerator.saveAPIKey(apiKey);
        window.aiGenerator.saveProvider(providerSelect.value);
        window.aiGenerator.saveModel(resolveModel());
        
        updateApiStatus();
        modal.style.display = 'none';
        
        alert('✅ AI settings saved successfully!');
        
        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('ai_settings_saved', {
                provider: providerSelect.value,
                model: modelSelect.value
            });
        }
    });
    
    // Test API connection
    testBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('⚠️ Please enter an API key first');
            return;
        }
        
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        
        // Temporarily save the key to test
        const originalKey = window.aiGenerator.apiKey;
        window.aiGenerator.apiKey = apiKey;
        window.aiGenerator.provider = providerSelect.value;
        window.aiGenerator.model = resolveModel();
        
        try {
            const testCode = 'function add(a, b) { return a + b; }';
            await window.aiGenerator.generateComments(testCode, 'javascript', 'jsdoc');
            
            apiStatus.classList.remove('error');
            apiStatus.classList.add('configured');
            apiStatus.querySelector('.status-text').textContent = '✓ Connection successful!';
            
            alert('✅ API connection successful! Your key is working.');
            
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('api_test_success', {
                    provider: providerSelect.value
                });
            }
        } catch (error) {
            apiStatus.classList.remove('configured');
            apiStatus.classList.add('error');
            apiStatus.querySelector('.status-text').textContent = `✗ ${error.message}`;
            
            alert(`❌ Connection failed: ${error.message}\n\nPlease check your API key and try again.`);
            
            // Restore original key
            window.aiGenerator.apiKey = originalKey;
            
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('api_test_failed', {
                    provider: providerSelect.value,
                    error: error.message
                });
            }
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = 'Test Connection';
        }
    });
    
    // Generate AI comments button
    generateBtn.addEventListener('click', async () => {
        if (!window.aiGenerator.isConfigured()) {
            alert('⚙️ Please configure your AI API key first.\n\nClick "AI Settings" to add your OpenAI or Anthropic API key.');
            aiSettingsBtn.click();
            return;
        }
        
        const codeEditor = document.getElementById('cgInput') || document.getElementById('codeEditor') || {value:''};
        const code = codeEditor.value.trim();
        
        if (!code) {
            alert('📝 Please paste some code in the editor first.');
            return;
        }
        
        const languageSelect = document.getElementById('language');
        const language = languageSelect.value;
        
        // Determine comment style based on language
        const commentStyles = {
            javascript: 'jsdoc',
            typescript: 'jsdoc',
            java: 'javadoc',
            python: 'pydoc',
            cpp: 'doxygen',
            csharp: 'xmldoc',
            go: 'godoc',
            rust: 'rustdoc',
            ruby: 'rdoc',
            php: 'phpdoc',
            swift: 'swift',
            kotlin: 'kotlin'
        };
        
        const commentStyle = commentStyles[language] || 'jsdoc';
        
        // Show loading state
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
        
        try {
            const result = await window.aiGenerator.generateComments(code, language, commentStyle);
            
            // Display results
            displayAIResults(result);
            
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('ai_generation_success', {
                    language: language,
                    provider: result.provider,
                    model: result.model,
                    code_length: code.length,
                    cost: result.cost
                });
            }
        } catch (error) {
            alert(`❌ Generation failed: ${error.message}\n\nPlease check your API key and try again.`);
            
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('ai_generation_failed', {
                    language: language,
                    error: error.message
                });
            }
        } finally {
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
        }
    });
    
    // ── Explain Code button ──────────────────────────────────────────
    explainBtn.addEventListener('click', async () => {
        if (!window.aiGenerator.isConfigured()) {
            alert('⚙️ Please configure your AI API key first.\n\nClick "AI Settings" to add your OpenAI or Anthropic API key.');
            aiSettingsBtn.click();
            return;
        }

        const code = (document.getElementById('cgInput') || document.getElementById('codeEditor') || {value:''}).value.trim();
        if (!code) {
            alert('📝 Please paste some code into the editor first.');
            return;
        }

        if (code.length < 10) {
            alert('📝 Please paste more code — at least a function or a few lines.');
            return;
        }

        const language = document.getElementById('language').value;

        explainBtn.classList.add('loading');
        explainBtn.disabled = true;
        explainBtn.textContent = '🔍 Analysing...';

        // Remove any previous results
        const prev = document.querySelector('.ai-explain-results');
        if (prev) prev.remove();

        try {
            const result = await window.aiGenerator.explainCode(code, language);
            displayExplanation(result);

            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('code_explained', {
                    language,
                    provider: result.provider,
                    cost: result.cost
                });
            }
        } catch (error) {
            alert(`❌ Analysis failed: ${error.message}\n\nPlease check your API key and try again.`);

            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('code_explain_failed', {
                    language,
                    error: error.message
                });
            }
        } finally {
            explainBtn.classList.remove('loading');
            explainBtn.disabled = false;
            explainBtn.textContent = '🔍 Explain Code';
        }
    });

    // ── Render the explanation panel ────────────────────────────────
    function displayExplanation(result) {
        const a = result.analysis;

        // Doc quality badge colour
        const score = a.doc_quality?.score ?? 0;
        const scoreColor = score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';

        // Build functions table rows
        const funcRows = (a.functions || []).map(f => `
            <tr>
                <td class="explain-fn-name"><code>${escapeHtml(f.name)}</code></td>
                <td>${escapeHtml(f.role)}</td>
                <td class="explain-fn-meta">${escapeHtml(f.params || '—')}</td>
                <td class="explain-fn-meta">${escapeHtml(f.returns || '—')}</td>
            </tr>`).join('');

        // Build list items helper
        const listItems = arr => (arr || []).map(i => `<li>${escapeHtml(i)}</li>`).join('');

        const panel = document.createElement('div');
        panel.className = 'ai-explain-results';
        panel.innerHTML = `
            <div class="explain-header">
                <div class="explain-title-row">
                    <h3>🔍 Code Analysis</h3>
                    <div class="explain-meta">
                        <span class="explain-badge explain-badge-provider">${escapeHtml(result.provider)} · ${escapeHtml(result.model)}</span>
                        <span class="explain-badge explain-badge-cost">Cost: $${result.cost.toFixed(4)}</span>
                        <button class="explain-close" id="closeExplain" title="Close">✕</button>
                    </div>
                </div>
                <p class="explain-summary">${escapeHtml(a.summary || '')}</p>
            </div>

            <div class="explain-body">

                <!-- Purpose -->
                <div class="explain-section">
                    <h4>📌 Purpose</h4>
                    <p>${escapeHtml(a.purpose || '')}</p>
                </div>

                <!-- How it works -->
                <div class="explain-section">
                    <h4>⚙️ How It Works</h4>
                    <ol class="explain-steps">${listItems(a.how_it_works)}</ol>
                </div>

                ${funcRows ? `
                <!-- Functions breakdown -->
                <div class="explain-section">
                    <h4>🧩 Functions &amp; Methods</h4>
                    <div class="explain-table-wrap">
                        <table class="explain-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Parameters</th>
                                    <th>Returns</th>
                                </tr>
                            </thead>
                            <tbody>${funcRows}</tbody>
                        </table>
                    </div>
                </div>` : ''}

                <!-- Complexity -->
                ${a.complexity ? `
                <div class="explain-section">
                    <h4>📊 Complexity</h4>
                    <div class="explain-complexity-row">
                        <div class="explain-complexity-card">
                            <span class="complexity-label">Time</span>
                            <span class="complexity-value">${escapeHtml(a.complexity.time || '—')}</span>
                        </div>
                        <div class="explain-complexity-card">
                            <span class="complexity-label">Space</span>
                            <span class="complexity-value">${escapeHtml(a.complexity.space || '—')}</span>
                        </div>
                        <p class="complexity-notes">${escapeHtml(a.complexity.notes || '')}</p>
                    </div>
                </div>` : ''}

                <!-- Two-column: strengths + improvements -->
                <div class="explain-two-col">
                    <div class="explain-section explain-section-good">
                        <h4>✅ Strengths</h4>
                        <ul>${listItems(a.strengths)}</ul>
                    </div>
                    <div class="explain-section explain-section-improve">
                        <h4>💡 Improvements</h4>
                        <ul>${listItems(a.improvements)}</ul>
                    </div>
                </div>

                <!-- Bugs / risks -->
                ${(a.bugs_or_risks || []).length > 0 ? `
                <div class="explain-section explain-section-risk">
                    <h4>⚠️ Bugs &amp; Risks</h4>
                    <ul>${listItems(a.bugs_or_risks)}</ul>
                </div>` : `
                <div class="explain-section explain-section-good">
                    <h4>✅ No Bugs or Risks Detected</h4>
                    <p>The code looks clean — no obvious bugs or edge-case risks found.</p>
                </div>`}

                <!-- Doc quality score -->
                <div class="explain-section explain-doc-quality">
                    <h4>📝 Documentation Quality</h4>
                    <div class="doc-quality-row">
                        <div class="doc-quality-score" style="--score-color: ${scoreColor}">
                            <span class="doc-score-number">${score}</span>
                            <span class="doc-score-max">/10</span>
                        </div>
                        <div class="doc-quality-info">
                            <span class="doc-quality-label" style="color: ${scoreColor}">${escapeHtml(a.doc_quality?.label || '')}</span>
                            <p>${escapeHtml(a.doc_quality?.comment || '')}</p>
                        </div>
                    </div>
                </div>

            </div><!-- /explain-body -->

            <div class="explain-footer">
                <button class="btn-primary" id="generateFromExplain">🤖 Generate Comments Now</button>
                <button class="btn-secondary" id="closeExplainFooter">Close Analysis</button>
            </div>
        `;

        // Insert after suggestions
        const _anchor = document.getElementById('cgOutputArea') || document.getElementById('suggestions');
        if(_anchor && _anchor.parentNode) _anchor.parentNode.insertBefore(panel, _anchor.nextSibling);
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Close buttons
        document.getElementById('closeExplain').addEventListener('click', () => panel.remove());
        document.getElementById('closeExplainFooter').addEventListener('click', () => panel.remove());

        // "Generate Comments Now" — triggers the generateBtn flow
        document.getElementById('generateFromExplain').addEventListener('click', () => {
            panel.remove();
            generateBtn.click();
        });
    }

    // Display AI generation results
    function displayAIResults(result) {
        // Remove any existing results
        const existingResults = document.querySelector('.ai-results');
        if (existingResults) {
            existingResults.remove();
        }
        
        // Create results container
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'ai-results';
        resultsDiv.id = 'aiResultsDiv';
        resultsDiv.innerHTML = `
            <div class="ai-results-header">
                <h3>✨ AI-Generated Comments</h3>
                <span class="ai-cost">Cost: $${result.cost.toFixed(4)}</span>
            </div>
            <div class="ai-code-wrapper">
                <button class="ai-copy-inline" id="copyAiCodeInline" title="Copy code">📋</button>
                <div class="ai-code-output">${escapeHtml(result.code)}</div>
            </div>
            <div class="ai-actions">
                <button class="score-btn" id="scoreOutputBtn" title="Compare RAG & GEO scores before vs. after">📊 Score Improvement</button>
                <button class="btn-primary" id="copyAiCode">📋 Copy to Clipboard</button>
                <button class="btn-primary" id="replaceCode">✅ Replace Code</button>
                <button class="btn-secondary" id="closeAiResults">✗ Close</button>
            </div>
        `;
        
        // Insert after suggestions div
        const suggestions = document.getElementById('suggestions');
        suggestions.parentNode.insertBefore(resultsDiv, suggestions.nextSibling);
        
        // Shared helper — animate a button to "Copied!" then restore
        function flashCopied(btn, originalHTML) {
            btn.innerHTML = '✅ Copied!';
            btn.classList.add('copied');
            btn.disabled = true;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('copied');
                btn.disabled = false;
            }, 2000);
        }

        // ── Score Improvement button ──
        document.getElementById('scoreOutputBtn').addEventListener('click', () => {
            const inputCode = (document.getElementById('cgInput') || document.getElementById('codeEditor') || {value:''}).value.trim();
            const btn = document.getElementById('scoreOutputBtn');
            btn.classList.toggle('active');
            PolyGlotScorer.renderInline('aiResultsDiv', inputCode || null, result.code, true);
            if (typeof gtag !== 'undefined') gtag('event', 'score_output_clicked', { site: 'poly-glot' });
        });

        // Inline copy icon on the code block
        document.getElementById('copyAiCodeInline').addEventListener('click', function() {
            navigator.clipboard.writeText(result.code).then(() => {
                flashCopied(this, '📋');
                if (window.polyglotAnalytics) {
                    window.polyglotAnalytics.trackEvent('ai_code_copied', { provider: result.provider, source: 'inline' });
                }
            }).catch(() => {
                this.innerHTML = '❌';
                setTimeout(() => { this.innerHTML = '📋'; }, 2000);
            });
        });

        // Copy to clipboard (bottom action bar)
        document.getElementById('copyAiCode').addEventListener('click', function() {
            navigator.clipboard.writeText(result.code).then(() => {
                flashCopied(this, '📋 Copy to Clipboard');
                if (window.polyglotAnalytics) {
                    window.polyglotAnalytics.trackEvent('ai_code_copied', { provider: result.provider, source: 'button' });
                }
            }).catch(() => {
                this.innerHTML = '❌ Copy failed';
                setTimeout(() => { this.innerHTML = '📋 Copy to Clipboard'; }, 2000);
            });
        });

        // Replace code in editor
        document.getElementById('replaceCode').addEventListener('click', function() {
            const codeEditor = document.getElementById('cgInput') || document.getElementById('codeEditor') || {value:''};
            codeEditor.value = result.code;
            flashCopied(this, '✅ Replace Code');
            setTimeout(() => resultsDiv.remove(), 1200);

            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('ai_code_replaced', { provider: result.provider });
            }
        });
        
        // Close results
        document.getElementById('closeAiResults').addEventListener('click', () => {
            resultsDiv.remove();
        });
        
        // Scroll results into view
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Helper to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize on load
    updateApiStatus();
}

// Initialize AI settings when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAISettings);
} else {
    initializeAISettings();
}

/* ═══════════════════════════════════════════════════
   Comment Generator — two-panel feature
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   Comment Generator — parallel design to markdown.poly-glot.ai
   ═══════════════════════════════════════════════════════════ */
function initCommentGenerator() {
    // Settings elements
    const cgLanguage     = document.getElementById('cgLanguage');
    const cgStyle        = document.getElementById('cgStyle');
    const cgProvider     = document.getElementById('cgProvider');
    const cgModel        = document.getElementById('cgModel');
    const cgApiKey       = document.getElementById('cgApiKey');
    const cgToggleKey    = document.getElementById('cgToggleKey');
    const cgSaveKey      = document.getElementById('cgSaveKey');
    const cgKeyStatus    = document.getElementById('cgKeyStatus');

    // Panel elements
    const cgFileUpload   = document.getElementById('cgFileUpload');
    const cgInput        = document.getElementById('cgInput');
    const cgInputStats   = document.getElementById('cgInputStats');
    const cgClearInput   = document.getElementById('cgClearInput');
    const cgGenerateBtn  = document.getElementById('cgGenerateBtn');
    const cgScoreInputBtn= document.getElementById('cgScoreInputBtn');
    const cgScoreBtn     = document.getElementById('cgScoreBtn');
    const cgCopyBtn      = document.getElementById('cgCopyBtn');
    const cgDownloadBtn  = document.getElementById('cgDownloadBtn');
    const cgPlaceholder  = document.getElementById('cgPlaceholder');
    const cgOutput       = document.getElementById('cgOutput');
    const cgOutputFooter = document.getElementById('cgOutputFooter');
    const cgOutputStats  = document.getElementById('cgOutputStats');
    const cgOutputCost   = document.getElementById('cgOutputCost');
    const cgImpBadges    = document.getElementById('cgImpBadges');
    const cgLoading      = document.getElementById('cgLoading');

    if (!cgInput) return; // guard

    // LocalStorage keys (isolated from legacy settings)
    const LS = {
        key:      'cg_api_key',
        provider: 'cg_provider',
        model:    'cg_model'
    };

    // Model lists per provider
    const MODELS = {
        openai: [
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini (fast)' },
            { value: 'gpt-4o',      label: 'GPT-4o (best)' }
        ],
        anthropic: [
            { value: 'claude-sonnet-4-5',          label: 'Claude Sonnet 4 ✨ (recommended)' },
            { value: 'claude-3-5-sonnet-20241022',  label: 'Claude 3.5 Sonnet' },
            { value: 'claude-3-5-haiku-20241022',   label: 'Claude 3.5 Haiku (fast)' }
        ]
    };

    // Language → comment style
    const STYLE_MAP = {
        javascript: 'jsdoc',  typescript: 'jsdoc',  java: 'javadoc',
        python: 'pydoc',      cpp: 'doxygen',        csharp: 'xmldoc',
        go: 'godoc',          rust: 'rustdoc',       ruby: 'rdoc',
        php: 'phpdoc',        swift: 'swift',        kotlin: 'kotlin'
    };

    // File extension → language
    const EXT_MAP = {
        js:'javascript', ts:'typescript', jsx:'javascript', tsx:'typescript',
        py:'python',     java:'java',     cpp:'cpp',        c:'cpp',
        cs:'csharp',     go:'go',         rs:'rust',        rb:'ruby',
        php:'php',       swift:'swift',   kt:'kotlin'
    };

    let lastInputText  = '';
    let lastOutputText = '';
    let lastFilename   = 'commented-code.txt';

    // ── Restore saved settings ──
    function restoreSettings() {
        const key      = localStorage.getItem(LS.key)      || '';
        const provider = localStorage.getItem(LS.provider) || 'openai';
        const model    = localStorage.getItem(LS.model)    || 'gpt-4o-mini';
        if (key) { cgApiKey.value = key; cgKeyStatus.textContent = '✅ Key saved'; cgKeyStatus.className = 'pg-key-status ok'; }
        cgProvider.value = provider;
        updateModelDropdown(provider, model);
    }

    function updateModelDropdown(provider, selectedModel) {
        const list = MODELS[provider] || MODELS.openai;
        cgModel.innerHTML = list
            .map(m => `<option value="${m.value}"${m.value === selectedModel ? ' selected' : ''}>${m.label}</option>`)
            .join('');
    }

    // ── Provider change → update model dropdown ──
    cgProvider.addEventListener('change', () => {
        const prov = cgProvider.value;
        updateModelDropdown(prov, prov === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini');
    });

    // ── Language change → auto-update comment style ──
    cgLanguage.addEventListener('change', () => {
        const style = STYLE_MAP[cgLanguage.value];
        if (style) cgStyle.value = style;
    });

    // ── Toggle API key visibility ──
    cgToggleKey.addEventListener('click', () => {
        cgApiKey.type = cgApiKey.type === 'password' ? 'text' : 'password';
    });

    // ── Save API key ──
    cgSaveKey.addEventListener('click', () => {
        const key = cgApiKey.value.trim();
        if (!key) {
            cgKeyStatus.textContent = '❌ Please enter an API key';
            cgKeyStatus.className   = 'pg-key-status err';
            return;
        }
        localStorage.setItem(LS.key,      key);
        localStorage.setItem(LS.provider, cgProvider.value);
        localStorage.setItem(LS.model,    cgModel.value);
        cgKeyStatus.textContent = '✅ Settings saved';
        cgKeyStatus.className   = 'pg-key-status ok';
        if (typeof gtag !== 'undefined') gtag('event', 'cg_api_key_saved', { provider: cgProvider.value });
    });

    // ── File upload ──
    cgFileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const ext  = file.name.split('.').pop().toLowerCase();
        const lang = EXT_MAP[ext];
        if (lang) { cgLanguage.value = lang; const sty = STYLE_MAP[lang]; if (sty) cgStyle.value = sty; }
        lastFilename = file.name.replace(/\.[^.]+$/, '') + '-commented.' + file.name.split('.').pop();
        const reader = new FileReader();
        reader.onload = (ev) => { cgInput.value = ev.target.result; updateInputStats(); };
        reader.readAsText(file);
        cgFileUpload.value = '';
        if (typeof gtag !== 'undefined') gtag('event', 'cg_file_uploaded', { ext, size: file.size });
    });

    // ── Input stats ──
    function updateInputStats() {
        const text = cgInput.value;
        if (!text.trim()) { cgInputStats.textContent = ''; return; }
        cgInputStats.textContent = `${text.split('\n').length} lines · ${text.length} chars`;
    }
    cgInput.addEventListener('input', updateInputStats);

    // ── Clear ──
    cgClearInput.addEventListener('click', () => {
        cgInput.value = '';
        updateInputStats();
        resetOutput();
        cgScoreInputBtn.classList.remove('active');
        // Remove ISP from input panel
        const inPanel = document.getElementById('inputPanel');
        if (inPanel) { const isp = inPanel.querySelector('.isp-panel'); if (isp) isp.remove(); }
    });

    // ── Reset output ──
    function resetOutput() {
        cgPlaceholder.style.display  = 'flex';
        cgOutput.style.display       = 'none';
        cgOutput.textContent         = '';
        cgOutputFooter.style.display = 'none';
        cgCopyBtn.disabled           = true;
        cgDownloadBtn.disabled       = true;
        cgScoreBtn.disabled          = true;
        cgScoreBtn.classList.remove('active');
        // Remove any ISP panels from both tool panels
        ['inputPanel','outputPanel'].forEach(id => {
            const p = document.getElementById(id);
            if (p) { const isp = p.querySelector('.isp-panel'); if (isp) isp.remove(); }
        });
        lastOutputText = '';
        lastInputText  = '';
        if (cgImpBadges) cgImpBadges.innerHTML = '';
    }

    // ── Generate Comments ──
    cgGenerateBtn.addEventListener('click', async () => {
        const code = cgInput.value.trim();
        if (!code) { alert('Please paste or upload some code first.'); return; }
        const key = localStorage.getItem(LS.key) || '';
        if (!key || key.length < 10) { alert('Please enter and save your API key in the settings above.'); return; }

        // Temporarily configure shared aiGenerator
        const orig = { key: window.aiGenerator.apiKey, prov: window.aiGenerator.provider, model: window.aiGenerator.model };
        window.aiGenerator.apiKey   = key;
        window.aiGenerator.provider = cgProvider.value;
        window.aiGenerator.model    = cgModel.value;

        cgLoading.style.display    = 'flex';
        cgGenerateBtn.disabled     = true;

        try {
            lastInputText  = code;
            const result   = await window.aiGenerator.generateComments(code, cgLanguage.value, cgStyle.value);
            lastOutputText = result.code;

            // Show output — identical to markdown site flow
            cgPlaceholder.style.display  = 'none';
            cgOutput.style.display       = 'block';
            cgOutput.textContent         = result.code;
            cgOutputFooter.style.display = 'flex';

            // Stats
            const lines = result.code.split('\n').length;
            cgOutputStats.textContent = `${lines} lines · ${result.code.length} chars`;
            if (cgOutputCost) cgOutputCost.textContent = result.cost > 0 ? `~$${result.cost.toFixed(4)}` : '';

            // Improvement badges
            if (cgImpBadges) {
                cgImpBadges.innerHTML = [
                    `<span class="imp-badge">✅ ${cgStyle.value.toUpperCase()}</span>`,
                    `<span class="imp-badge">✅ ${cgLanguage.value}</span>`,
                    `<span class="imp-badge">✅ RAG-ready</span>`
                ].join('');
            }

            cgCopyBtn.disabled     = false;
            cgDownloadBtn.disabled = false;
            cgScoreBtn.disabled    = false;

            if (typeof gtag !== 'undefined') gtag('event', 'cg_generate_success', {
                provider: result.provider, model: result.model,
                language: cgLanguage.value, style: cgStyle.value
            });

        } catch (err) {
            cgPlaceholder.style.display = 'none';
            cgOutput.style.display      = 'block';
            cgOutput.textContent        = '❌ Error: ' + err.message;
            if (typeof gtag !== 'undefined') gtag('event', 'cg_generate_error', { error: err.message });
        } finally {
            // Restore original aiGenerator state
            window.aiGenerator.apiKey   = orig.key;
            window.aiGenerator.provider = orig.prov;
            window.aiGenerator.model    = orig.model;
            cgLoading.style.display  = 'none';
            cgGenerateBtn.disabled   = false;
        }
    });

    // ── Copy ──
    cgCopyBtn.addEventListener('click', () => {
        if (!lastOutputText) return;
        navigator.clipboard.writeText(lastOutputText).then(() => {
            const orig = cgCopyBtn.innerHTML;
            cgCopyBtn.innerHTML = '✅ Copied!';
            cgCopyBtn.classList.add('copied');
            setTimeout(() => { cgCopyBtn.innerHTML = orig; cgCopyBtn.classList.remove('copied'); }, 2000);
            if (typeof gtag !== 'undefined') gtag('event', 'cg_output_copied', { language: cgLanguage.value });
        });
    });

    // ── Download ──
    cgDownloadBtn.addEventListener('click', () => {
        if (!lastOutputText) return;
        const blob = new Blob([lastOutputText], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = lastFilename; a.click();
        URL.revokeObjectURL(url);
        if (typeof gtag !== 'undefined') gtag('event', 'cg_output_downloaded', { language: cgLanguage.value });
    });

    // ── Score Input (Your Code) — identical to markdown scoreInputBtn ──
    cgScoreInputBtn.addEventListener('click', () => {
        const code = cgInput.value.trim();
        if (!code) { alert('Paste or upload some code first.'); return; }
        // Collapse output score panel if open (remove any existing ispPanel in outputPanel)
        if (cgScoreBtn.classList.contains('active')) {
            cgScoreBtn.classList.remove('active');
            const outPanel = document.getElementById('outputPanel');
            if (outPanel) { const isp = outPanel.querySelector('.isp-panel'); if (isp) isp.remove(); }
        }
        cgScoreInputBtn.classList.toggle('active');
        if (typeof PolyGlotScorer !== 'undefined') {
            PolyGlotScorer.renderInline('inputPanel', code, null, true, cgLanguage.value);
        }
        if (typeof gtag !== 'undefined') gtag('event', 'cg_score_input_clicked', { language: cgLanguage.value });
    });

    // ── Score Output (before → after) — identical to markdown scoreOutputBtn ──
    cgScoreBtn.addEventListener('click', () => {
        if (!lastOutputText) return;
        // Collapse input score panel if open
        if (cgScoreInputBtn.classList.contains('active')) {
            cgScoreInputBtn.classList.remove('active');
            const inPanel = document.getElementById('inputPanel');
            if (inPanel) { const isp = inPanel.querySelector('.isp-panel'); if (isp) isp.remove(); }
        }
        cgScoreBtn.classList.toggle('active');
        if (typeof PolyGlotScorer !== 'undefined') {
            PolyGlotScorer.renderInline('outputPanel', lastInputText, lastOutputText, true, cgLanguage.value);
        }
        if (typeof gtag !== 'undefined') gtag('event', 'cg_score_output_clicked', { language: cgLanguage.value });
    });

    restoreSettings();
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommentGenerator);
} else {
    initCommentGenerator();
}
