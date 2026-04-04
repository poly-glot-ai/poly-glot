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
            <pre><code>${highlightCode(lang.functionExample, currentLanguage)}</code></pre>
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
            <pre><code>${highlightCode(lang.classExample, currentLanguage)}</code></pre>
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
            <pre><code>${highlightCode(fav.code, fav.language || currentLanguage)}</code></pre>
        </div>
    `).join('');
}

// ── Syntax Highlighter ────────────────────────────────────────────────────────
// Token-based: classifies every character span into one token type, then
// emits HTML exactly once. Never runs regexes on already-injected HTML so
// span/class attributes can never be corrupted by keyword or string passes.
function highlightCode(code, lang) {
    // ── Per-language keyword sets ──────────────────────────────────────────
    const KEYWORDS = {
        javascript: ['const','let','var','function','return','if','else','for','while',
                     'do','switch','case','break','continue','new','delete','typeof',
                     'instanceof','in','of','try','catch','finally','throw','class',
                     'extends','super','import','export','default','async','await',
                     'yield','null','undefined','true','false','this','static','get','set'],
        typescript: ['const','let','var','function','return','if','else','for','while',
                     'do','switch','case','break','continue','new','delete','typeof',
                     'instanceof','in','of','try','catch','finally','throw','class',
                     'extends','super','import','export','default','async','await',
                     'yield','null','undefined','true','false','this','static','get','set',
                     'interface','type','enum','namespace','abstract','implements',
                     'readonly','declare','as','keyof','infer','never','unknown','any',
                     'void','string','number','boolean','object','symbol'],
        python:     ['def','class','return','if','elif','else','for','while','in','not',
                     'and','or','is','import','from','as','try','except','finally',
                     'raise','with','lambda','yield','pass','break','continue','del',
                     'global','nonlocal','assert','True','False','None','self','super'],
        java:       ['public','private','protected','static','final','abstract','class',
                     'interface','enum','extends','implements','new','return','if','else',
                     'for','while','do','switch','case','break','continue','try','catch',
                     'finally','throw','throws','import','package','void','int','long',
                     'double','float','boolean','char','byte','short','null','true','false',
                     'this','super','instanceof','synchronized','volatile','transient'],
        csharp:     ['public','private','protected','internal','static','abstract','sealed',
                     'class','interface','struct','enum','namespace','using','new','return',
                     'if','else','for','foreach','while','do','switch','case','break',
                     'continue','try','catch','finally','throw','void','int','long','double',
                     'float','bool','string','char','byte','short','decimal','object','var',
                     'null','true','false','this','base','override','virtual','readonly',
                     'const','event','delegate','async','await','get','set','value','out',
                     'ref','params','in','is','as','typeof','nameof','default','where'],
        cpp:        ['auto','void','int','long','short','double','float','char','bool',
                     'unsigned','signed','const','static','extern','register','volatile',
                     'inline','virtual','explicit','mutable','class','struct','union',
                     'enum','namespace','template','typename','typedef','using','new',
                     'delete','return','if','else','for','while','do','switch','case',
                     'break','continue','try','catch','throw','nullptr','true','false',
                     'this','public','private','protected','friend','operator','sizeof',
                     'decltype','constexpr','override','final','noexcept','static_cast',
                     'dynamic_cast','reinterpret_cast','const_cast','include','define'],
        go:         ['func','var','const','type','struct','interface','map','chan','package',
                     'import','return','if','else','for','range','switch','case','default',
                     'break','continue','goto','fallthrough','defer','go','select','nil',
                     'true','false','make','new','len','cap','append','copy','delete',
                     'close','panic','recover','print','println','error','int','int8',
                     'int16','int32','int64','uint','uint8','uint16','uint32','uint64',
                     'float32','float64','complex64','complex128','byte','rune','string',
                     'bool','any','error'],
        rust:       ['fn','let','mut','const','static','struct','enum','trait','impl',
                     'use','mod','pub','crate','super','self','return','if','else','for',
                     'while','loop','match','break','continue','in','where','type','as',
                     'ref','move','box','dyn','unsafe','extern','async','await','yield',
                     'true','false','null','None','Some','Ok','Err','Vec','String','bool',
                     'i8','i16','i32','i64','i128','u8','u16','u32','u64','u128',
                     'f32','f64','usize','isize','str','char'],
        ruby:       ['def','end','class','module','require','include','extend','return',
                     'if','elsif','else','unless','then','case','when','while','until',
                     'for','in','do','begin','rescue','ensure','raise','yield','lambda',
                     'proc','nil','true','false','self','super','attr_accessor',
                     'attr_reader','attr_writer','private','protected','public','new',
                     'puts','print','p'],
        php:        ['function','class','interface','trait','extends','implements','return',
                     'if','elseif','else','for','foreach','while','do','switch','case',
                     'break','continue','try','catch','finally','throw','new','echo','print',
                     'include','require','include_once','require_once','namespace','use',
                     'public','private','protected','static','abstract','final','const',
                     'null','true','false','this','self','parent','array','list','match',
                     'fn','yield','void','int','float','string','bool','object','mixed'],
        swift:      ['func','var','let','class','struct','enum','protocol','extension',
                     'init','deinit','return','if','else','guard','for','in','while',
                     'repeat','switch','case','default','break','continue','fallthrough',
                     'do','try','catch','throw','throws','rethrows','import','typealias',
                     'associatedtype','subscript','override','final','required','convenience',
                     'lazy','weak','unowned','static','class','mutating','nonmutating',
                     'inout','nil','true','false','self','super','where','some','any',
                     'async','await','actor','isolated','nonisolated','open','public',
                     'internal','fileprivate','private','as','is','in','get','set','willSet',
                     'didSet','String','Int','Double','Float','Bool','Array','Dictionary'],
        kotlin:     ['fun','val','var','class','interface','object','companion','data',
                     'sealed','abstract','open','override','final','init','constructor',
                     'return','if','else','when','for','while','do','in','is','as','break',
                     'continue','try','catch','finally','throw','import','package','by',
                     'typealias','suspend','inline','reified','crossinline','noinline',
                     'null','true','false','this','super','it','let','run','apply','also',
                     'with','to','and','or','not','xor','shl','shr','ushr','String','Int',
                     'Long','Double','Float','Boolean','Char','Byte','Short','Any','Unit',
                     'Nothing','Array','List','Map','Set','Pair','Triple'],
    };

    // Detect language from currentLanguage global if not passed
    const activeLang = lang || (typeof currentLanguage !== 'undefined' ? currentLanguage : 'javascript');
    const keywords   = new Set(KEYWORDS[activeLang] || KEYWORDS.javascript);

    // ── Tokeniser ──────────────────────────────────────────────────────────
    // Produces array of {type, value} tokens. Types:
    //   comment | string | keyword | number | decorator | type | code
    const tokens = [];
    let i = 0;
    const len = code.length;

    while (i < len) {
        // ── Block comments: /** ... */ and /* ... */ ──────────────────────
        if (code[i] === '/' && code[i+1] === '*') {
            const end = code.indexOf('*/', i + 2);
            const finish = end === -1 ? len : end + 2;
            tokens.push({ type: 'comment', value: code.slice(i, finish) });
            i = finish; continue;
        }
        // ── C# / Rust / C++ triple-slash: /// ────────────────────────────
        if (code[i] === '/' && code[i+1] === '/' && code[i+2] === '/') {
            const end = code.indexOf('\n', i);
            const finish = end === -1 ? len : end;
            tokens.push({ type: 'comment', value: code.slice(i, finish) });
            i = finish; continue;
        }
        // ── Line comments: // ─────────────────────────────────────────────
        if (code[i] === '/' && code[i+1] === '/') {
            const end = code.indexOf('\n', i);
            const finish = end === -1 ? len : end;
            tokens.push({ type: 'comment', value: code.slice(i, finish) });
            i = finish; continue;
        }
        // ── Hash comments: # (Python, Ruby, PHP, shell) ──────────────────
        // Don't treat # inside strings — only at start of token
        if (code[i] === '#' && (activeLang === 'python' || activeLang === 'ruby' ||
            activeLang === 'php' || activeLang === 'cpp')) {
            if (activeLang === 'cpp') {
                // C++ preprocessor directives (#include, #define, etc.)
                const end = code.indexOf('\n', i);
                const finish = end === -1 ? len : end;
                tokens.push({ type: 'comment', value: code.slice(i, finish) });
                i = finish; continue;
            }
            const end = code.indexOf('\n', i);
            const finish = end === -1 ? len : end;
            tokens.push({ type: 'comment', value: code.slice(i, finish) });
            i = finish; continue;
        }
        // ── Python/Ruby decorators / annotations: @name ───────────────────
        if (code[i] === '@' && /[a-zA-Z_]/.test(code[i+1] || '')) {
            let j = i + 1;
            while (j < len && /[\w.]/.test(code[j])) j++;
            tokens.push({ type: 'decorator', value: code.slice(i, j) });
            i = j; continue;
        }
        // ── Triple-quoted strings: """ or ''' (Python) ────────────────────
        if ((code[i] === '"' && code[i+1] === '"' && code[i+2] === '"') ||
            (code[i] === "'" && code[i+1] === "'" && code[i+2] === "'")) {
            const q = code.slice(i, i+3);
            const end = code.indexOf(q, i + 3);
            const finish = end === -1 ? len : end + 3;
            tokens.push({ type: 'string', value: code.slice(i, finish) });
            i = finish; continue;
        }
        // ── Regular strings: " ' ` ────────────────────────────────────────
        if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
            const q = code[i];
            let j = i + 1;
            while (j < len) {
                if (code[j] === '\\') { j += 2; continue; } // skip escaped
                if (code[j] === q)    { j++;    break;     }
                j++;
            }
            tokens.push({ type: 'string', value: code.slice(i, j) });
            i = j; continue;
        }
        // ── Numbers ───────────────────────────────────────────────────────
        if (/[0-9]/.test(code[i]) &&
            (i === 0 || /[\s,;:([\-+*/%=!<>&|^~]/.test(code[i-1]))) {
            let j = i;
            while (j < len && /[0-9a-fA-FxX_.eE]/.test(code[j])) j++;
            tokens.push({ type: 'number', value: code.slice(i, j) });
            i = j; continue;
        }
        // ── Identifiers and keywords ──────────────────────────────────────
        if (/[a-zA-Z_$]/.test(code[i])) {
            let j = i;
            while (j < len && /[\w$]/.test(code[j])) j++;
            const word = code.slice(i, j);
            tokens.push({ type: keywords.has(word) ? 'keyword' : 'code', value: word });
            i = j; continue;
        }
        // ── Everything else: operators, punctuation, whitespace ───────────
        tokens.push({ type: 'code', value: code[i] });
        i++; continue;
    }

    // ── Emit HTML (escape once here, never again) ─────────────────────────
    function esc(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    return tokens.map(tok => {
        const v = esc(tok.value);
        switch (tok.type) {
            case 'comment':   return `<span class="syntax-comment">${v}</span>`;
            case 'string':    return `<span class="syntax-string">${v}</span>`;
            case 'keyword':   return `<span class="syntax-keyword">${v}</span>`;
            case 'number':    return `<span class="syntax-number">${v}</span>`;
            case 'decorator': return `<span class="syntax-decorator">${v}</span>`;
            default:          return v;
        }
    }).join('');
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
            <pre><code>${highlightCode(example.code, currentLanguage)}</code></pre>
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

// ─── Per-language demo data ────────────────────────────────────────────────
// Each entry: before code, after code, doc standard label,
// RAG before/after scores, GEO before/after scores, and 6 metric pills.
const DEMO_DATA = {
    javascript: {
        docStandard: 'JSDoc Standard',
        ragBefore: 11, ragAfter: 89,
        geoBefore: 9,  geoAfter: 86,
        pills: ['📋 JSDoc Standard','🔖 @param Types','↩️ @returns Docs','💡 @example Added','⚠️ @throws Noted','📈 85% Coverage'],
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
 * Calculates the age of a person from their birth date.
 * Uses calendar-aware subtraction to handle partial years correctly.
 *
 * @param {string} birthDate - ISO 8601 date string (e.g. '1990-05-15')
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
    if (isNaN(birth.getTime())) throw new Error('Invalid birth date format');
    if (birth > today)          throw new Error('Birth date cannot be in the future');
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}`
    },
    typescript: {
        docStandard: 'TSDoc Standard',
        ragBefore: 12, ragAfter: 93,
        geoBefore: 10, geoAfter: 91,
        pills: ['📋 TSDoc Standard','🔖 @param Types','↩️ @returns Typed','💡 @example Added','⚠️ @throws Noted','📈 90% Coverage'],
        before: `// fetches user profile from API
async function fetchUserProfile(userId) {
    const resp = await fetch('/api/users/' + userId);
    if (!resp.ok) throw new Error('not found');
    return resp.json();
}`,
        after: `/**
 * Fetches a user profile from the REST API by ID.
 * Uses native fetch; caller is responsible for auth headers.
 *
 * @param userId - The unique numeric identifier for the user
 * @returns A promise resolving to the user profile object
 * @throws {Error} When the HTTP response is not OK (e.g. 404, 500)
 *
 * @example
 * const profile = await fetchUserProfile(42);
 * console.log(profile.name);
 */
async function fetchUserProfile(userId: number): Promise<UserProfile> {
    const resp = await fetch(\`/api/users/\${userId}\`);
    if (!resp.ok) throw new Error(\`User \${userId} not found\`);
    return resp.json() as Promise<UserProfile>;
}`
    },
    python: {
        docStandard: 'Google Docstring',
        ragBefore: 10, ragAfter: 94,
        geoBefore: 8,  geoAfter: 91,
        pills: ['📋 Google Docstring','🔖 Args: section','↩️ Returns: typed','💡 Example: block','⚠️ Raises: noted','📈 92% Coverage'],
        before: `# compute fibonacci number
def fibonacci(n):
    if n < 0:
        raise ValueError("negative input")
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`,
        after: `def fibonacci(n: int) -> int:
    """Compute the nth Fibonacci number recursively.

    Uses the mathematical definition F(n) = F(n-1) + F(n-2).
    Note: not suitable for large n due to O(2^n) time complexity.

    Args:
        n: Index in the Fibonacci sequence (0-indexed, non-negative).

    Returns:
        The nth Fibonacci number as an integer.

    Raises:
        ValueError: If n is negative.

    Example:
        >>> fibonacci(7)
        13
    """
    if n < 0:
        raise ValueError(f"Expected non-negative int, got {n}")
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`
    },
    java: {
        docStandard: 'Javadoc Standard',
        ragBefore: 12, ragAfter: 92,
        geoBefore: 10, geoAfter: 88,
        pills: ['📋 Javadoc Standard','🔖 @param Tags','↩️ @return Typed','💡 @since Added','⚠️ @throws Noted','📈 88% Coverage'],
        before: `// reverses a string
public static String reverseString(String input) {
    if (input == null) throw new IllegalArgumentException("null input");
    return new StringBuilder(input).reverse().toString();
}`,
        after: `/**
 * Reverses the characters of the given string.
 *
 * <p>Uses {@link StringBuilder#reverse()} for O(n) in-place reversal.
 * Null inputs are rejected early to prevent NullPointerExceptions downstream.
 *
 * @param input the string to reverse; must not be {@code null}
 * @return a new string with characters in reverse order
 * @throws IllegalArgumentException if {@code input} is {@code null}
 * @since 1.0
 *
 * <pre>
 * reverseString("hello") // returns "olleh"
 * reverseString("")       // returns ""
 * </pre>
 */
public static String reverseString(String input) {
    if (input == null) throw new IllegalArgumentException("Input must not be null");
    return new StringBuilder(input).reverse().toString();
}`
    },
    go: {
        docStandard: 'GoDoc Standard',
        ragBefore: 11, ragAfter: 87,
        geoBefore: 9,  geoAfter: 84,
        pills: ['📋 GoDoc Format','🔖 Param Context','↩️ Return Noted','💡 Example_() Added','⚠️ Error Handling','📈 85% Coverage'],
        before: `// splits a slice into chunks
func chunkSlice(s []int, size int) [][]int {
    var chunks [][]int
    for size < len(s) {
        s, chunks = s[size:], append(chunks, s[0:size:size])
    }
    return append(chunks, s)
}`,
        after: `// ChunkSlice splits a slice of integers into sub-slices of the given size.
// The last chunk may be smaller than size if len(s) is not evenly divisible.
//
// ChunkSlice panics if size is less than or equal to zero.
//
// Example:
//
//	ChunkSlice([]int{1,2,3,4,5}, 2) // [[1 2] [3 4] [5]]
func ChunkSlice(s []int, size int) [][]int {
    if size <= 0 {
        panic("chunkSlice: size must be > 0")
    }
    var chunks [][]int
    for size < len(s) {
        s, chunks = s[size:], append(chunks, s[0:size:size])
    }
    return append(chunks, s)
}`
    },
    rust: {
        docStandard: 'Rustdoc Standard',
        ragBefore: 10, ragAfter: 88,
        geoBefore: 8,  geoAfter: 85,
        pills: ['📋 Rustdoc Format','🔖 # Arguments','↩️ # Returns','💡 # Examples','⚠️ # Panics Noted','📈 87% Coverage'],
        before: `// divides two numbers safely
fn safe_divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 { None } else { Some(a / b) }
}`,
        after: `/// Divides \`a\` by \`b\`, returning \`None\` if \`b\` is zero.
///
/// Avoids floating-point division by zero by explicitly checking the divisor.
/// Returns \`Some(result)\` on success or \`None\` when division is undefined.
///
/// # Arguments
///
/// * \`a\` - The dividend (numerator)
/// * \`b\` - The divisor (denominator); must not be \`0.0\`
///
/// # Returns
///
/// * \`Some(f64)\` — the quotient when \`b != 0.0\`
/// * \`None\` — when \`b == 0.0\`
///
/// # Examples
///
/// \`\`\`
/// assert_eq!(safe_divide(10.0, 2.0), Some(5.0));
/// assert_eq!(safe_divide(1.0, 0.0), None);
/// \`\`\`
fn safe_divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 { None } else { Some(a / b) }
}`
    },
    cpp: {
        docStandard: 'Doxygen Standard',
        ragBefore: 11, ragAfter: 85,
        geoBefore: 9,  geoAfter: 82,
        pills: ['📋 Doxygen Format','🔖 @param Typed','↩️ @return Noted','💡 @code Example','⚠️ @throws Tagged','📈 83% Coverage'],
        before: `// binary search implementation
int binarySearch(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
        after: `/**
 * @brief Performs binary search on a sorted integer vector.
 *
 * Searches for @p target using the divide-and-conquer approach.
 * Uses midpoint formula \`lo + (hi-lo)/2\` to prevent integer overflow.
 *
 * @param arr    Reference to a sorted vector of integers (ascending order)
 * @param target The integer value to search for
 * @return       Index of @p target in @p arr, or -1 if not found
 *
 * @code
 * vector<int> v = {1, 3, 5, 7, 9};
 * int idx = binarySearch(v, 5); // returns 2
 * @endcode
 */
int binarySearch(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`
    },
    csharp: {
        docStandard: 'XML Doc Standard',
        ragBefore: 12, ragAfter: 91,
        geoBefore: 10, geoAfter: 87,
        pills: ['📋 XML Doc Tags','🔖 <param> Types','↩️ <returns> Docs','💡 <example> Added','⚠️ <exception> Tag','📈 89% Coverage'],
        before: `// sends email notification
public async Task SendEmailAsync(string to, string subject, string body) {
    using var client = new SmtpClient(_host, _port);
    var msg = new MailMessage(_from, to, subject, body);
    await client.SendMailAsync(msg);
}`,
        after: `/// <summary>
/// Sends an email notification asynchronously using the configured SMTP server.
/// </summary>
/// <remarks>
/// Disposes the <see cref="SmtpClient"/> after each send to avoid connection pooling issues.
/// Ensure <c>_host</c> and <c>_port</c> are configured before calling this method.
/// </remarks>
/// <param name="to">Recipient email address (RFC 5321 compliant)</param>
/// <param name="subject">Email subject line; should not exceed 78 characters</param>
/// <param name="body">Plain-text or HTML email body content</param>
/// <returns>A task that completes when the email has been sent</returns>
/// <exception cref="SmtpException">Thrown when the SMTP server is unreachable</exception>
/// <example>
/// <code>
/// await SendEmailAsync("user@example.com", "Welcome!", "Thanks for signing up.");
/// </code>
/// </example>
public async Task SendEmailAsync(string to, string subject, string body) {
    using var client = new SmtpClient(_host, _port);
    var msg = new MailMessage(_from, to, subject, body);
    await client.SendMailAsync(msg);
}`
    },
    ruby: {
        docStandard: 'YARD Standard',
        ragBefore: 10, ragAfter: 84,
        geoBefore: 8,  geoAfter: 81,
        pills: ['📋 YARD Format','🔖 @param Typed','↩️ @return Typed','💡 @example Added','⚠️ @raise Noted','📈 82% Coverage'],
        before: `# formats currency amount
def format_currency(amount, currency = 'USD')
    symbol = currency == 'USD' ? '$' : currency
    "#{symbol}#{sprintf('%.2f', amount.abs)}"
end`,
        after: `# Formats a numeric amount as a currency string.
#
# Converts the absolute value of +amount+ to a 2-decimal string prefixed
# with the appropriate currency symbol. Negative amounts are displayed
# as positive (use sign logic upstream if needed).
#
# @param amount [Numeric] The monetary value to format
# @param currency [String] ISO 4217 currency code (default: 'USD')
# @return [String] Formatted currency string, e.g. "$12.50"
# @raise [ArgumentError] If +amount+ cannot be coerced to a float
#
# @example Basic usage
#   format_currency(12.5)        #=> "$12.50"
#   format_currency(9.99, 'EUR') #=> "EUR9.99"
def format_currency(amount, currency = 'USD')
    symbol = currency == 'USD' ? '$' : currency
    "#{symbol}#{sprintf('%.2f', amount.abs)}"
end`
    },
    php: {
        docStandard: 'PHPDoc Standard',
        ragBefore: 11, ragAfter: 83,
        geoBefore: 9,  geoAfter: 80,
        pills: ['📋 PHPDoc Format','🔖 @param Typed','↩️ @return Typed','💡 @example Added','⚠️ @throws Noted','📈 80% Coverage'],
        before: `// sanitize user input
function sanitizeInput($input, $maxLen = 255) {
    $clean = trim(strip_tags($input));
    return substr($clean, 0, $maxLen);
}`,
        after: `/**
 * Sanitizes user-supplied input for safe storage or display.
 *
 * Strips HTML/PHP tags, trims whitespace, then truncates to \$maxLen
 * characters. Does NOT escape for SQL — use prepared statements separately.
 *
 * @param string $input   Raw user input to sanitize
 * @param int    $maxLen  Maximum character length to retain (default: 255)
 *
 * @return string Sanitized and truncated string
 *
 * @throws \\InvalidArgumentException If \$maxLen is less than 1
 *
 * @example
 * $safe = sanitizeInput('<b>Hello</b> World!', 10);
 * // Returns: "Hello Worl"
 */
function sanitizeInput(string $input, int $maxLen = 255): string {
    if ($maxLen < 1) throw new \\InvalidArgumentException('maxLen must be >= 1');
    $clean = trim(strip_tags($input));
    return substr($clean, 0, $maxLen);
}`
    },
    swift: {
        docStandard: 'Swift Markup',
        ragBefore: 10, ragAfter: 86,
        geoBefore: 8,  geoAfter: 84,
        pills: ['📋 Swift Markup','🔖 - Parameter:','↩️ - Returns:','💡 - Note: Added','⚠️ - Throws: Noted','📈 84% Coverage'],
        before: `// clamps value between min and max
func clamp<T: Comparable>(_ value: T, min minVal: T, max maxVal: T) -> T {
    return Swift.max(minVal, Swift.min(maxVal, value))
}`,
        after: `/// Clamps a comparable value to a closed range [minVal, maxVal].
///
/// Returns \`minVal\` if \`value\` is below range, \`maxVal\` if above,
/// or \`value\` itself if already within bounds. Works with any \`Comparable\` type.
///
/// - Parameters:
///   - value: The value to clamp
///   - minVal: The lower bound of the clamped range (inclusive)
///   - maxVal: The upper bound of the clamped range (inclusive)
/// - Returns: The clamped value within [minVal, maxVal]
/// - Note: Behavior is undefined if \`minVal > maxVal\`.
///
/// - Example:
/// \`\`\`swift
/// clamp(15, min: 0, max: 10)  // 10
/// clamp(-5, min: 0, max: 10)  // 0
/// clamp(7,  min: 0, max: 10)  // 7
/// \`\`\`
func clamp<T: Comparable>(_ value: T, min minVal: T, max maxVal: T) -> T {
    return Swift.max(minVal, Swift.min(maxVal, value))
}`
    },
    kotlin: {
        docStandard: 'KDoc Standard',
        ragBefore: 11, ragAfter: 88,
        geoBefore: 9,  geoAfter: 85,
        pills: ['📋 KDoc Format','🔖 @param Typed','↩️ @return Noted','💡 @sample Added','⚠️ @throws Noted','📈 86% Coverage'],
        before: `// retry a suspending block on failure
suspend fun <T> retry(times: Int, block: suspend () -> T): T {
    repeat(times - 1) {
        try { return block() } catch (e: Exception) { /* ignore */ }
    }
    return block()
}`,
        after: `/**
 * Retries a suspending [block] up to [times] attempts on any exception.
 *
 * Attempts execute sequentially. All exceptions from the first (times-1)
 * attempts are swallowed. The final attempt propagates its exception to
 * the caller, preserving the original stack trace.
 *
 * @param T      The return type of the suspending block
 * @param times  Total number of attempts to make (must be >= 1)
 * @param block  The suspending lambda to execute and retry
 * @return       The result of the first successful invocation
 * @throws Exception Re-throws whatever the final attempt throws
 *
 * @sample
 * val result = retry(3) { fetchFromApi() }
 */
suspend fun <T> retry(times: Int, block: suspend () -> T): T {
    repeat(times - 1) {
        try { return block() } catch (e: Exception) { /* retry */ }
    }
    return block()
}`
    }
};

function initializeDemo() {
    const playBtn    = document.getElementById('playDemoBtn');
    const resetBtn   = document.getElementById('resetDemoBtn');
    const tryItBtn   = document.getElementById('tryItNowBtn');
    const demoStats  = document.getElementById('demoStats');
    const langSelect = document.getElementById('demoDemoLang');
    const demoPanels = document.querySelectorAll('.demo-panel');

    let isPlaying = false;

    // ── helpers ──────────────────────────────────────────────────────────────

    // Return current demo data for the selected language (fallback: javascript)
    function currentData() {
        const lang = langSelect ? langSelect.value : 'javascript';
        return DEMO_DATA[lang] || DEMO_DATA.javascript;
    }

    // Update "After: <DocStandard>" heading and metric pill text for selected lang
    function applyLanguageLabels() {
        const data = currentData();
        const docEl = document.getElementById('demoDocStandard');
        if (docEl) docEl.textContent = data.docStandard;
        data.pills.forEach((text, i) => {
            const pill = document.getElementById('metricPill' + i);
            if (pill) pill.textContent = text;
        });
    }

    // Reset all visual state (bars, numbers, pills, panels, code)
    function resetDemo() {
        demoPanels.forEach(p => p.classList.remove('active'));
        demoStats.style.display = 'none';
        resetBtn.style.display  = 'none';
        playBtn.textContent     = '▶️ Play Demo';
        playBtn.disabled        = false;
        isPlaying               = false;

        // Clear typed code
        demoPanels[0].querySelector('.demo-code code').textContent = '';
        demoPanels[1].querySelector('.demo-code code').textContent = '';

        // Reset badge visibility
        demoPanels[0].querySelector('.demo-issues').style.opacity   = '0';
        demoPanels[1].querySelector('.demo-benefits').style.opacity = '0';

        // Reset score numbers
        ['ragBefore','ragAfter','geoBefore','geoAfter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        // Reset deltas
        ['ragDelta','geoDelta'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.opacity = '0';
        });
        ['ragDeltaNum','geoDeltaNum'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        // Reset bars
        ['ragBarBefore','ragBarAfter','geoBarBefore','geoBarAfter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.transition = 'none'; el.style.width = '0%'; }
        });
        // Reset metric pills
        for (let i = 0; i < 6; i++) {
            const pill = document.getElementById('metricPill' + i);
            if (pill) pill.style.opacity = '0';
        }

        // Reapply labels for currently selected language
        applyLanguageLabels();
    }

    // ── language change → auto-reset ─────────────────────────────────────────
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            resetDemo();
        });
    }

    // ── play button ───────────────────────────────────────────────────────────
    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        isPlaying        = true;
        playBtn.disabled = true;
        playBtn.textContent = '⏸️ Playing...';

        const data = currentData();

        // Ensure labels are fresh before animation
        applyLanguageLabels();

        if (window.polyglotAnalytics) {
            window.polyglotAnalytics.trackEvent('demo_played', {
                source: 'demo_section',
                language: langSelect ? langSelect.value : 'javascript'
            });
        }

        const beforeIssues  = demoPanels[0].querySelector('.demo-issues');
        const afterBenefits = demoPanels[1].querySelector('.demo-benefits');
        beforeIssues.style.opacity  = '0';
        afterBenefits.style.opacity = '0';

        // Step 1: Before panel + type code (line-by-line, fast)
        demoPanels[0].classList.add('active');
        await typeCode(demoPanels[0].querySelector('.demo-code code'), data.before, 8);
        await sleep(80);
        beforeIssues.style.transition = 'opacity 0.3s ease-in';
        beforeIssues.style.opacity    = '1';
        await sleep(300);

        // Step 2: After panel + type improved code (line-by-line, fast)
        demoPanels[1].classList.add('active');
        await typeCode(demoPanels[1].querySelector('.demo-code code'), data.after, 6);
        await sleep(80);
        afterBenefits.style.transition = 'opacity 0.3s ease-in';
        afterBenefits.style.opacity    = '1';
        await sleep(300);

        // Step 3: Animated scores for this language
        demoStats.style.display = 'flex';
        await sleep(60);
        await animateDemoScores(data);
        await sleep(300);

        playBtn.textContent      = '✓ Demo Complete';
        playBtn.disabled         = false;
        resetBtn.style.display   = 'inline-block';
        isPlaying                = false;
    });

    // ── reset button ─────────────────────────────────────────────────────────
    resetBtn.addEventListener('click', resetDemo);

    // ── try it now ───────────────────────────────────────────────────────────
    if (tryItBtn) {
        tryItBtn.addEventListener('click', () => {
            const apiSettings = document.getElementById('commentGenerator');
            if (apiSettings) {
                apiSettings.scrollIntoView({ behavior: 'smooth', block: 'start' });
                try {
                    const rect      = apiSettings.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    window.scrollTo({ top: rect.top + scrollTop - 24, behavior: 'smooth' });
                } catch (e) { /* silent */ }
            }
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('demo_cta_clicked', {
                    source: 'demo_section', action: 'try_it_now'
                });
            }
        });
    }

    // Apply initial labels on load
    applyLanguageLabels();

    // ── typeCode helper — line-by-line for speed, still looks like typing ──────
    async function typeCode(codeElement, code, speed = 8) {
        codeElement.textContent = '';
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            codeElement.textContent =
                lines.slice(0, i + 1).join('\n');
            await sleep(speed * 3);
        }
    }

    // Apply initial labels on load (already called above; safe to remove duplication)
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

// Animate all score sections sequentially using language-specific data
// data = one entry from DEMO_DATA (ragBefore, ragAfter, geoBefore, geoAfter)
async function animateDemoScores(data) {
    const ragB  = data ? data.ragBefore  : 11;
    const ragA  = data ? data.ragAfter   : 89;
    const geoB  = data ? data.geoBefore  : 9;
    const geoA  = data ? data.geoAfter   : 86;

    // % improvement (rounded)
    const ragDelta = Math.round(((ragA - ragB) / Math.max(ragB, 1)) * 100);
    const geoDelta = Math.round(((geoA - geoB) / Math.max(geoB, 1)) * 100);

    // ── RAG ──────────────────────────────────────────────────────────────────
    // Set "Before" static number immediately (no animation — it's the baseline)
    const ragBeforeEl = document.getElementById('ragBefore');
    if (ragBeforeEl) ragBeforeEl.textContent = ragB;

    animateBar('ragBarBefore', ragB, 400);
    await sleep(150);
    animateBar('ragBarAfter', ragA, 800);
    countUp('ragAfter', 0, ragA, 800);
    fadeInEl('ragDelta', 600);
    setTimeout(() => countUp('ragDeltaNum', 0, ragDelta, 800), 150);

    await sleep(250);

    // ── GEO ──────────────────────────────────────────────────────────────────
    const geoBeforeEl = document.getElementById('geoBefore');
    if (geoBeforeEl) geoBeforeEl.textContent = geoB;

    animateBar('geoBarBefore', geoB, 400);
    await sleep(150);
    animateBar('geoBarAfter', geoA, 800);
    countUp('geoAfter', 0, geoA, 800);
    fadeInEl('geoDelta', 600);
    setTimeout(() => countUp('geoDeltaNum', 0, geoDelta, 800), 150);

    await sleep(300);

    // ── Metric pills — staggered fade-in ────────────────────────────────────
    for (let i = 0; i < 6; i++) {
        fadeInEl('metricPill' + i, i * 60);
    }
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
    const whyBtn      = document.getElementById('whyBtn');
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
    
    // Test API connection — proxied through our worker to avoid CORS issues.
    // Anthropic blocks browser-to-API CORS; OpenAI allows it but we proxy both
    // for consistency. The worker calls the provider server-side and returns
    // { ok: true } or { ok: false, error: "..." }. No generation, no token cost.
    testBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            alert('⚠️ Please enter an API key first');
            return;
        }

        testBtn.disabled = true;
        testBtn.textContent = 'Testing…';

        const provider = providerSelect.value;
        const providerLabel = provider === 'openai' ? 'OpenAI' : 'Anthropic';

        try {
            let testOk = false;
            let testMsg = '';

            if (provider === 'openai') {
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                if (res.ok || res.status === 429) {
                    testOk = true;
                } else {
                    const d = await res.json().catch(() => ({}));
                    testMsg = d?.error?.message || `HTTP ${res.status}`;
                    if (res.status === 401) testMsg = 'Invalid API key — check it at platform.openai.com';
                }
            } else {
                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] })
                });
                if (res.ok || res.status === 429 || res.status === 529) {
                    testOk = true;
                } else {
                    const d = await res.json().catch(() => ({}));
                    testMsg = d?.error?.message || `HTTP ${res.status}`;
                    if (res.status === 401) testMsg = 'Invalid API key — check it at console.anthropic.com';
                }
            }

            if (testOk) {
                apiStatus.classList.remove('error');
                apiStatus.classList.add('configured');
                apiStatus.querySelector('.status-text').textContent = `✓ ${providerLabel} key valid`;
                alert(`✅ ${providerLabel} API key is valid and ready!`);
                if (window.polyglotAnalytics) {
                    window.polyglotAnalytics.trackEvent('api_test_success', { provider });
                }
            } else {
                throw new Error(testMsg || `${providerLabel} key validation failed`);
            }

        } catch (error) {
            apiStatus.classList.remove('configured');
            apiStatus.classList.add('error');
            apiStatus.querySelector('.status-text').textContent = `✗ ${error.message}`;
            alert(`❌ Connection failed: ${error.message}\n\nPlease check your API key and try again.`);
            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('api_test_failed', { provider, error: error.message });
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

    // ── Why Comments button ──────────────────────────────────────────
    whyBtn.addEventListener('click', async () => {
        if (!window.aiGenerator.isConfigured()) {
            alert('⚙️ Please configure your AI API key first.\n\nClick "AI Settings" to add your OpenAI or Anthropic API key.');
            aiSettingsBtn.click();
            return;
        }

        const codeEditor = document.getElementById('cgInput') || document.getElementById('codeEditor') || { value: '' };
        const code = codeEditor.value.trim();
        if (!code) {
            alert('📝 Please paste some code in the editor first.');
            return;
        }

        const language = document.getElementById('language').value;

        whyBtn.classList.add('loading');
        whyBtn.disabled = true;
        whyBtn.textContent = '💬 Generating…';

        try {
            const result = await window.aiGenerator.generateWhyComments(code, language);
            displayWhyResults(result);

            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('why_generation_success', {
                    language,
                    provider: result.provider,
                    model: result.model,
                    cost: result.cost
                });
            }
        } catch (error) {
            alert(`❌ Why-comment generation failed: ${error.message}\n\nPlease check your API key and try again.`);

            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('why_generation_failed', {
                    language,
                    error: error.message
                });
            }
        } finally {
            whyBtn.classList.remove('loading');
            whyBtn.disabled = false;
            whyBtn.textContent = '💬 Why Comments';
        }
    });

    // ── Render why-comments results (reuses ai-results panel with a why badge) ──
    function displayWhyResults(result) {
        const existing = document.querySelector('.ai-results');
        if (existing) existing.remove();

        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'ai-results';
        resultsDiv.id = 'aiResultsDiv';
        resultsDiv.innerHTML = `
            <div class="ai-results-header">
                <h3>💬 Why Comments <span class="why-badge">WHY</span></h3>
                <span class="ai-cost">Cost: $${result.cost.toFixed(4)}</span>
            </div>
            <p class="why-results-desc">Inline comments explaining the <em>reasoning</em> and <em>intent</em> behind your code — not just what it does.</p>
            <div class="ai-code-wrapper">
                <button class="ai-copy-inline" id="copyAiCodeInline" title="Copy code">📋</button>
                <div class="ai-code-output">${escapeHtml(result.code)}</div>
            </div>
            <div class="ai-actions">
                <button class="btn-primary" id="copyAiCode">📋 Copy to Clipboard</button>
                <button class="btn-primary" id="replaceCode">✅ Replace Code</button>
                <button class="btn-secondary" id="closeAiResults">✗ Close</button>
            </div>
        `;

        const suggestions = document.getElementById('suggestions');
        suggestions.parentNode.insertBefore(resultsDiv, suggestions.nextSibling);

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

        document.getElementById('copyAiCodeInline').addEventListener('click', function () {
            navigator.clipboard.writeText(result.code).then(() => {
                flashCopied(this, '📋');
            }).catch(() => {
                this.innerHTML = '❌';
                setTimeout(() => { this.innerHTML = '📋'; }, 2000);
            });
        });

        document.getElementById('copyAiCode').addEventListener('click', function () {
            navigator.clipboard.writeText(result.code).then(() => {
                flashCopied(this, '📋 Copy to Clipboard');
            }).catch(() => {
                this.innerHTML = '❌ Copy failed';
                setTimeout(() => { this.innerHTML = '📋 Copy to Clipboard'; }, 2000);
            });
        });

        document.getElementById('replaceCode').addEventListener('click', function () {
            const codeEditor = document.getElementById('cgInput') || document.getElementById('codeEditor') || { value: '' };
            codeEditor.value = result.code;
            flashCopied(this, '✅ Replace Code');
            setTimeout(() => resultsDiv.remove(), 1200);
        });

        document.getElementById('closeAiResults').addEventListener('click', () => resultsDiv.remove());

        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

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
   Sample Code — one real snippet per language, no API key needed
   ═══════════════════════════════════════════════════════════ */
const SAMPLES = {
    python: {
        lang: 'python', label: 'Python',
        code: `import re
from collections import defaultdict

class LogParser:
    def __init__(self, path):
        self.path = path
        self.errors = defaultdict(int)
        self._pattern = re.compile(r'\\[(ERROR|WARN|INFO)\\]\\s+(.*)')

    def parse(self):
        with open(self.path, 'r') as f:
            for line in f:
                m = self._pattern.search(line)
                if m:
                    level, msg = m.group(1), m.group(2).strip()
                    self.errors[level] += 1
        return dict(self.errors)

    def top_errors(self, n=5):
        sorted_items = sorted(self.errors.items(), key=lambda x: x[1], reverse=True)
        return sorted_items[:n]


def summarise(path):
    parser = LogParser(path)
    counts = parser.parse()
    return parser.top_errors()
`,
    },
    javascript: {
        lang: 'javascript', label: 'JavaScript',
        code: `const CACHE_TTL = 5 * 60 * 1000;

class DataCache {
    constructor() {
        this._store = new Map();
    }

    set(key, value) {
        this._store.set(key, { value, ts: Date.now() });
    }

    get(key) {
        const entry = this._store.get(key);
        if (!entry) return null;
        if (Date.now() - entry.ts > CACHE_TTL) {
            this._store.delete(key);
            return null;
        }
        return entry.value;
    }

    invalidate(key) {
        this._store.delete(key);
    }

    purge() {
        const now = Date.now();
        for (const [k, v] of this._store) {
            if (now - v.ts > CACHE_TTL) this._store.delete(k);
        }
    }
}

async function fetchWithCache(cache, url) {
    const cached = cache.get(url);
    if (cached) return cached;
    const res = await fetch(url);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    cache.set(url, data);
    return data;
}
`,
    },
    typescript: {
        lang: 'typescript', label: 'TypeScript',
        code: `interface PaginationOptions {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

async function paginate<T>(
    fetchAll: () => Promise<T[]>,
    opts: PaginationOptions,
    filter?: (item: T) => boolean
): Promise<PaginatedResult<T>> {
    let items = await fetchAll();
    if (filter) items = items.filter(filter);
    const total = items.length;
    const totalPages = Math.ceil(total / opts.pageSize);
    const start = (opts.page - 1) * opts.pageSize;
    const slice = items.slice(start, start + opts.pageSize);
    return { items: slice, total, page: opts.page, pageSize: opts.pageSize, totalPages };
}
`,
    },
    go: {
        lang: 'go', label: 'Go',
        code: `package ratelimit

import (
    "sync"
    "time"
)

type RateLimiter struct {
    mu       sync.Mutex
    tokens   float64
    maxTokens float64
    refillRate float64
    lastRefill time.Time
}

func New(maxTokens, refillPerSecond float64) *RateLimiter {
    return &RateLimiter{
        tokens:     maxTokens,
        maxTokens:  maxTokens,
        refillRate: refillPerSecond,
        lastRefill: time.Now(),
    }
}

func (r *RateLimiter) Allow() bool {
    r.mu.Lock()
    defer r.mu.Unlock()
    now := time.Now()
    elapsed := now.Sub(r.lastRefill).Seconds()
    r.tokens = min(r.maxTokens, r.tokens + elapsed*r.refillRate)
    r.lastRefill = now
    if r.tokens >= 1 {
        r.tokens--
        return true
    }
    return false
}

func min(a, b float64) float64 {
    if a < b { return a }
    return b
}
`,
    },
    rust: {
        lang: 'rust', label: 'Rust',
        code: `use std::collections::HashMap;
use std::hash::Hash;

pub struct LruCache<K, V> {
    capacity: usize,
    map: HashMap<K, V>,
    order: Vec<K>,
}

impl<K: Eq + Hash + Clone, V> LruCache<K, V> {
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            map: HashMap::new(),
            order: Vec::new(),
        }
    }

    pub fn get(&mut self, key: &K) -> Option<&V> {
        if self.map.contains_key(key) {
            self.order.retain(|k| k != key);
            self.order.push(key.clone());
            self.map.get(key)
        } else {
            None
        }
    }

    pub fn insert(&mut self, key: K, value: V) {
        if self.map.len() == self.capacity {
            if let Some(oldest) = self.order.first().cloned() {
                self.order.remove(0);
                self.map.remove(&oldest);
            }
        }
        self.order.push(key.clone());
        self.map.insert(key, value);
    }
}
`,
    },
    java: {
        lang: 'java', label: 'Java',
        code: `import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class EventBus<T> {
    private final List<EventHandler<T>> handlers = new ArrayList<>();

    @FunctionalInterface
    public interface EventHandler<T> {
        void handle(T event);
    }

    public void subscribe(EventHandler<T> handler) {
        if (handler == null) throw new IllegalArgumentException("Handler must not be null");
        handlers.add(handler);
    }

    public boolean unsubscribe(EventHandler<T> handler) {
        return handlers.remove(handler);
    }

    public void publish(T event) {
        handlers.forEach(h -> {
            try {
                h.handle(event);
            } catch (Exception e) {
                System.err.println("Handler error: " + e.getMessage());
            }
        });
    }

    public int subscriberCount() {
        return handlers.size();
    }
}
`,
    },
};

function loadSample(lang) {
    const sample = SAMPLES[lang];
    if (!sample) return;

    const input    = document.getElementById('cgInput');
    const langSel  = document.getElementById('cgLanguage');
    if (!input || !langSel) return;

    // Fill textarea
    input.value = sample.code;

    // Mark all sample buttons inactive, highlight the clicked one
    document.querySelectorAll('.sample-btn').forEach(b => b.classList.remove('active'));
    const clicked = [...document.querySelectorAll('.sample-btn')]
        .find(b => b.textContent.trim() === sample.label);
    if (clicked) clicked.classList.add('active');

    // Reset override so detection runs fresh
    // (access via the closure inside initCommentGenerator isn't possible from outside,
    //  so we dispatch a real paste event to trigger the existing paste handler)
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Set language directly and sync style
    langSel.value = sample.lang;
    langSel.dispatchEvent(new Event('change', { bubbles: true }));

    // Override the user-override flag by dispatching paste (triggers full detection path)
    const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer(),
    });
    input.dispatchEvent(pasteEvent);

    // Update stats line
    const stats = document.getElementById('cgInputStats');
    if (stats) {
        const lines = sample.code.split('\n').length;
        stats.textContent = `${lines} lines · ${sample.code.length} chars`;
    }

    // Track
    if (window.polyglotAnalytics) {
        window.polyglotAnalytics.trackEvent('sample_loaded', { lang });
    }

    // Scroll into view
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ═══════════════════════════════════════════════════════════
   Comment Generator — parallel design to markdown.poly-glot.ai
   ═══════════════════════════════════════════════════════════ */
function initCommentGenerator() {
    // Settings elements
    const cgLanguage     = document.getElementById('cgLanguage');
    const cgStyle        = document.getElementById('cgStyle');
    const cgProvider          = document.getElementById('cgProvider');
    const cgModel             = document.getElementById('cgModel');
    const cgCustomModelRow    = document.getElementById('cgCustomModelRow');
    const cgCustomModelInput  = document.getElementById('cgCustomModelInput');
    const CG_CUSTOM_VAL       = '__cg_custom__';
    const CG_CUSTOM_KEY       = 'cg_custom_model';

    /** Show/hide custom model input row for the generator panel */
    function toggleCgCustomRow(show) {
        if (!cgCustomModelRow) return;
        cgCustomModelRow.style.display = show ? 'block' : 'none';
        if (show && cgCustomModelInput) {
            const saved = localStorage.getItem(CG_CUSTOM_KEY) || '';
            cgCustomModelInput.value = saved;
            cgCustomModelInput.focus();
        }
    }

    /** Returns the actual model ID to use — handles custom entry */
    function resolveCgModel() {
        if (cgModel.value === CG_CUSTOM_VAL) {
            return (cgCustomModelInput && cgCustomModelInput.value.trim()) || 'gpt-4.1-mini';
        }
        return cgModel.value;
    }
    const cgApiKey       = document.getElementById('cgApiKey');
    const cgToggleKey    = document.getElementById('cgToggleKey');
    const cgSaveKey      = document.getElementById('cgSaveKey');
    // NOTE: cgKeyStatus is intentionally NOT captured as a closure variable.
    // All status updates go through showKeyStatus() which always re-fetches
    // via document.getElementById('cgKeyStatus') — immune to DOM re-renders.

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
    const MODELS = { // eslint-disable-line no-unused-vars
        openai: [
            { value: 'gpt-4.1-mini',   label: 'GPT-4.1 Mini ✨ (recommended)' },
            { value: 'gpt-4.1',        label: 'GPT-4.1 (best)' },
            { value: 'gpt-4.1-nano',   label: 'GPT-4.1 Nano (cheapest)' },
            { value: 'gpt-4o',         label: 'GPT-4o' },
            { value: 'gpt-4o-mini',    label: 'GPT-4o Mini' },
            { value: 'o3-mini',        label: 'o3-mini (reasoning)' },
            { value: 'o3',             label: 'o3 (reasoning, powerful)' },
            { value: 'o1-mini',        label: 'o1-mini (reasoning)' },
            { value: 'o1',             label: 'o1 (reasoning)' },
            { value: 'gpt-4-turbo',    label: 'GPT-4 Turbo' },
            { value: 'gpt-4',          label: 'GPT-4' },
            { value: 'gpt-3.5-turbo',  label: 'GPT-3.5 Turbo (legacy)' }
        ],
        anthropic: [
            { value: 'claude-sonnet-4-5',          label: 'Claude Sonnet 4 ✨ (recommended)' },
            { value: 'claude-opus-4-5',            label: 'Claude Opus 4 (most powerful)' },
            { value: 'claude-haiku-4-5',           label: 'Claude Haiku 4 (fast)' },
            { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
            { value: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku' },
            { value: 'claude-3-opus-20240229',     label: 'Claude 3 Opus' },
            { value: 'claude-3-haiku-20240307',    label: 'Claude 3 Haiku (legacy)' }
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

    // ── Restore saved settings ──────────────────────────────────────────────
    // Uses showKeyStatus() — never the closure-captured cgKeyStatus variable.
    // Delayed by one tick so the 'input' listener fires before the status is set,
    // preventing the listener from immediately clearing the "Key saved" message.
    function restoreSettings() {
        var key      = localStorage.getItem(LS.key)      || '';
        var provider = localStorage.getItem(LS.provider) || 'openai';
        var model    = localStorage.getItem(LS.model)    || 'gpt-4.1-mini';
        if (key) {
            cgApiKey.value = key; // Set DOM property — does NOT fire 'input' event
            setTimeout(function() {
                showKeyStatus('✅ Key saved — ready to generate', 'ok');
            }, 0);
        }
        cgProvider.value = provider;
        updateModelDropdown(provider, model);
        // Sync comment style to match default language on page load
        syncStyleToLanguage();
    }

    function updateModelDropdown(provider, selectedModel) {
        const list = MODELS[provider] || MODELS.openai;
        const isCustom = selectedModel && !list.find(m => m.value === selectedModel);
        cgModel.innerHTML = list
            .map(m => `<option value="${m.value}"${m.value === selectedModel ? ' selected' : ''}>${m.label}</option>`)
            .join('');
        // Always append the custom sentinel
        cgModel.innerHTML += `<option value="${CG_CUSTOM_VAL}"${isCustom ? ' selected' : ''}>✏️ Custom model…</option>`;
        if (isCustom) {
            toggleCgCustomRow(true);
            if (cgCustomModelInput) cgCustomModelInput.value = selectedModel;
        } else {
            toggleCgCustomRow(false);
        }
    }

    // ── Provider change → update model dropdown ──
    cgProvider.addEventListener('change', () => {
        const prov = cgProvider.value;
        updateModelDropdown(prov, prov === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1-mini');
    });

    // ── Custom model row: show/hide + persist ──
    cgModel.addEventListener('change', () => {
        const isCustom = cgModel.value === CG_CUSTOM_VAL;
        toggleCgCustomRow(isCustom);
    });
    if (cgCustomModelInput) {
        cgCustomModelInput.addEventListener('input', () => {
            const val = cgCustomModelInput.value.trim();
            if (val) localStorage.setItem(CG_CUSTOM_KEY, val);
        });
    }

    // ── Sync comment style to language ──
    function syncStyleToLanguage() {
        const style = STYLE_MAP[cgLanguage.value];
        if (!style) return;
        setSelectValue(cgStyle, style);  // use helper so disabled Pro options can still be set
        // Show a brief "auto-set" indicator on the style label
        const lbl = document.querySelector('label[for="cgStyle"]');
        if (!lbl) return;
        let badge = lbl.querySelector('.style-auto-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'style-auto-badge';
            lbl.appendChild(badge);
        }
        badge.textContent = ' auto';
        badge.style.opacity = '1';
        clearTimeout(badge._timer);
        badge._timer = setTimeout(() => { badge.style.opacity = '0'; }, 2000);
    }

    // ── Language change → auto-update comment style ──
    // (manual override handling lives in the auto-detect block below)

    // ── Toggle API key visibility ──
    // (handled below with fresh DOM refs – see "Toggle API key visibility (inline bar)")

    // ══════════════════════════════════════════════════════════════════════
    // KEY STATUS MESSAGING — rebuilt from scratch
    // showKeyStatus() is the ONLY way to show messages in the key row.
    // It bypasses all CSS rules and is immune to race conditions.
    // ══════════════════════════════════════════════════════════════════════

    // Auto-clear timer for status messages
    var _keyStatusTimer = null;

    /**
     * Show a styled status message next to the API key field.
     * Forces visibility via inline styles — immune to CSS :empty rules,
     * stylesheet overrides, and async race conditions.
     *
     * @param {string} msg  - HTML content to display
     * @param {string} type - 'ok' (green) | 'err' (red) | 'info' (grey)
     * @param {number} [autoClearMs] - if set, auto-clear after this many ms
     */
    function showKeyStatus(msg, type, autoClearMs) {
        var palette = {
            ok:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
            err:  { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
            info: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' }
        };
        var p = palette[type] || palette.info;

        // Always look up by ID — never rely on closure-captured reference
        var el = document.getElementById('cgKeyStatus');
        if (!el) {
            el = document.createElement('span');
            el.id = 'cgKeyStatus';
            // Insert after the Save Key button row
            var saveBtn = document.getElementById('cgSaveKey');
            if (saveBtn && saveBtn.parentNode) {
                saveBtn.parentNode.insertAdjacentElement('afterend', el);
            } else {
                // Last resort: append to the API key section container
                var keySection = document.querySelector('.cg-api-key-row') || document.querySelector('.cg-key-bar');
                if (keySection) keySection.appendChild(el);
            }
        }

        // Apply styles atomically — no class-only approach that CSS can neutralise
        el.style.cssText = [
            'display:inline-flex !important',
            'visibility:visible !important',
            'opacity:1 !important',
            'align-items:center',
            'font-size:12px',
            'font-weight:600',
            'padding:4px 10px',
            'border-radius:5px',
            'margin-top:4px',
            'line-height:1.5',
            'color:' + p.color,
            'background:' + p.bg,
            'border:1px solid ' + p.border,
            'transition:none'
        ].join(';');
        el.className = 'pg-key-status' + (type ? ' ' + type : '');
        el.innerHTML = msg;

        // Optional auto-clear
        if (_keyStatusTimer) clearTimeout(_keyStatusTimer);
        if (autoClearMs) {
            _keyStatusTimer = setTimeout(function() {
                var e2 = document.getElementById('cgKeyStatus');
                if (e2) { e2.innerHTML = ''; e2.style.cssText = ''; }
                _keyStatusTimer = null;
            }, autoClearMs);
        }
    }

    /** Clears the key status element silently (no animation). */
    function clearKeyStatus() {
        if (_keyStatusTimer) { clearTimeout(_keyStatusTimer); _keyStatusTimer = null; }
        var el = document.getElementById('cgKeyStatus');
        if (el) { el.innerHTML = ''; el.style.cssText = ''; }
    }

    // ══════════════════════════════════════════════════════════════════════
    // SAVE KEY BUTTON — rebuilt from scratch
    // Gate order: auth → provider → key present → format → server validate
    // The button is re-enabled in `finally` regardless of which path runs.
    // ══════════════════════════════════════════════════════════════════════
    cgSaveKey.addEventListener('click', async function() {
        cgSaveKey.disabled = true;

        try {
            // ── 1. Auth gate ─────────────────────────────────────────────────
            if (!isAuthed()) {
                showKeyStatus(
                    '🔐 <strong>Free account required</strong> — ' +
                    '<a href="#" onclick="if(window.PolyGlotAuth&&typeof window.PolyGlotAuth.openLoginModal===\'function\'){window.PolyGlotAuth.openLoginModal(\'save-key\');}else{var b=document.getElementById(\'headerSignInBtn\');if(b)b.click();} return false;" ' +
                    'style="color:#a78bfa;font-weight:700;text-decoration:none;">Sign up free ↗</a>' +
                    ' &nbsp;·&nbsp; 30 seconds, no credit card',
                    'err'
                );
                return;
            }

            var key      = (document.getElementById('cgApiKey')   || cgApiKey).value.trim();
            var provider = (document.getElementById('cgProvider') || cgProvider).value || '';

            // ── 2. Provider selected ──────────────────────────────────────────
            if (!provider) {
                showKeyStatus('❌ Select a provider (OpenAI or Anthropic) first', 'err');
                return;
            }

            // ── 3. Key not empty ──────────────────────────────────────────────
            if (!key) {
                showKeyStatus('❌ Paste your API key above, then click Save', 'err');
                return;
            }

            // ── 4. Format check ───────────────────────────────────────────────
            var looksOpenAI    = key.startsWith('sk-') && !key.startsWith('sk-ant-');
            var looksAnthropic = key.startsWith('sk-ant-');
            if (provider === 'openai' && looksAnthropic) {
                showKeyStatus('❌ That looks like an Anthropic key — switch provider to Anthropic', 'err');
                return;
            }
            if (provider === 'anthropic' && looksOpenAI) {
                showKeyStatus('❌ That looks like an OpenAI key — switch provider to OpenAI', 'err');
                return;
            }
            if (!looksOpenAI && !looksAnthropic) {
                showKeyStatus('❌ Invalid format — OpenAI keys start with <code>sk-</code>, Anthropic with <code>sk-ant-</code>', 'err');
                return;
            }

            // ── 5. Persist locally before server call ─────────────────────────
            localStorage.setItem(LS.key,      key);
            localStorage.setItem(LS.provider, provider);
            var resolvedModel = resolveCgModel();
            localStorage.setItem(LS.model, resolvedModel);
            if (cgModel.value === CG_CUSTOM_VAL && cgCustomModelInput) {
                localStorage.setItem(CG_CUSTOM_KEY, cgCustomModelInput.value.trim());
            }

            // ── 6. Server validate (zero-token call via Cloudflare Worker) ────
            showKeyStatus('💾 Saving & verifying…', 'info');

            var provLabel = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
            var validateOk  = false;
            var validateMsg = '';

            try {
                var res  = await fetch('https://poly-glot.ai/api/auth/validate-key', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ provider: provider, apiKey: key })
                });
                var data = await res.json().catch(function() { return {}; });

                if (res.ok && data.ok === true) {
                    validateOk = true;
                } else {
                    var raw = (data && data.error ? data.error : '').toLowerCase();
                    if (raw.includes('incorrect') || raw.includes('invalid') || raw.includes('no such')) {
                        validateMsg = '❌ Invalid API key — check for typos or regenerate at your provider';
                    } else if (raw.includes('expired') || raw.includes('deactivated') || raw.includes('revoked')) {
                        validateMsg = '❌ Key expired or revoked — generate a new key at your provider';
                    } else if (raw.includes('quota') || raw.includes('billing') || raw.includes('credit') || raw.includes('insufficient')) {
                        validateMsg = '❌ Billing issue — check your account balance at ' + provLabel;
                    } else if (raw.includes('rate limit') || raw.includes('rate_limit')) {
                        validateOk  = true; // rate-limited = key is valid
                        validateMsg = '⚠️ Rate limited — key is valid, ready to generate';
                    } else if (raw.includes('permission') || raw.includes('unauthorized') || raw.includes('forbidden')) {
                        validateMsg = '❌ Key lacks permissions — ensure API access is enabled';
                    } else {
                        validateMsg = '❌ Validation failed — ' + (data && data.error ? data.error : 'check your key and provider');
                    }
                }
            } catch (_fetchErr) {
                // Network unavailable — key is saved locally, validate on first generate
                validateOk  = true;
                validateMsg = '✅ ' + provLabel + ' key saved (offline — verified on first generate)';
            }

            if (validateOk) {
                showKeyStatus(validateMsg || ('✅ ' + provLabel + ' key saved & verified — ready to generate'), 'ok');
            } else {
                showKeyStatus(validateMsg, 'err');
            }

            if (typeof gtag !== 'undefined') gtag('event', 'cg_api_key_saved', { provider: provider, model: resolvedModel, ok: validateOk });

        } finally {
            // Always re-enable — even if an unexpected error was thrown
            cgSaveKey.disabled = false;
        }
    });

    // ══════════════════════════════════════════════════════════════════════
    // CLEAR STATUS listeners — only clear when key field is edited AND
    // the value differs from what is saved.  Never clear on blur/focus.
    // Provider/model changes always clear (stale status no longer applies).
    // ══════════════════════════════════════════════════════════════════════
    ['cgProvider', 'cgModel'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', clearKeyStatus);
    });
    if (cgApiKey) {
        cgApiKey.addEventListener('input', function() {
            var saved = localStorage.getItem(LS.key) || '';
            // Only clear if user has changed the key from the saved value
            if (cgApiKey.value.trim() !== saved) clearKeyStatus();
        });
    }

    // ── Wire modal Save Key button to same handler ──────────────────────────
    var pgKeySaveBtn = document.getElementById('pgKeySaveBtn');
    if (pgKeySaveBtn) pgKeySaveBtn.addEventListener('click', function() { cgSaveKey.click(); });

    // ── Toggle API key visibility (inline bar) ──────────────────────────────
    if (cgToggleKey) {
        cgToggleKey.addEventListener('click', function() {
            var inp = document.getElementById('cgApiKey');
            if (!inp) return;
            var isHidden = inp.type === 'password';
            inp.type = isHidden ? 'text' : 'password';
            cgToggleKey.textContent = isHidden ? '🙈 Hide' : '👁 Show';
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // TEST CONNECTION BUTTON — rebuilt from scratch
    // Gate order: auth → key present → live API call → result via showKeyStatus
    // ══════════════════════════════════════════════════════════════════════
    var cgTestKey = document.getElementById('cgTestKey');
    if (cgTestKey) {
        cgTestKey.addEventListener('click', async function() {
            var key      = (document.getElementById('cgApiKey')   || {value:''}).value.trim();
            var provider = (document.getElementById('cgProvider') || {value:'openai'}).value || 'openai';

            // ── 1. Auth gate ─────────────────────────────────────────────────
            if (!isAuthed()) {
                showKeyStatus(
                    '🔐 <strong>Free account required</strong> — ' +
                    '<a href="#" onclick="if(window.PolyGlotAuth&&typeof window.PolyGlotAuth.openLoginModal===\'function\'){window.PolyGlotAuth.openLoginModal(\'test-conn\');}else{var b=document.getElementById(\'headerSignInBtn\');if(b)b.click();} return false;" ' +
                    'style="color:#a78bfa;font-weight:700;text-decoration:none;">Sign up free ↗</a>',
                    'err'
                );
                return;
            }

            // ── 2. Key present ────────────────────────────────────────────────
            if (!key) {
                showKeyStatus('❌ Paste and save an API key first, then test it', 'err', 5000);
                return;
            }

            // ── 3. Live test ──────────────────────────────────────────────────
            cgTestKey.disabled    = true;
            cgTestKey.textContent = '🔍 Testing…';
            clearKeyStatus();

            try {
                var provLabel = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
                var testOk  = false;
                var testMsg = '';

                if (provider === 'openai') {
                    var oRes = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': 'Bearer ' + key }
                    });
                    if (oRes.ok) {
                        testOk = true;
                    } else {
                        var oD = await oRes.json().catch(function() { return {}; });
                        testMsg = (oD && oD.error && oD.error.message) ? oD.error.message : ('HTTP ' + oRes.status);
                        if (oRes.status === 401) testMsg = 'Invalid API key — check it and try again';
                        if (oRes.status === 429) { testOk = true; testMsg = 'Rate limited — key is valid, ready to use'; }
                    }
                } else {
                    // Anthropic — minimal 1-token call
                    var aRes = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': key,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json',
                            'anthropic-dangerous-direct-browser-access': 'true'
                        },
                        body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] })
                    });
                    if (aRes.ok || aRes.status === 529) {
                        testOk = true; // 529 = overloaded but key valid
                    } else {
                        var aD = await aRes.json().catch(function() { return {}; });
                        testMsg = (aD && aD.error && aD.error.message) ? aD.error.message : ('HTTP ' + aRes.status);
                        if (aRes.status === 401) testMsg = 'Invalid API key — check it and try again';
                        if (aRes.status === 429) { testOk = true; testMsg = 'Rate limited — key is valid, ready to use'; }
                    }
                }

                if (testOk) {
                    showKeyStatus('✅ ' + provLabel + ' key valid — ready to generate', 'ok');
                    if (typeof gtag !== 'undefined') gtag('event', 'cg_api_test_success', { provider: provider });
                } else {
                    showKeyStatus('❌ ' + testMsg, 'err');
                    if (typeof gtag !== 'undefined') gtag('event', 'cg_api_test_failed', { provider: provider, error: testMsg });
                }
            } catch (netErr) {
                showKeyStatus(
                    netErr.message && netErr.message.toLowerCase().includes('fetch')
                        ? '⚠️ Network error — check your connection and try again'
                        : '❌ ' + (netErr.message || 'Unexpected error'),
                    'err'
                );
            } finally {
                cgTestKey.disabled    = false;
                cgTestKey.textContent = '🔍 Test Connection';
            }
        });
    }

    // ── File upload ──
    cgFileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const ext  = file.name.split('.').pop().toLowerCase();
        const lang = EXT_MAP[ext];
        // File extension is authoritative — set language, style, and lock override
        if (lang) {
            cgLanguage.value = lang;
            const sty = STYLE_MAP[lang];
            if (sty) cgStyle.value = sty;
            _langUserOverride = true; // extension already determined language precisely
            hideLangDetectedBadge();
        } else {
            // Unknown extension — let content-based detection run after load
            _langUserOverride = false;
        }
        lastFilename = file.name.replace(/\.[^.]+$/, '') + '-commented.' + file.name.split('.').pop();
        const reader = new FileReader();
        reader.onload = (ev) => {
            cgInput.value = ev.target.result;
            updateInputStats();
            // If extension was unknown, try content-based detection now
            if (!_langUserOverride) scheduleAutoDetect();
        };
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

    // ── Language auto-detection from pasted / typed code ──
    // Tracks whether the user has manually overridden the language dropdown.
    // _langUserOverride: set true when the user manually picks from the
    // Language dropdown.  Typing respects this.  Paste and Score-click
    // always re-detect from content regardless — they bypass the override.
    let _langUserOverride = false;

    // _pgAutoDetecting: true while setSelectValue() is performing a programmatic
    // language assignment.  Unlike dataset.autoDetect, this flag survives until
    // AFTER the browser fires the async 'change' event, so waitlist.js can
    // read it reliably.  Cleared in a setTimeout(0) after the assignment.
    // Exposed on window so waitlist.js (separate file/closure) can read it.
    let _pgAutoDetecting = false;
    Object.defineProperty(window, '_pgAutoDetecting', {
        get: () => _pgAutoDetecting,
        set: (v) => { _pgAutoDetecting = v; },
        configurable: true,
    });

    // detectLanguage() result → <option> value mapping
    const DETECT_TO_OPTION = {
        javascript: 'javascript', typescript: 'typescript', python:  'python',
        java:       'java',       cpp:        'cpp',        csharp:  'csharp',
        go:         'go',         rust:       'rust',       ruby:    'ruby',
        php:        'php',        swift:      'swift',      kotlin:  'kotlin',
    };

    // Human-readable names for the badge
    const LANG_DISPLAY = {
        javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
        java:       'Java',       cpp:        'C++',        csharp: 'C#',
        go:         'Go',         rust:       'Rust',       ruby:   'Ruby',
        php:        'PHP',        swift:      'Swift',      kotlin: 'Kotlin',
    };

    // ── Badge helpers ──────────────────────────────────────────────────────
    function showLangDetectedBadge(langKey) {
        const lbl = document.querySelector('label[for="cgLanguage"]');
        if (!lbl) return;
        let badge = lbl.querySelector('.lang-auto-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'lang-auto-badge';
            lbl.appendChild(badge);
        }
        badge.textContent = `✦ ${LANG_DISPLAY[langKey] || langKey}`;
        badge.style.opacity = '1';
        clearTimeout(badge._timer);
        // Keep visible for 5s then fade — long enough for user to notice
        badge._timer = setTimeout(() => { badge.style.opacity = '0'; }, 5000);
    }

    function hideLangDetectedBadge() {
        const lbl = document.querySelector('label[for="cgLanguage"]');
        if (!lbl) return;
        const badge = lbl.querySelector('.lang-auto-badge');
        if (badge) { clearTimeout(badge._timer); badge.style.opacity = '0'; }
    }

    // ── Core: detect language, update BOTH dropdowns, optionally show badge ─
    // Returns the detected language key, or null if code is too short / scorer
    // not loaded yet.  silent=true suppresses the badge (used internally).
    //
    // NOTE: auth.v7.js may disable Pro-only <option> elements on the Language
    // and Comment Style selects for free-tier users.  Setting .value on a
    // disabled option is a no-op in all browsers, so we temporarily re-enable
    // the target option, assign the value, then restore its state.  The Pro
    // gate on *generating* comments is enforced elsewhere (ai-generator /
    // auth gate), so showing the detected language in the UI is safe.
    function setSelectValue(selectEl, value) {
        const opt = selectEl.querySelector('option[value="' + value + '"]');
        if (!opt) return false;
        const wasDisabled = opt.disabled;

        // Raise both the dataset flag (synchronous readers) and the module-level
        // boolean (async 'change' event readers — dataset is already cleared by
        // the time the browser dispatches the queued change event).
        _pgAutoDetecting = true;
        selectEl.dataset.autoDetect = '1';

        opt.disabled   = false;
        selectEl.value = value;
        opt.disabled   = wasDisabled;

        // Clear the dataset flag synchronously (for any sync readers)
        delete selectEl.dataset.autoDetect;

        // Clear the module-level flag AFTER the change event has been dispatched.
        // setTimeout(0) runs after the current call-stack unwinds and the browser
        // has fired any pending events triggered by the .value assignment above.
        setTimeout(() => { _pgAutoDetecting = false; }, 0);

        return selectEl.value === value;
    }

    function applyDetectedLanguage(code, silent) {
        if (!code || code.trim().length < 20) return null;
        if (typeof PolyGlotScorer === 'undefined') return null;
        const detected = PolyGlotScorer.detectLanguage(code.trim());
        const option   = DETECT_TO_OPTION[detected];
        if (!option) return null;
        setSelectValue(cgLanguage, option);  // update Language dropdown (works even if option is disabled)
        syncStyleToLanguage();               // update Comment Style dropdown
        if (!silent) showLangDetectedBadge(option);
        return option;
    }

    // ── Debounced detection for keystroke typing ───────────────────────────
    let _detectTimer = null;
    function scheduleAutoDetect() {
        if (_langUserOverride) return;          // respect manual choice while typing
        clearTimeout(_detectTimer);
        _detectTimer = setTimeout(() => {
            const detected = applyDetectedLanguage(cgInput.value);
            if (detected && typeof gtag !== 'undefined') {
                gtag('event', 'cg_language_auto_detected', { detected, trigger: 'type' });
            }
        }, 400);
    }

    // ── Input event: stats + typed detection ──────────────────────────────
    function onInputChanged() {
        updateInputStats();
        if (!cgInput.value.trim()) {
            _langUserOverride = false;
            hideLangDetectedBadge();
        } else {
            scheduleAutoDetect();
        }
    }
    cgInput.addEventListener('input', onInputChanged);

    // ── Paste: always detect, always bypass override ───────────────────────
    // paste fires before the value reaches the DOM — defer one tick
    cgInput.addEventListener('paste', () => {
        clearTimeout(_detectTimer);
        _langUserOverride = false;          // paste always gets fresh detection
        setTimeout(() => {
            const detected = applyDetectedLanguage(cgInput.value);
            if (detected && typeof gtag !== 'undefined') {
                gtag('event', 'cg_language_auto_detected', { detected, trigger: 'paste' });
            }
        }, 0);
    });

    // ── Manual dropdown change ─────────────────────────────────────────────
    cgLanguage.addEventListener('change', () => {
        syncStyleToLanguage();
        _langUserOverride = true;
        hideLangDetectedBadge();
    });

    // ── Clear ──
    cgClearInput.addEventListener('click', () => {
        cgInput.value = '';
        updateInputStats();
        resetOutput();
        cgScoreInputBtn.classList.remove('active');
        // Reset language override so auto-detect works fresh on next paste
        _langUserOverride = false;
        hideLangDetectedBadge();
        // Remove ISP from input panel
        const inPanel = document.getElementById('inputPanel');
        if (inPanel) { const isp = inPanel.querySelector('.isp-panel'); if (isp) isp.remove(); }
    });

    // ── Reset output ──
    // ── Inline error helper — renders inside the output panel, no alert() ──
    const cgInlineError = document.getElementById('cgInlineError');
    function showCgInlineError(html) {
        cgPlaceholder.style.display  = 'none';
        cgOutput.style.display       = 'none';
        cgOutputFooter.style.display = 'none';
        if (cgInlineError) {
            cgInlineError.innerHTML     = html;
            cgInlineError.style.display = 'block';
        }
    }
    function hideCgInlineError() {
        if (cgInlineError) {
            cgInlineError.style.display = 'none';
            cgInlineError.innerHTML     = '';
        }
    }

    function resetOutput() {
        cgPlaceholder.style.display  = 'flex';
        cgOutput.style.display       = 'none';
        cgOutput.textContent         = '';
        cgOutputFooter.style.display = 'none';
        cgCopyBtn.disabled           = true;
        cgDownloadBtn.disabled       = true;
        cgScoreBtn.disabled          = true;
        cgScoreBtn.classList.remove('active');
        hideCgInlineError();
        // Remove any ISP panels from both tool panels
        ['inputPanel','outputPanel'].forEach(id => {
            const p = document.getElementById(id);
            if (p) { const isp = p.querySelector('.isp-panel'); if (isp) isp.remove(); }
        });
        lastOutputText = '';
        lastInputText  = '';
        if (cgImpBadges) cgImpBadges.innerHTML = '';
    }

    // ── Input validation — runs before every generate call ──────────────
    function validateCodeInput(text) {
        if (!text || !text.trim()) return 'No code entered.';
        const t     = text.trim();
        const lines = t.split('\n').filter(l => l.trim().length > 0);

        // Only hard-block truly empty / too-short input
        if (t.length < 20)    return 'Code is too short — paste a complete function or class.';
        if (lines.length < 2) return 'Paste at least two lines of code.';

        return null; // valid — let the AI decide the rest
    }

    // ── Show / clear inline validation error on the input panel ──────────
    function showInputError(msg) {
        let err = document.getElementById('cgInputError');
        if (!err) {
            err = document.createElement('div');
            err.id = 'cgInputError';
            err.className = 'cg-input-error';
            cgInput.parentNode.insertBefore(err, cgInput.nextSibling);
        }
        err.textContent = '⚠️ ' + msg;
        err.style.display = 'block';
        cgInput.classList.add('cg-input-invalid');
    }
    function clearInputError() {
        const err = document.getElementById('cgInputError');
        if (err) err.style.display = 'none';
        cgInput.classList.remove('cg-input-invalid');
    }
    cgInput.addEventListener('input', clearInputError);

    // ── Generate Comments ──
    // ── Free plan limits ────────────────────────────────────────────────────
    // NOTE: Change FREE_MONTHLY_LIMIT to 10 on May 1 2026
    var FREE_MONTHLY_LIMIT = 50;                     // ← change to 10 on May 1 2026
    var WATERMARK_LINE = '\n// ─────────────────────────────────────────────\n// Generated by Poly-Glot AI · poly-glot.ai\n// Add comments to any codebase in seconds.\n// ─────────────────────────────────────────────';

    function isAuthed() {
        // Primary check: auth.v7 inserts #pg-user-chip into the DOM only after
        // verifyStoredToken() succeeds. If the chip exists, the user is genuinely
        // signed in. If headerSignInBtn still exists, they are NOT signed in.
        // This is the only reliable synchronous check — getToken() returns stale
        // localStorage values that survive logout/expiry and cannot be trusted.
        if (document.getElementById('pg-user-chip')) return true;
        if (document.getElementById('headerSignInBtn')) return false;

        // Fallback if neither element exists yet (auth.v7 still initialising):
        // trust getToken() only if it returns a non-empty value AND the plan
        // is set (both are cleared on logout by auth.v7).
        try {
            if (window.PolyGlotAuth && typeof window.PolyGlotAuth.getToken === 'function') {
                const tok  = window.PolyGlotAuth.getToken();
                const plan = window.PolyGlotAuth.getPlan ? window.PolyGlotAuth.getPlan() : null;
                return !!(tok && plan);
            }
        } catch(e) {}
        return false;
    }

    // ── Usage counter (shown below generate button for free/guest users) ────
    var MONTHLY_COUNT_KEY  = 'pg_monthly_count';
    var MONTHLY_MONTH_KEY  = 'pg_monthly_month';

    function currentMonthStr() {
        var d = new Date();
        return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
    }
    function getMonthlyCount() {
        // Reset if new month
        var savedMonth = localStorage.getItem(MONTHLY_MONTH_KEY);
        if (savedMonth !== currentMonthStr()) {
            localStorage.setItem(MONTHLY_MONTH_KEY, currentMonthStr());
            localStorage.setItem(MONTHLY_COUNT_KEY, '0');
            return 0;
        }
        return parseInt(localStorage.getItem(MONTHLY_COUNT_KEY) || '0', 10);
    }
    function incrementMonthlyCount() {
        var n = getMonthlyCount() + 1;
        localStorage.setItem(MONTHLY_COUNT_KEY, String(n));
        localStorage.setItem(MONTHLY_MONTH_KEY, currentMonthStr());
        return n;
    }

    function renderUsageCounter() {
        var existing = document.getElementById('pg2UsageCounter');
        // Anchor: always append inside #inputPanel so it's visible and styled correctly.
        // Using inputPanel directly (guaranteed to exist — we already have cgInput from it).
        var inputPanel = document.getElementById('inputPanel');

        if (!isAuthed()) {
            // Not signed in — show sign-up nudge
            var nudge = [
                '<div id="pg2UsageCounter" style="margin:8px 12px 10px;padding:10px 14px;',
                'background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);',
                'border-radius:8px;font-size:12px;color:#94a3b8;text-align:center;">',
                '🔐 <strong style="color:#a78bfa;">Free account required</strong>',
                ' &nbsp;·&nbsp; ',
                '<a href="#" onclick="if(window.PolyGlotAuth&&typeof window.PolyGlotAuth.openLoginModal===\'function\')',
                '{window.PolyGlotAuth.openLoginModal(\'counter-nudge\');}',
                'else{var b=document.getElementById(\'headerSignInBtn\');if(b)b.click();}',
                ' return false;" style="color:#a78bfa;font-weight:700;text-decoration:none;">Sign up free ↗</a>',
                ' &nbsp;·&nbsp; ' + FREE_MONTHLY_LIMIT + ' files/month, no credit card',
                '</div>'
            ].join('');
            if (existing) {
                existing.outerHTML = nudge;
            } else if (inputPanel) {
                inputPanel.insertAdjacentHTML('beforeend', nudge);
            }
            return;
        }

        // Signed in — show monthly progress bar
        var used      = getMonthlyCount();
        var remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
        var pct       = Math.min(100, Math.round((used / FREE_MONTHLY_LIMIT) * 100));
        var color     = remaining <= 5  ? '#ef4444'
                      : remaining <= 10 ? '#f59e0b'
                      : '#22c55e';
        var html = [
            '<div id="pg2UsageCounter" style="margin:8px 12px 10px;padding:10px 14px;',
            'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);',
            'border-radius:8px;font-size:12px;color:#94a3b8;">',
            '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">',
            '    <span>🗂 Free plan usage</span>',
            '    <span style="color:' + color + ';font-weight:600;">' + used + ' / ' + FREE_MONTHLY_LIMIT + ' files this month</span>',
            '  </div>',
            '  <div style="background:rgba(255,255,255,.08);border-radius:4px;height:4px;overflow:hidden;">',
            '    <div style="height:4px;border-radius:4px;background:' + color + ';width:' + pct + '%;transition:width .4s;"></div>',
            '  </div>',
            remaining <= 10 && remaining > 0
                ? '  <div style="margin-top:6px;color:' + color + ';">⚠️ ' + remaining + ' file' + (remaining === 1 ? '' : 's') + ' remaining this month — <a href="#pg-pricing-section" style="color:#a78bfa;font-weight:600;">upgrade for unlimited ↑</a></div>'
                : '',
            remaining <= 0
                ? '  <div style="margin-top:6px;color:#ef4444;">🔒 Monthly limit reached — <a href="https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?prefilled_promo_code=EARLYBIRD3" target="_blank" style="color:#a78bfa;font-weight:600;">Upgrade to Pro $9/mo ↗</a></div>'
                : '',
            '</div>'
        ].join('');
        if (existing) {
            existing.outerHTML = html;
        } else if (inputPanel) {
            inputPanel.insertAdjacentHTML('beforeend', html);
        }
    }

    // Render on init
    renderUsageCounter();

    cgGenerateBtn.addEventListener('click', async () => {
        const code = cgInput.value.trim();

        // ── Auth gate FIRST — before validation or key checks ────────────────
        // Unauthenticated users see sign-up CTA regardless of textarea state.
        if (!isAuthed()) {
            showCgInlineError(
                '<div style="padding:28px 24px;text-align:center;">' +
                '  <div style="font-size:36px;margin-bottom:12px;">🔐</div>' +
                '  <div style="font-size:16px;font-weight:700;color:#f4f4f6;margin-bottom:8px;">Free account required</div>' +
                '  <div style="font-size:13px;color:#94a3b8;line-height:1.7;margin-bottom:20px;">' +
                '    Sign up free — takes 30 seconds, no credit card needed.<br>' +
                '    You get <strong style="color:#a78bfa;">' + FREE_MONTHLY_LIMIT + ' files/month</strong> on the free plan.' +
                '  </div>' +
                '  <a href="#" onclick="if(window.PolyGlotAuth&&typeof window.PolyGlotAuth.openLoginModal===\'function\'){window.PolyGlotAuth.openLoginModal(\'try-it-free\');}else{var b=document.getElementById(\'headerSignInBtn\');if(b)b.click();} return false;" ' +
                '     style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;box-shadow:0 4px 18px rgba(124,58,237,0.4);">' +
                '    🚀 Create Free Account' +
                '  </a>' +
                '  <div style="margin-top:14px;font-size:12px;color:#64748b;">' +
                '    Already have an account? ' +
                '    <a href="#" onclick="if(window.PolyGlotAuth&&typeof window.PolyGlotAuth.openLoginModal===\'function\'){window.PolyGlotAuth.openLoginModal(\'try-it-signin\');}else{var b=document.getElementById(\'headerSignInBtn\');if(b)b.click();} return false;" style="color:#a78bfa;text-decoration:none;">Sign in →</a>' +
                '  </div>' +
                '</div>'
            );
            if (typeof gtag !== 'undefined') gtag('event', 'cg_auth_gate_shown');
            return;
        }

        // ── Code validation (signed-in users only) ────────────────────────────
        const validationError = validateCodeInput(code);
        if (validationError) { showInputError(validationError); return; }
        clearInputError();

        // ── API key check (signed-in users only — auth gate passed) ──────────
        const key = localStorage.getItem(LS.key) || '';
        if (!key || key.length < 10) {
            const cgApiKeyEl = document.getElementById('cgApiKey');
            if (cgApiKeyEl) {
                cgApiKeyEl.focus();
                cgApiKeyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cgApiKeyEl.style.transition = 'box-shadow 0.15s';
                cgApiKeyEl.style.boxShadow  = '0 0 0 3px rgba(248,113,113,0.55)';
                setTimeout(() => { cgApiKeyEl.style.boxShadow = ''; }, 1800);
            }
            showCgInlineError(
                '<div style="padding:24px;color:#fbbf24;font-size:14px;line-height:1.9;">' +
                '🔑 <strong>API key required.</strong><br>' +
                'Paste your key in <strong>API Settings → API Key</strong> above and click <strong>Save Key</strong>.<br>' +
                '<span style="font-size:12px;color:#9ca3af;">' +
                'Your key is stored locally and sent directly to the AI provider — never to Poly-Glot.<br>' +
                '→ <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style="color:#7c3aed;">Get an OpenAI key ↗</a>' +
                '&nbsp;&nbsp;·&nbsp;&nbsp;' +
                '<a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style="color:#7c3aed;">Get an Anthropic key ↗</a>' +
                '</span>' +
                '</div>'
            );
            return;
        }

        // ── Monthly limit gate (signed-in free users) ─────────────────────────
        const monthlyUsed = getMonthlyCount();
        if (monthlyUsed >= FREE_MONTHLY_LIMIT) {
            showCgInlineError(
                '<div style="padding:28px 24px;text-align:center;">' +
                '  <div style="font-size:36px;margin-bottom:12px;">🔒</div>' +
                '  <div style="font-size:16px;font-weight:700;color:#f4f4f6;margin-bottom:8px;">Monthly limit reached — ' + FREE_MONTHLY_LIMIT + ' files used</div>' +
                '  <div style="font-size:13px;color:#94a3b8;margin-bottom:6px;">Resets on the 1st of next month.</div>' +
                '  <div style="font-size:12px;color:#f59e0b;margin-bottom:16px;">🏷 Use code <strong>EARLYBIRD3</strong> for 50% off your first 3 months</div>' +
                '  <a href="https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?prefilled_promo_code=EARLYBIRD3" target="_blank" ' +
                '     style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;box-shadow:0 4px 18px rgba(124,58,237,0.4);">' +
                '    Upgrade to Pro — $9/mo ↗' +
                '  </a>' +
                '</div>'
            );
            renderUsageCounter();
            if (typeof gtag !== 'undefined') gtag('event', 'cg_monthly_limit_hit');
            return;
        }

        // ── Pro gate — check if selected language or style is Pro-locked ────────
        const plan = (window.PolyGlotAuth && typeof window.PolyGlotAuth.getPlan === 'function')
            ? (window.PolyGlotAuth.getPlan() || 'free').toLowerCase()
            : (localStorage.getItem('pg_plan') || 'free').toLowerCase();
        const isPaid = ['pro', 'team', 'enterprise'].includes(plan);

        if (!isPaid) {
            // Check if selected language option is disabled (Pro-locked)
            const langOpt  = cgLanguage.querySelector('option[value="' + cgLanguage.value + '"]');
            const styleOpt = cgStyle.querySelector('option[value="' + cgStyle.value + '"]');
            const langLocked  = langOpt  && langOpt.disabled;
            const styleLocked = styleOpt && styleOpt.disabled;

            if (langLocked || styleLocked) {
                const lockedName = langLocked ? cgLanguage.value : cgStyle.value;
                showCgInlineError(
                    '<div style="padding:28px 24px;text-align:center;">' +
                    '  <div style="font-size:36px;margin-bottom:12px;">⭐</div>' +
                    '  <div style="font-size:16px;font-weight:700;color:#f4f4f6;margin-bottom:8px;">Pro plan required</div>' +
                    '  <div style="font-size:13px;color:#94a3b8;line-height:1.7;margin-bottom:6px;">' +
                    '    <strong style="color:#a78bfa;">' + lockedName.charAt(0).toUpperCase() + lockedName.slice(1) + '</strong> is available on the Pro plan.' +
                    '  </div>' +
                    '  <div style="font-size:12px;color:#f59e0b;margin-bottom:16px;">🏷 Use code <strong>EARLYBIRD3</strong> for 50% off your first 3 months</div>' +
                    '  <a href="https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?prefilled_promo_code=EARLYBIRD3" target="_blank" ' +
                    '     style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;box-shadow:0 4px 18px rgba(124,58,237,0.4);">' +
                    '    Upgrade to Pro — $9/mo ↗' +
                    '  </a>' +
                    '  <div style="margin-top:12px;font-size:12px;color:#64748b;">Or switch to a free language/style to generate now.</div>' +
                    '</div>'
                );
                if (typeof gtag !== 'undefined') gtag('event', 'cg_pro_gate_shown', { locked: lockedName });
                return;
            }
        }

        // Temporarily configure shared aiGenerator
        const orig = { key: window.aiGenerator.apiKey, prov: window.aiGenerator.provider, model: window.aiGenerator.model };
        window.aiGenerator.apiKey   = key;
        window.aiGenerator.provider = cgProvider.value;
        window.aiGenerator.model    = resolveCgModel();

        // Show loading state and clear output area
        hideCgInlineError();
        cgLoading.style.display      = 'flex';
        cgPlaceholder.style.display  = 'none';
        cgOutput.style.display       = 'none';
        cgOutput.textContent         = '';
        cgOutputFooter.style.display = 'none';
        cgGenerateBtn.disabled       = true;
        cgGenerateBtn.textContent    = '⏳ Generating…';

        try {
            lastInputText = code;
            let firstChunk = true;

            // Stream tokens directly into the output <pre> as they arrive
            const result = await window.aiGenerator.generateComments(
                code, cgLanguage.value, cgStyle.value,
                (chunk) => {
                    if (firstChunk) {
                        // First token — swap loader for visible output
                        cgLoading.style.display = 'none';
                        cgOutput.style.display  = 'block';
                        firstChunk = false;
                    }
                    cgOutput.textContent += chunk;
                }
            );
            lastOutputText = result.code;

            // Final render — hide loader (non-streaming path) and show clean output
            cgLoading.style.display      = 'none';
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

            // ── Increment counter + post-gen warnings (signed-in users only) ──
            var newMonthlyUsed = incrementMonthlyCount();
            lastOutputText = result.code;
            renderUsageCounter();

            // Remove any stale warnings
            ['pg2MonthlyLimitWarn','pg2SoftWarn'].forEach(function(id) {
                var el = document.getElementById(id); if (el) el.remove();
            });

            // Anchor warnings inside #outputPanel — always exists, always visible
            var outputPanel = document.getElementById('outputPanel');

            if (newMonthlyUsed >= FREE_MONTHLY_LIMIT) {
                // Hit the limit
                var limitWarn = document.createElement('div');
                limitWarn.id = 'pg2MonthlyLimitWarn';
                limitWarn.style.cssText = 'margin:8px 12px 10px;text-align:center;font-size:12px;color:#ef4444;padding:10px 14px;background:rgba(239,68,68,.08);border-radius:8px;border:1px solid rgba(239,68,68,.2);';
                limitWarn.innerHTML = '🔒 Monthly limit reached (' + FREE_MONTHLY_LIMIT + ' files). <a href="https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?prefilled_promo_code=EARLYBIRD3" target="_blank" style="color:#a78bfa;font-weight:600;">Upgrade to Pro — $9/mo with EARLYBIRD3 ↗</a>';
                if (outputPanel) outputPanel.appendChild(limitWarn);
            } else if (newMonthlyUsed >= FREE_MONTHLY_LIMIT - 5) {
                // ≤5 remaining — urgent red
                var urgentWarn = document.createElement('div');
                urgentWarn.id = 'pg2SoftWarn';
                urgentWarn.style.cssText = 'margin:8px 12px 10px;text-align:center;font-size:12px;color:#ef4444;padding:8px 14px;background:rgba(239,68,68,.06);border-radius:8px;border:1px solid rgba(239,68,68,.15);';
                urgentWarn.innerHTML = '🚨 <strong>' + (FREE_MONTHLY_LIMIT - newMonthlyUsed) + ' file' + (FREE_MONTHLY_LIMIT - newMonthlyUsed === 1 ? '' : 's') + ' remaining</strong> this month. <a href="https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?prefilled_promo_code=EARLYBIRD3" target="_blank" style="color:#a78bfa;font-weight:600;">Upgrade to Pro ↗</a>';
                if (outputPanel) outputPanel.appendChild(urgentWarn);
            } else if (newMonthlyUsed >= FREE_MONTHLY_LIMIT - 10) {
                // ≤10 remaining — soft yellow
                var softWarn = document.createElement('div');
                softWarn.id = 'pg2SoftWarn';
                softWarn.style.cssText = 'margin:8px 12px 10px;text-align:center;font-size:12px;color:#f59e0b;padding:8px 14px;background:rgba(245,158,11,.06);border-radius:8px;border:1px solid rgba(245,158,11,.2);';
                softWarn.innerHTML = '⚠️ ' + (FREE_MONTHLY_LIMIT - newMonthlyUsed) + ' files remaining this month. <a href="#pg-pricing-section" style="color:#a78bfa;font-weight:600;">Upgrade for unlimited ↑</a>';
                if (outputPanel) outputPanel.appendChild(softWarn);
            }

            cgCopyBtn.disabled     = false;
            cgDownloadBtn.disabled = false;
            cgScoreBtn.disabled    = false;
            // Remove stale "Pro only" tooltip from download wrap
            var dlWrap = cgDownloadBtn.closest('.pg-download-wrap');
            if (dlWrap) dlWrap.removeAttribute('title');

            if (typeof gtag !== 'undefined') gtag('event', 'cg_generate_success', {
                provider: result.provider, model: result.model,
                language: cgLanguage.value, style: cgStyle.value
            });

        } catch (err) {
            showCgInlineError(
                '<div style="padding:24px;color:#f87171;font-size:14px;line-height:1.8;">' +
                '❌ <strong>Generation failed.</strong><br>' +
                '<span style="color:#9ca3af;">' + (err.message || 'Unknown error. Please try again.') + '</span>' +
                '</div>'
            );
            if (typeof gtag !== 'undefined') gtag('event', 'cg_generate_error', { error: err.message });
        } finally {
            // Restore original aiGenerator state
            window.aiGenerator.apiKey      = orig.key;
            window.aiGenerator.provider    = orig.prov;
            window.aiGenerator.model       = orig.model;
            cgLoading.style.display        = 'none';
            cgGenerateBtn.disabled         = false;
            cgGenerateBtn.textContent      = '🤖 Generate Comments';
        }
    });

    // ── Copy ──
    // ── Block all clipboard interaction on the output element ──
    // Copy is via the Copy button only. Paste is not applicable to a read-only output.
    ['copy', 'cut', 'paste', 'contextmenu', 'dragstart', 'drop'].forEach(function(evt) {
        cgOutput.addEventListener(evt, function(e) { e.preventDefault(); });
    });

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

    // ── Score Input (Your Code) ────────────────────────────────────────────
    cgScoreInputBtn.addEventListener('click', () => {
        const code = cgInput.value.trim();
        if (!code) {
            cgInput.focus();
            cgInput.placeholder = '⚠️ Paste or upload some code first…';
            setTimeout(() => {
                cgInput.placeholder = 'Paste your code here or upload a file…\n\nLanguage & comment style auto-detect from file extension.';
            }, 2500);
            return;
        }

        // Always re-detect at click time — catches the case where code was
        // pasted just before clicking Score (debounce may not have fired yet)
        // and the case where the user pasted without triggering the paste event.
        const detected = applyDetectedLanguage(code);
        const scoreLang = detected || cgLanguage.value || 'javascript';

        // Collapse output score panel if open
        if (cgScoreBtn.classList.contains('active')) {
            cgScoreBtn.classList.remove('active');
            const outPanel = document.getElementById('outputPanel');
            if (outPanel) { const isp = outPanel.querySelector('.isp-panel'); if (isp) isp.remove(); }
        }

        cgScoreInputBtn.classList.toggle('active');
        if (typeof PolyGlotScorer !== 'undefined') {
            PolyGlotScorer.renderInline('inputPanel', code, null, true, scoreLang);
        }
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cg_score_input_clicked', { language: scoreLang, trigger: 'score_btn' });
        }
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

// Expose sample loader globally (called from onclick in HTML)
window.loadSample = loadSample;

// (keyboard shortcuts consolidated below with Both + Explain shortcut handlers)

// ── CLI Flags Reference — toggle, filter, copy buttons ───────────────────────
document.addEventListener('DOMContentLoaded', function() {

    // ── Toggle ──────────────────────────────────────────────────────────────
    const toggle   = document.getElementById('cliFlagsToggle');
    const body     = document.getElementById('cliFlagsBody');
    const chevron  = document.getElementById('cliFlagsChevron');
    const filterEl = document.getElementById('cliFlagsFilter');

    if (toggle && body && chevron) {
        toggle.addEventListener('click', function() {
            const isOpen = body.classList.contains('open');
            body.classList.toggle('open', !isOpen);
            chevron.classList.toggle('open', !isOpen);
        });
    }

    // ── Filter ──────────────────────────────────────────────────────────────
    if (filterEl && body) {
        // Stop toggle firing when clicking the filter input
        filterEl.addEventListener('click', function(e) { e.stopPropagation(); });

        filterEl.addEventListener('input', function() {
            const q = this.value.trim().toLowerCase();
            const rows = body.querySelectorAll('.flags-row:not(.flags-row-header)');
            rows.forEach(function(row) {
                const text = row.textContent.toLowerCase();
                row.style.display = (!q || text.includes(q)) ? '' : 'none';
            });
            // Show/hide group titles if all rows inside are hidden
            body.querySelectorAll('.flags-group').forEach(function(group) {
                const visible = group.querySelectorAll('.flags-row:not(.flags-row-header):not([style*="none"])');
                group.style.display = (!q || visible.length > 0) ? '' : 'none';
            });
        });
    }

    // ── Copy buttons on every flags-example ─────────────────────────────────
    if (body) {
        body.querySelectorAll('code.flags-example').forEach(function(el) {
            // Lift the data-label off the <code> so the wrapper can carry it
            // (CSS ::before targets the grid cell; the wrapper IS the grid cell
            //  after wrapping, so we move the attribute there)
            const label = el.getAttribute('data-label');

            const wrapper = document.createElement('span');
            wrapper.className = 'flags-example-wrap';
            if (label) {
                wrapper.setAttribute('data-label', label);
                el.removeAttribute('data-label');
            }
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);

            const btn = document.createElement('button');
            btn.className = 'flags-copy-btn';
            btn.setAttribute('aria-label', 'Copy to clipboard');
            btn.title = 'Copy to clipboard';
            btn.textContent = '📋';
            wrapper.appendChild(btn);

            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const text = el.textContent;
                navigator.clipboard.writeText(text).then(function() {
                    btn.textContent = '✅';
                    setTimeout(function() { btn.textContent = '📋'; }, 1500);
                }).catch(function() {
                    btn.textContent = '✅';
                    setTimeout(function() { btn.textContent = '📋'; }, 1500);
                });
            });
        });
    }
});

// ── Both button ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const bothBtn     = document.getElementById('bothBtn');
    const aiSettingsBtn = document.getElementById('aiSettingsBtn');
    if (!bothBtn) return;

    bothBtn.addEventListener('click', async function() {
        if (!window.aiGenerator || !window.aiGenerator.isConfigured()) {
            alert('⚙️ Please configure your AI API key first.\n\nClick "AI Settings" to add your OpenAI or Anthropic API key.');
            if (aiSettingsBtn) aiSettingsBtn.click();
            return;
        }

        const codeEditor = document.getElementById('cgInput') || document.getElementById('codeEditor') || { value: '' };
        const code = codeEditor.value.trim();
        if (!code) {
            alert('📝 Please paste some code in the editor first.');
            return;
        }

        const language = (document.getElementById('language') || { value: 'javascript' }).value;

        bothBtn.classList.add('loading');
        bothBtn.disabled = true;
        bothBtn.innerHTML = '📝💬 Generating… <kbd class="btn-kbd">⌘⌥↵</kbd>';

        try {
            // Single-pass: doc-comments + why-comments in one API call (~2x faster)
            const combinedResult = await window.aiGenerator.generateBoth(code, language);

            displayBothResults(combinedResult);

            if (window.polyglotAnalytics) {
                window.polyglotAnalytics.trackEvent('both_generation_success', {
                    language,
                    provider: combinedResult.provider,
                    model: combinedResult.model,
                    cost: combinedResult.cost
                });
            }
        } catch (error) {
            alert('❌ Generation failed: ' + error.message + '\n\nPlease check your API key and try again.');
        } finally {
            bothBtn.classList.remove('loading');
            bothBtn.disabled = false;
            bothBtn.innerHTML = '📝💬 Both <kbd class="btn-kbd">⌘⌥↵</kbd>';
        }
    });

    function displayBothResults(result) {
        const existing = document.querySelector('.ai-results');
        if (existing) existing.remove();

        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'ai-results';
        resultsDiv.id = 'aiResultsDiv';
        resultsDiv.innerHTML = `
            <div class="ai-results-header">
                <h3>📝💬 Doc + Why Comments <span class="both-badge">BOTH</span></h3>
                <span class="ai-cost" title="Combined cost of two AI passes">Cost: $${result.cost.toFixed(4)} <span class="cost-note">(2 passes)</span></span>
            </div>
            <p class="why-results-desc">Two-pass result — standardized doc-comments <em>and</em> inline why-comments explaining the reasoning behind your code.</p>
            <div class="ai-code-wrapper">
                <button class="ai-copy-inline" id="copyAiCodeInline" title="Copy code">📋</button>
                <div class="ai-code-output">${typeof escapeHtml === 'function' ? escapeHtml(result.code) : result.code}</div>
            </div>
            <div class="ai-actions">
                <button class="btn-primary" id="copyAiCode">📋 Copy to Clipboard</button>
                <button class="btn-primary" id="replaceCode">✅ Replace Code</button>
                <button class="btn-secondary" id="closeAiResults">✗ Close</button>
            </div>
        `;

        const suggestions = document.getElementById('suggestions');
        if (suggestions) suggestions.parentNode.insertBefore(resultsDiv, suggestions.nextSibling);
        else document.body.appendChild(resultsDiv);

        // Wire up buttons
        const inlineBtn  = document.getElementById('copyAiCodeInline');
        const copyBtn    = document.getElementById('copyAiCode');
        const replaceBtn = document.getElementById('replaceCode');
        const closeBtn   = document.getElementById('closeAiResults');

        function flashCopied(btn, orig) {
            btn.innerHTML = '✅ Copied!';
            btn.disabled = true;
            setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 2000);
        }

        if (inlineBtn) inlineBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.code).then(() => flashCopied(inlineBtn, '📋'));
        });
        if (copyBtn) copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.code).then(() => flashCopied(copyBtn, '📋 Copy to Clipboard'));
        });
        if (replaceBtn) replaceBtn.addEventListener('click', () => {
            const ed = document.getElementById('cgInput') || document.getElementById('codeEditor');
            if (ed) { ed.value = result.code; }
            resultsDiv.remove();
        });
        if (closeBtn) closeBtn.addEventListener('click', () => resultsDiv.remove());
    }
});

// ── Keyboard shortcuts (updated with Cmd+Alt+Enter for Both, Cmd+E for Explain) ─
// Remove old listener and replace with complete set
(function() {
    function handleShortcut(e) {
        const isMac    = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;
        if (!modifier) return;

        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag === 'INPUT' || tag === 'SELECT') return;

        // Cmd+Enter → Generate Comments
        if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            const btn = document.getElementById('generateBtn');
            if (btn && !btn.disabled) btn.click();
        }
        // Cmd+Shift+Enter → Why Comments
        if (e.key === 'Enter' && e.shiftKey && !e.altKey) {
            e.preventDefault();
            const btn = document.getElementById('whyBtn');
            if (btn && !btn.disabled) btn.click();
        }
        // Cmd+Alt+Enter → Both
        if (e.key === 'Enter' && e.altKey) {
            e.preventDefault();
            const btn = document.getElementById('bothBtn');
            if (btn && !btn.disabled) btn.click();
        }
        // Cmd+E → Explain Code
        if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            const btn = document.getElementById('explainBtn');
            if (btn && !btn.disabled) btn.click();
        }
    }

    // Remove any previous listener (belt and braces)
    document.removeEventListener('keydown', handleShortcut);
    document.addEventListener('keydown', handleShortcut);
})();

// ── OS-aware keyboard shortcut labels ────────────────────────────────────────
(function () {
    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if (isMac) return; // Mac is already correct — do nothing

    // Map of Mac symbol → PC equivalent
    var swap = {
        '⌘↵':   'Ctrl+Enter',
        '⌘⇧↵':  'Ctrl+Shift+Enter',
        '⌘⌥↵':  'Ctrl+Alt+Enter',
        '⌘E':   'Ctrl+E',
        '⌘K':   'Ctrl+K',
        '⌘Z':   'Ctrl+Z',
    };

    // Swap button kbd badges
    document.querySelectorAll('kbd.btn-kbd').forEach(function (kbd) {
        var txt = kbd.textContent.trim();
        if (swap[txt]) kbd.textContent = swap[txt];
    });

    // Swap VS Code section inline kbd elements
    var vscodeSwaps = {
        'Cmd+Shift+/':     'Ctrl+Shift+/',
        'Cmd+Shift+Alt+/': 'Ctrl+Shift+Alt+/',
        'Cmd+Shift+E':     'Ctrl+Shift+E',
        'Cmd+Shift+X':     'Ctrl+Shift+X',
    };
    document.querySelectorAll('kbd').forEach(function (kbd) {
        var txt = kbd.textContent.trim();
        if (vscodeSwaps[txt]) kbd.textContent = vscodeSwaps[txt];
    });

    // Swap button title tooltips (already show both, but clean up for PC)
    var tooltipSwaps = {
        'generateBtn': 'Generate AI-powered doc-comments (Ctrl+Enter)',
        'whyBtn':      'Add inline why-comments explaining decisions & intent (Ctrl+Shift+Enter)',
        'bothBtn':     'Add doc-comments AND why-comments in one two-pass run (Ctrl+Alt+Enter)',
        'explainBtn':  'Get a deep analysis of your code (Ctrl+E)',
    };
    Object.keys(tooltipSwaps).forEach(function (id) {
        var btn = document.getElementById(id);
        if (btn) btn.title = tooltipSwaps[id];
    });
})();
