# Nexus Language Specification

**Version 1.0.0**

## Table of Contents

1. [Introduction](#introduction)
2. [Lexical Structure](#lexical-structure)
3. [Types](#types)
4. [Variables](#variables)
5. [Operators](#operators)
6. [Control Flow](#control-flow)
7. [Functions](#functions)
8. [Collections](#collections)
9. [Modules](#modules)
10. [Classes and Traits](#classes-and-traits)
11. [Error Handling](#error-handling)
12. [Async Programming](#async-programming)

## Introduction

Nexus is a universal, multi-paradigm programming language with gradual typing. It combines the best features of modern languages to create a flexible, expressive, and safe programming environment.

### Design Goals

- **Universal**: Suitable for systems, web, data science, and more
- **Multi-paradigm**: Functional, imperative, and object-oriented
- **Safe**: Immutable by default, optional type checking
- **Expressive**: Clean syntax, powerful abstractions
- **Performant**: Designed for efficient compilation

## Lexical Structure

### Comments

```nexus
// Single-line comment

/*
  Multi-line
  comment
*/
```

### Identifiers

Identifiers start with a letter or underscore, followed by letters, digits, or underscores.

```nexus
valid_identifier
_privateVar
myVar123
```

### Keywords

```
let var fn return if else for in while match class
import export async await true false null
```

### Literals

**Integer**: `42`, `-10`, `0`

**Float**: `3.14`, `-0.5`, `2.0`

**String**: `"hello"`, `'world'`, `"escape\n"`

**Boolean**: `true`, `false`

**Null**: `null`

## Types

### Primitive Types

- `int` - Integer numbers
- `float` - Floating-point numbers
- `string` - Text strings
- `bool` - Boolean values (true/false)
- `null` - Null value

### Compound Types

- `[T]` - List of type T
- `{K: V}` - Map with key type K and value type V
- `#{T}` - Set of type T
- `(T1, T2, ...)` - Tuple of types

### Type Annotations (Optional)

```nexus
let x: int = 42
let name: string = "Alice"
let numbers: [int] = [1, 2, 3]

fn add(a: int, b: int) -> int {
    return a + b
}
```

### Type Inference

Types can be inferred when not explicitly specified:

```nexus
let x = 42          // inferred as int
let y = 3.14        // inferred as float
let name = "Bob"    // inferred as string
```

## Variables

### Immutable Variables (let)

```nexus
let x = 10
// x = 20  // Error: cannot reassign immutable variable
```

### Mutable Variables (var)

```nexus
var count = 0
count = count + 1  // OK
```

### Scoping

Variables are lexically scoped. Inner scopes can shadow outer variables.

```nexus
let x = 10
{
    let x = 20  // Shadows outer x
    print(x)    // Prints 20
}
print(x)        // Prints 10
```

## Operators

### Arithmetic Operators

- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division
- `%` Modulo

### Comparison Operators

- `==` Equal
- `!=` Not equal
- `<` Less than
- `>` Greater than
- `<=` Less than or equal
- `>=` Greater than or equal

### Logical Operators

- `and` Logical AND
- `or` Logical OR
- `!` Logical NOT

### Assignment

- `=` Assignment

### Operator Precedence

From highest to lowest:

1. Function call, indexing: `()`, `[]`
2. Unary: `-`, `!`
3. Multiplicative: `*`, `/`, `%`
4. Additive: `+`, `-`
5. Comparison: `<`, `>`, `<=`, `>=`
6. Equality: `==`, `!=`
7. Logical AND: `and`
8. Logical OR: `or`
9. Assignment: `=`

## Control Flow

### If-Else Statements

```nexus
if condition {
    // then branch
} else {
    // else branch
}

// Chained conditions
if x < 0 {
    print("Negative")
} else if x == 0 {
    print("Zero")
} else {
    print("Positive")
}
```

### While Loops

```nexus
while condition {
    // loop body
}

var i = 0
while i < 10 {
    print(i)
    i = i + 1
}
```

### For Loops

```nexus
// Iterate over range
for i in 0..10 {
    print(i)
}

// Iterate over collection
let items = [1, 2, 3]
for item in items {
    print(item)
}
```

### Pattern Matching (Planned)

```nexus
match value {
    0 => print("Zero")
    1..10 => print("Small number")
    n if n > 100 => print("Large: {n}")
    _ => print("Other")
}
```

## Functions

### Function Declaration

```nexus
fn function_name(param1, param2) {
    // function body
    return result
}
```

### With Type Annotations

```nexus
fn add(a: int, b: int) -> int {
    return a + b
}
```

### Lambda Functions

```nexus
let square = fn(x) => x * x
let add = fn(a, b) => a + b

// Multi-line lambda
let complex = fn(x, y) {
    let sum = x + y
    return sum * 2
}
```

### Closures

Functions capture their environment:

```nexus
fn make_counter() {
    var count = 0
    return fn() {
        count = count + 1
        return count
    }
}

let counter = make_counter()
print(counter())  // 1
print(counter())  // 2
```

### Higher-Order Functions

```nexus
fn apply(func, value) {
    return func(value)
}

let double = fn(x) => x * 2
print(apply(double, 5))  // 10
```

## Collections

### Lists

```nexus
let empty = []
let numbers = [1, 2, 3, 4, 5]
let mixed = [1, "two", 3.0, true]

// Indexing
print(numbers[0])  // 1

// Length
print(len(numbers))  // 5
```

### Ranges

```nexus
// Range from 0 to 9 (exclusive end)
let r = 0..10

for i in 0..5 {
    print(i)  // 0, 1, 2, 3, 4
}
```

### Maps (Planned)

```nexus
let person = {
    name: "Alice",
    age: 30,
    city: "NYC"
}

print(person.name)     // Alice
print(person["age"])   // 30
```

### Sets (Planned)

```nexus
let unique = #{1, 2, 3, 3, 4}  // {1, 2, 3, 4}
```

## Modules (Planned)

### Defining a Module

```nexus
module math {
    export fn add(a, b) {
        return a + b
    }
    
    fn helper() {  // Private, not exported
        // ...
    }
    
    export let PI = 3.14159
}
```

### Importing

```nexus
import math
print(math.add(1, 2))

import math.{add, PI}
print(add(1, 2))
print(PI)
```

## Classes and Traits (Planned)

### Classes

```nexus
class Person {
    name: string
    age: int
    
    fn new(name: string, age: int) -> Person {
        return Person {
            name: name,
            age: age
        }
    }
    
    fn greet(self) {
        print("Hello, I'm {self.name}")
    }
    
    fn birthday(self) {
        self.age = self.age + 1
    }
}

let alice = Person.new("Alice", 30)
alice.greet()
```

### Traits (Interfaces)

```nexus
trait Drawable {
    fn draw(self)
}

class Circle {
    radius: float
    
    fn draw(self) {
        print("Drawing circle with radius {self.radius}")
    }
}

impl Drawable for Circle {}
```

### Generics

```nexus
fn identity<T>(value: T) -> T {
    return value
}

class Box<T> {
    value: T
    
    fn new(value: T) -> Box<T> {
        return Box {value: value}
    }
    
    fn get(self) -> T {
        return self.value
    }
}
```

## Error Handling (Planned)

### Result Type

```nexus
enum Result<T, E> {
    Ok(T)
    Err(E)
}

fn divide(a: float, b: float) -> Result<float, string> {
    if b == 0 {
        return Err("Division by zero")
    }
    return Ok(a / b)
}

let result = divide(10, 2)
match result {
    Ok(value) => print("Result: {value}")
    Err(error) => print("Error: {error}")
}
```

### Option Type

```nexus
enum Option<T> {
    Some(T)
    None
}

fn find(list, value) -> Option<int> {
    for i in 0..len(list) {
        if list[i] == value {
            return Some(i)
        }
    }
    return None
}
```

## Async Programming (Planned)

### Async Functions

```nexus
async fn fetch_data(url: string) -> string {
    let response = await http.get(url)
    return response.body
}

async fn main() {
    let data = await fetch_data("https://api.example.com")
    print(data)
}
```

### Concurrent Execution

```nexus
async fn process_all() {
    let task1 = async { fetch_data("url1") }
    let task2 = async { fetch_data("url2") }
    
    let results = await all([task1, task2])
    print(results)
}
```

## Standard Library (Overview)

### Core Modules

- `io` - Input/Output operations
- `math` - Mathematical functions
- `string` - String manipulation
- `list` - List operations
- `map` - Map/Dictionary operations
- `http` - HTTP client/server
- `json` - JSON parsing/serialization
- `async` - Async runtime
- `fs` - File system operations
- `time` - Time and date handling
- `regex` - Regular expressions
- `test` - Testing framework

### Built-in Functions

- `print(*args)` - Output to console
- `len(collection)` - Get length
- `range(start, end)` - Create range
- `str(value)` - Convert to string
- `int(value)` - Convert to integer
- `float(value)` - Convert to float
- `type(value)` - Get type of value

## Grammar (EBNF)

```ebnf
program         ::= statement*

statement       ::= assignment
                  | function_def
                  | return_stmt
                  | if_stmt
                  | while_stmt
                  | for_stmt
                  | expression

assignment      ::= ("let" | "var") IDENTIFIER "=" expression

function_def    ::= "fn" IDENTIFIER? "(" params ")" ("->" type)? block

return_stmt     ::= "return" expression?

if_stmt         ::= "if" expression block ("else" block)?

while_stmt      ::= "while" expression block

for_stmt        ::= "for" IDENTIFIER "in" expression block

expression      ::= logical_or

logical_or      ::= logical_and ("or" logical_and)*

logical_and     ::= equality ("and" equality)*

equality        ::= comparison (("==" | "!=") comparison)*

comparison      ::= range (("<" | ">" | "<=" | ">=") range)*

range           ::= term (".." term)?

term            ::= factor (("+" | "-") factor)*

factor          ::= unary (("*" | "/" | "%") unary)*

unary           ::= ("-" | "!") unary | postfix

postfix         ::= primary ("(" args ")" | "[" expression "]")*

primary         ::= NUMBER | STRING | BOOL | NULL | IDENTIFIER
                  | "(" expression ")"
                  | list
                  | function_def

list            ::= "[" (expression ("," expression)*)? "]"

block           ::= "{" statement* "}"
```

## Implementation Notes

### Current Status

**Implemented**:
- Lexer and tokenizer
- Recursive descent parser
- Tree-walking interpreter
- Variable scoping
- Functions and closures
- Basic control flow
- Lists and ranges

**Planned**:
- Type checker
- Pattern matching
- Classes and traits
- Module system
- Error handling types
- Async/await
- Compilation to bytecode/native

### Performance Considerations

The current implementation uses a tree-walking interpreter. Future versions will include:

1. **Bytecode compiler** - For faster execution
2. **JIT compilation** - For hot code paths
3. **LLVM backend** - For native performance

---

**Nexus Specification v1.0.0**  
**Part of poly-glot.ai**
