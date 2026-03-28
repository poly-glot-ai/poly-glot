# Nexus Programming Language

**A Universal Multi-Paradigm Programming Language**

Part of the [poly-glot.ai](https://poly-glot.ai) project

## Overview

Nexus is a modern, universal programming language designed to support multiple programming paradigms including functional, imperative, and object-oriented programming. With gradual typing and a clean, intuitive syntax, Nexus aims to be easy to learn while powerful enough for real-world applications.

## Features

### Core Features
- ✅ **Multi-paradigm**: Supports functional, imperative, and OOP styles
- ✅ **Gradual typing**: Optional type annotations for flexibility
- ✅ **Immutable by default**: Variables with `let` are immutable
- ✅ **First-class functions**: Functions as values, closures, lambdas
- ✅ **Modern syntax**: Clean and readable, inspired by Rust, Python, and JavaScript
- ✅ **Range syntax**: Pythonic ranges with `0..10`
- ✅ **Pattern matching**: (Planned)
- ✅ **Async/await**: (Planned)

### Currently Implemented
- Variables (immutable `let`, mutable `var`)
- Functions (named and lambda with `=>`)
- Control flow (if/else, while, for loops)
- Data types (numbers, strings, booleans, null, lists)
- Operators (arithmetic, comparison, logical)
- Ranges for iteration
- List indexing and manipulation
- Recursion
- Closures
- Built-in functions

## Installation

### Requirements
- Python 3.7 or higher

### Usage

```bash
# Run the interpreter with examples
python nexus/nexus.py

# Or make it executable and run directly
chmod +x nexus/nexus.py
./nexus/nexus.py
```

## Quick Start

### Hello World

```nexus
print("Hello, World!")
```

### Variables

```nexus
// Immutable variable
let x = 10

// Mutable variable
var y = 20
y = 30  // This works

// x = 15  // This would error - can't reassign immutable
```

### Functions

```nexus
// Named function
fn add(a, b) {
    return a + b
}

// Lambda function (short form)
let multiply = fn(a, b) => a * b

// Calling functions
print(add(5, 3))        // Output: 8
print(multiply(4, 2))   // Output: 8
```

### Control Flow

```nexus
// If-else
let age = 18
if age >= 18 {
    print("Adult")
} else {
    print("Minor")
}

// While loop
var count = 0
while count < 5 {
    print(count)
    count = count + 1
}

// For loop with range
for i in 0..10 {
    print(i)
}

// For loop with list
let numbers = [1, 2, 3, 4, 5]
for n in numbers {
    print(n)
}
```

### Lists

```nexus
let fruits = ["apple", "banana", "orange"]

print(fruits[0])        // Output: apple
print(len(fruits))      // Output: 3

for fruit in fruits {
    print(fruit)
}
```

### Recursion

```nexus
fn factorial(n) {
    if n <= 1 {
        return 1
    }
    return n * factorial(n - 1)
}

print(factorial(5))  // Output: 120
```

### Higher-Order Functions

```nexus
let square = fn(x) => x * x

fn apply_twice(func, value) {
    return func(func(value))
}

print(apply_twice(square, 2))  // Output: 16
```

## Examples

The `examples/` directory contains sample programs:

- **fizzbuzz.nx** - Classic FizzBuzz implementation
- **fibonacci.nx** - Recursive Fibonacci sequence
- **primes.nx** - Prime number generator
- **higher_order.nx** - Demonstrates functional programming

Run an example:

```bash
# You can paste the code into the REPL, or extend the interpreter to load files
```

## Language Syntax Reference

### Data Types

```nexus
// Numbers (int and float)
let int_num = 42
let float_num = 3.14

// Strings
let name = "Nexus"
let message = 'Hello!'

// Booleans
let is_true = true
let is_false = false

// Null
let nothing = null

// Lists
let numbers = [1, 2, 3, 4, 5]
let mixed = [1, "two", 3.0, true]

// Ranges
let range = 0..10  // Creates range(0, 10)
```

### Operators

**Arithmetic**: `+`, `-`, `*`, `/`, `%`

**Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`

**Logical**: `and`, `or`, `!`

**Assignment**: `=`

### Keywords

`let`, `var`, `fn`, `return`, `if`, `else`, `for`, `in`, `while`, `match`, `class`, `import`, `export`, `async`, `await`, `true`, `false`, `null`

## Built-in Functions

- `print(*args)` - Print values to console
- `len(collection)` - Get length of a collection
- `range(start, end)` - Create a range (also available via `start..end`)
- `str(value)` - Convert value to string
- `int(value)` - Convert value to integer
- `float(value)` - Convert value to float

## Planned Features

### Pattern Matching
```nexus
match value {
    0 => print("Zero")
    1..10 => print("Small")
    n if n > 100 => print("Large")
    _ => print("Other")
}
```

### Classes and Objects
```nexus
class Person {
    name: string
    age: int
    
    fn new(name: string, age: int) -> Person {
        return Person {name: name, age: age}
    }
    
    fn greet(self) {
        print("Hello, I'm {self.name}")
    }
}
```

### Type Annotations
```nexus
fn add(a: int, b: int) -> int {
    return a + b
}

let numbers: [int] = [1, 2, 3, 4, 5]
```

### Async/Await
```nexus
async fn fetch_data(url: string) -> string {
    let response = await http.get(url)
    return response.body
}
```

### Error Handling
```nexus
fn divide(a, b) -> Result<float, string> {
    if b == 0 {
        return Err("Division by zero")
    }
    return Ok(a / b)
}
```

## Architecture

### Interpreter Components

1. **Lexer** - Tokenizes source code
2. **Parser** - Builds Abstract Syntax Tree (AST)
3. **Interpreter** - Tree-walking evaluator
4. **Environment** - Variable scope management

### Future Compilation Targets

- **JavaScript** - For web platforms
- **Bytecode** - Custom VM for better performance
- **Native** - LLVM backend for systems programming

## Contributing

Nexus is part of the poly-glot.ai project. Contributions are welcome!

## License

See the main poly-glot.ai repository for license information.

## Philosophy

Nexus is designed with these principles:

1. **Universal** - One language for multiple domains
2. **Progressive** - Start simple, add complexity as needed
3. **Safe** - Immutable by default, gradual typing
4. **Expressive** - Multiple paradigms, clean syntax
5. **Performant** - Designed for efficient execution

## Comparison with Other Languages

| Feature | Nexus | Python | JavaScript | Rust |
|---------|-------|--------|------------|------|
| Gradual Typing | ✅ | Partial | ✅ | Static only |
| Pattern Matching | Planned | ✅ | Partial | ✅ |
| Immutable by Default | ✅ | ❌ | ❌ | ✅ |
| Lambda Functions | ✅ | ✅ | ✅ | ✅ |
| Range Syntax | `0..10` | `range()` | None | `0..10` |
| Null Safety | Planned | ❌ | ❌ | ✅ |

## Resources

- [poly-glot.ai Website](https://poly-glot.ai)
- [Language Specification](docs/SPECIFICATION.md)
- [Tutorial](docs/TUTORIAL.md)

## Version

**Current Version**: 1.0.0 (Alpha)

**Status**: Early development - Core features implemented

---

**Made with ❤️ for poly-glot.ai**
