#!/usr/bin/env python3
"""
Nexus Programming Language - Universal Multi-Paradigm Language
Created for poly-glot.ai
Version: 1.0.0

A universal programming language supporting functional, imperative, and 
object-oriented paradigms with gradual typing.
"""

import re
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum, auto

# ==================== LEXER ====================

class TokenType(Enum):
    # Literals
    NUMBER = auto()
    STRING = auto()
    BOOL = auto()
    NULL = auto()
    
    # Identifiers and keywords
    IDENTIFIER = auto()
    LET = auto()
    VAR = auto()
    FN = auto()
    RETURN = auto()
    IF = auto()
    ELSE = auto()
    FOR = auto()
    IN = auto()
    WHILE = auto()
    MATCH = auto()
    CLASS = auto()
    IMPORT = auto()
    EXPORT = auto()
    ASYNC = auto()
    AWAIT = auto()
    
    # Operators
    PLUS = auto()
    MINUS = auto()
    STAR = auto()
    SLASH = auto()
    PERCENT = auto()
    ASSIGN = auto()
    EQ = auto()
    NEQ = auto()
    LT = auto()
    GT = auto()
    LTE = auto()
    GTE = auto()
    AND = auto()
    OR = auto()
    NOT = auto()
    ARROW = auto()
    FAT_ARROW = auto()
    RANGE = auto()
    
    # Delimiters
    LPAREN = auto()
    RPAREN = auto()
    LBRACE = auto()
    RBRACE = auto()
    LBRACKET = auto()
    RBRACKET = auto()
    COMMA = auto()
    COLON = auto()
    SEMICOLON = auto()
    DOT = auto()
    
    # Special
    NEWLINE = auto()
    EOF = auto()

@dataclass
class Token:
    type: TokenType
    value: Any
    line: int
    column: int

class Lexer:
    def __init__(self, source: str):
        self.source = source
        self.pos = 0
        self.line = 1
        self.column = 1
        self.tokens = []
        
        self.keywords = {
            'let': TokenType.LET,
            'var': TokenType.VAR,
            'fn': TokenType.FN,
            'return': TokenType.RETURN,
            'if': TokenType.IF,
            'else': TokenType.ELSE,
            'for': TokenType.FOR,
            'in': TokenType.IN,
            'while': TokenType.WHILE,
            'match': TokenType.MATCH,
            'class': TokenType.CLASS,
            'import': TokenType.IMPORT,
            'export': TokenType.EXPORT,
            'async': TokenType.ASYNC,
            'await': TokenType.AWAIT,
            'true': TokenType.BOOL,
            'false': TokenType.BOOL,
            'null': TokenType.NULL,
        }
    
    def current_char(self) -> Optional[str]:
        if self.pos >= len(self.source):
            return None
        return self.source[self.pos]
    
    def peek(self, offset=1) -> Optional[str]:
        pos = self.pos + offset
        if pos >= len(self.source):
            return None
        return self.source[pos]
    
    def advance(self) -> Optional[str]:
        char = self.current_char()
        if char == '\n':
            self.line += 1
            self.column = 1
        else:
            self.column += 1
        self.pos += 1
        return char
    
    def skip_whitespace(self):
        while self.current_char() and self.current_char() in ' \t\r\n':
            self.advance()
    
    def skip_comment(self):
        if self.current_char() == '/' and self.peek() == '/':
            while self.current_char() and self.current_char() != '\n':
                self.advance()
    
    def read_number(self) -> Token:
        line, column = self.line, self.column
        num_str = ''
        has_dot = False
        
        while self.current_char() and (self.current_char().isdigit() or self.current_char() == '.'):
            if self.current_char() == '.':
                if has_dot:
                    break
                has_dot = True
            num_str += self.current_char()
            self.advance()
        
        value = float(num_str) if has_dot else int(num_str)
        return Token(TokenType.NUMBER, value, line, column)
    
    def read_string(self) -> Token:
        line, column = self.line, self.column
        quote = self.current_char()
        self.advance()  # Skip opening quote
        
        string = ''
        while self.current_char() and self.current_char() != quote:
            if self.current_char() == '\\':
                self.advance()
                escape_char = self.current_char()
                if escape_char == 'n':
                    string += '\n'
                elif escape_char == 't':
                    string += '\t'
                elif escape_char == '\\':
                    string += '\\'
                elif escape_char == quote:
                    string += quote
                self.advance()
            else:
                string += self.current_char()
                self.advance()
        
        self.advance()  # Skip closing quote
        return Token(TokenType.STRING, string, line, column)
    
    def read_identifier(self) -> Token:
        line, column = self.line, self.column
        ident = ''
        
        while self.current_char() and (self.current_char().isalnum() or self.current_char() == '_'):
            ident += self.current_char()
            self.advance()
        
        token_type = self.keywords.get(ident, TokenType.IDENTIFIER)
        value = ident
        
        if token_type == TokenType.BOOL:
            value = ident == 'true'
        elif token_type == TokenType.NULL:
            value = None
        
        return Token(token_type, value, line, column)
    
    def tokenize(self) -> List[Token]:
        while self.current_char():
            self.skip_whitespace()
            self.skip_comment()
            
            if not self.current_char():
                break
            
            char = self.current_char()
            line, column = self.line, self.column
            
            # Numbers
            if char.isdigit():
                self.tokens.append(self.read_number())
            
            # Strings
            elif char in '"\'':
                self.tokens.append(self.read_string())
            
            # Identifiers and keywords
            elif char.isalpha() or char == '_':
                self.tokens.append(self.read_identifier())
            
            # Operators and delimiters
            elif char == '+':
                self.advance()
                self.tokens.append(Token(TokenType.PLUS, '+', line, column))
            elif char == '-':
                self.advance()
                if self.current_char() == '>':
                    self.advance()
                    self.tokens.append(Token(TokenType.ARROW, '->', line, column))
                else:
                    self.tokens.append(Token(TokenType.MINUS, '-', line, column))
            elif char == '*':
                self.advance()
                self.tokens.append(Token(TokenType.STAR, '*', line, column))
            elif char == '/':
                self.advance()
                self.tokens.append(Token(TokenType.SLASH, '/', line, column))
            elif char == '%':
                self.advance()
                self.tokens.append(Token(TokenType.PERCENT, '%', line, column))
            elif char == '=':
                self.advance()
                if self.current_char() == '=':
                    self.advance()
                    self.tokens.append(Token(TokenType.EQ, '==', line, column))
                elif self.current_char() == '>':
                    self.advance()
                    self.tokens.append(Token(TokenType.FAT_ARROW, '=>', line, column))
                else:
                    self.tokens.append(Token(TokenType.ASSIGN, '=', line, column))
            elif char == '!':
                self.advance()
                if self.current_char() == '=':
                    self.advance()
                    self.tokens.append(Token(TokenType.NEQ, '!=', line, column))
                else:
                    self.tokens.append(Token(TokenType.NOT, '!', line, column))
            elif char == '<':
                self.advance()
                if self.current_char() == '=':
                    self.advance()
                    self.tokens.append(Token(TokenType.LTE, '<=', line, column))
                else:
                    self.tokens.append(Token(TokenType.LT, '<', line, column))
            elif char == '>':
                self.advance()
                if self.current_char() == '=':
                    self.advance()
                    self.tokens.append(Token(TokenType.GTE, '>=', line, column))
                else:
                    self.tokens.append(Token(TokenType.GT, '>', line, column))
            elif char == '(':
                self.advance()
                self.tokens.append(Token(TokenType.LPAREN, '(', line, column))
            elif char == ')':
                self.advance()
                self.tokens.append(Token(TokenType.RPAREN, ')', line, column))
            elif char == '{':
                self.advance()
                self.tokens.append(Token(TokenType.LBRACE, '{', line, column))
            elif char == '}':
                self.advance()
                self.tokens.append(Token(TokenType.RBRACE, '}', line, column))
            elif char == '[':
                self.advance()
                self.tokens.append(Token(TokenType.LBRACKET, '[', line, column))
            elif char == ']':
                self.advance()
                self.tokens.append(Token(TokenType.RBRACKET, ']', line, column))
            elif char == ',':
                self.advance()
                self.tokens.append(Token(TokenType.COMMA, ',', line, column))
            elif char == ':':
                self.advance()
                self.tokens.append(Token(TokenType.COLON, ':', line, column))
            elif char == ';':
                self.advance()
                self.tokens.append(Token(TokenType.SEMICOLON, ';', line, column))
            elif char == '.':
                self.advance()
                if self.current_char() == '.':
                    self.advance()
                    self.tokens.append(Token(TokenType.RANGE, '..', line, column))
                else:
                    self.tokens.append(Token(TokenType.DOT, '.', line, column))
            else:
                raise SyntaxError(f"Unexpected character '{char}' at line {line}, column {column}")
        
        self.tokens.append(Token(TokenType.EOF, None, self.line, self.column))
        return self.tokens

# ==================== AST NODES ====================

@dataclass
class ASTNode:
    pass

@dataclass
class NumberNode(ASTNode):
    value: Union[int, float]

@dataclass
class StringNode(ASTNode):
    value: str

@dataclass
class BoolNode(ASTNode):
    value: bool

@dataclass
class NullNode(ASTNode):
    pass

@dataclass
class IdentifierNode(ASTNode):
    name: str

@dataclass
class BinaryOpNode(ASTNode):
    left: ASTNode
    operator: str
    right: ASTNode

@dataclass
class UnaryOpNode(ASTNode):
    operator: str
    operand: ASTNode

@dataclass
class AssignmentNode(ASTNode):
    name: str
    value: ASTNode
    is_mutable: bool = False

@dataclass
class FunctionDefNode(ASTNode):
    name: Optional[str]
    params: List[str]
    body: List[ASTNode]

@dataclass
class FunctionCallNode(ASTNode):
    name: str
    args: List[ASTNode]

@dataclass
class ReturnNode(ASTNode):
    value: Optional[ASTNode]

@dataclass
class IfNode(ASTNode):
    condition: ASTNode
    then_body: List[ASTNode]
    else_body: Optional[List[ASTNode]] = None

@dataclass
class WhileNode(ASTNode):
    condition: ASTNode
    body: List[ASTNode]

@dataclass
class ForNode(ASTNode):
    variable: str
    iterable: ASTNode
    body: List[ASTNode]

@dataclass
class ListNode(ASTNode):
    elements: List[ASTNode]

@dataclass
class RangeNode(ASTNode):
    start: ASTNode
    end: ASTNode

@dataclass
class IndexNode(ASTNode):
    target: ASTNode
    index: ASTNode

@dataclass
class BlockNode(ASTNode):
    statements: List[ASTNode]

# ==================== PARSER ====================

class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0
    
    def current_token(self) -> Token:
        if self.pos >= len(self.tokens):
            return self.tokens[-1]  # EOF
        return self.tokens[self.pos]
    
    def advance(self) -> Token:
        token = self.current_token()
        self.pos += 1
        return token
    
    def expect(self, token_type: TokenType) -> Token:
        token = self.current_token()
        if token.type != token_type:
            raise SyntaxError(f"Expected {token_type}, got {token.type} at line {token.line}")
        return self.advance()
    
    def parse(self) -> List[ASTNode]:
        statements = []
        while self.current_token().type != TokenType.EOF:
            statements.append(self.parse_statement())
        return statements
    
    def parse_statement(self) -> ASTNode:
        token = self.current_token()
        
        if token.type == TokenType.LET or token.type == TokenType.VAR:
            return self.parse_assignment()
        elif token.type == TokenType.FN:
            return self.parse_function_def()
        elif token.type == TokenType.RETURN:
            return self.parse_return()
        elif token.type == TokenType.IF:
            return self.parse_if()
        elif token.type == TokenType.WHILE:
            return self.parse_while()
        elif token.type == TokenType.FOR:
            return self.parse_for()
        else:
            return self.parse_expression()
    
    def parse_assignment(self) -> AssignmentNode:
        is_mutable = self.current_token().type == TokenType.VAR
        self.advance()  # Skip 'let' or 'var'
        
        name = self.expect(TokenType.IDENTIFIER).value
        self.expect(TokenType.ASSIGN)
        value = self.parse_expression()
        
        return AssignmentNode(name, value, is_mutable)
    
    def parse_function_def(self) -> FunctionDefNode:
        self.advance()  # Skip 'fn'
        
        name = None
        if self.current_token().type == TokenType.IDENTIFIER:
            name = self.advance().value
        
        self.expect(TokenType.LPAREN)
        params = []
        
        while self.current_token().type != TokenType.RPAREN:
            params.append(self.expect(TokenType.IDENTIFIER).value)
            if self.current_token().type == TokenType.COMMA:
                self.advance()
        
        self.expect(TokenType.RPAREN)
        
        # Check for fat arrow (short form)
        if self.current_token().type == TokenType.FAT_ARROW:
            self.advance()
            body = [ReturnNode(self.parse_expression())]
        else:
            self.expect(TokenType.LBRACE)
            body = []
            while self.current_token().type != TokenType.RBRACE:
                body.append(self.parse_statement())
            self.expect(TokenType.RBRACE)
        
        return FunctionDefNode(name, params, body)
    
    def parse_return(self) -> ReturnNode:
        self.advance()  # Skip 'return'
        
        if self.current_token().type in [TokenType.RBRACE, TokenType.EOF]:
            return ReturnNode(None)
        
        return ReturnNode(self.parse_expression())
    
    def parse_if(self) -> IfNode:
        self.advance()  # Skip 'if'
        
        condition = self.parse_expression()
        self.expect(TokenType.LBRACE)
        
        then_body = []
        while self.current_token().type != TokenType.RBRACE:
            then_body.append(self.parse_statement())
        self.expect(TokenType.RBRACE)
        
        else_body = None
        if self.current_token().type == TokenType.ELSE:
            self.advance()
            self.expect(TokenType.LBRACE)
            else_body = []
            while self.current_token().type != TokenType.RBRACE:
                else_body.append(self.parse_statement())
            self.expect(TokenType.RBRACE)
        
        return IfNode(condition, then_body, else_body)
    
    def parse_while(self) -> WhileNode:
        self.advance()  # Skip 'while'
        
        condition = self.parse_expression()
        self.expect(TokenType.LBRACE)
        
        body = []
        while self.current_token().type != TokenType.RBRACE:
            body.append(self.parse_statement())
        self.expect(TokenType.RBRACE)
        
        return WhileNode(condition, body)
    
    def parse_for(self) -> ForNode:
        self.advance()  # Skip 'for'
        
        variable = self.expect(TokenType.IDENTIFIER).value
        self.expect(TokenType.IN)
        iterable = self.parse_expression()
        
        self.expect(TokenType.LBRACE)
        body = []
        while self.current_token().type != TokenType.RBRACE:
            body.append(self.parse_statement())
        self.expect(TokenType.RBRACE)
        
        return ForNode(variable, iterable, body)
    
    def parse_expression(self) -> ASTNode:
        return self.parse_logical_or()
    
    def parse_logical_or(self) -> ASTNode:
        left = self.parse_logical_and()
        
        while self.current_token().type == TokenType.OR:
            op = self.advance().value
            right = self.parse_logical_and()
            left = BinaryOpNode(left, op, right)
        
        return left
    
    def parse_logical_and(self) -> ASTNode:
        left = self.parse_equality()
        
        while self.current_token().type == TokenType.AND:
            op = self.advance().value
            right = self.parse_equality()
            left = BinaryOpNode(left, op, right)
        
        return left
    
    def parse_equality(self) -> ASTNode:
        left = self.parse_comparison()
        
        while self.current_token().type in [TokenType.EQ, TokenType.NEQ]:
            op = self.advance().value
            right = self.parse_comparison()
            left = BinaryOpNode(left, op, right)
        
        return left
    
    def parse_comparison(self) -> ASTNode:
        left = self.parse_range()
        
        while self.current_token().type in [TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE]:
            op = self.advance().value
            right = self.parse_range()
            left = BinaryOpNode(left, op, right)
        
        return left
    
    def parse_range(self) -> ASTNode:
        left = self.parse_term()
        
        if self.current_token().type == TokenType.RANGE:
            self.advance()
            right = self.parse_term()
            return RangeNode(left, right)
        
        return left
    
    def parse_term(self) -> ASTNode:
        left = self.parse_factor()
        
        while self.current_token().type in [TokenType.PLUS, TokenType.MINUS]:
            op = self.advance().value
            right = self.parse_factor()
            left = BinaryOpNode(left, op, right)
        
        return left
    
    def parse_factor(self) -> ASTNode:
        left = self.parse_unary()
        
        while self.current_token().type in [TokenType.STAR, TokenType.SLASH, TokenType.PERCENT]:
            op = self.advance().value
            right = self.parse_unary()
            left = BinaryOpNode(left, op, right)
        
        return left
    
    def parse_unary(self) -> ASTNode:
        if self.current_token().type in [TokenType.MINUS, TokenType.NOT]:
            op = self.advance().value
            operand = self.parse_unary()
            return UnaryOpNode(op, operand)
        
        return self.parse_postfix()
    
    def parse_postfix(self) -> ASTNode:
        node = self.parse_primary()
        
        while True:
            if self.current_token().type == TokenType.LPAREN:
                # Function call
                self.advance()
                args = []
                while self.current_token().type != TokenType.RPAREN:
                    args.append(self.parse_expression())
                    if self.current_token().type == TokenType.COMMA:
                        self.advance()
                self.expect(TokenType.RPAREN)
                
                if isinstance(node, IdentifierNode):
                    node = FunctionCallNode(node.name, args)
                else:
                    raise SyntaxError("Can only call functions")
            
            elif self.current_token().type == TokenType.LBRACKET:
                # Indexing
                self.advance()
                index = self.parse_expression()
                self.expect(TokenType.RBRACKET)
                node = IndexNode(node, index)
            
            else:
                break
        
        return node
    
    def parse_primary(self) -> ASTNode:
        token = self.current_token()
        
        if token.type == TokenType.NUMBER:
            self.advance()
            return NumberNode(token.value)
        
        elif token.type == TokenType.STRING:
            self.advance()
            return StringNode(token.value)
        
        elif token.type == TokenType.BOOL:
            self.advance()
            return BoolNode(token.value)
        
        elif token.type == TokenType.NULL:
            self.advance()
            return NullNode()
        
        elif token.type == TokenType.IDENTIFIER:
            self.advance()
            return IdentifierNode(token.value)
        
        elif token.type == TokenType.LPAREN:
            self.advance()
            expr = self.parse_expression()
            self.expect(TokenType.RPAREN)
            return expr
        
        elif token.type == TokenType.LBRACKET:
            return self.parse_list()
        
        elif token.type == TokenType.FN:
            return self.parse_function_def()
        
        else:
            raise SyntaxError(f"Unexpected token {token.type} at line {token.line}")
    
    def parse_list(self) -> ListNode:
        self.expect(TokenType.LBRACKET)
        elements = []
        
        while self.current_token().type != TokenType.RBRACKET:
            elements.append(self.parse_expression())
            if self.current_token().type == TokenType.COMMA:
                self.advance()
        
        self.expect(TokenType.RBRACKET)
        return ListNode(elements)

# ==================== INTERPRETER ====================

class ReturnException(Exception):
    def __init__(self, value):
        self.value = value

class Environment:
    def __init__(self, parent=None):
        self.vars = {}
        self.parent = parent
    
    def define(self, name: str, value: Any, mutable: bool = False):
        self.vars[name] = {'value': value, 'mutable': mutable}
    
    def get(self, name: str) -> Any:
        if name in self.vars:
            return self.vars[name]['value']
        elif self.parent:
            return self.parent.get(name)
        else:
            raise NameError(f"Undefined variable '{name}'")
    
    def set(self, name: str, value: Any):
        if name in self.vars:
            if not self.vars[name]['mutable']:
                raise ValueError(f"Cannot reassign immutable variable '{name}'")
            self.vars[name]['value'] = value
        elif self.parent:
            self.parent.set(name, value)
        else:
            raise NameError(f"Undefined variable '{name}'")

class Function:
    def __init__(self, params: List[str], body: List[ASTNode], closure: Environment):
        self.params = params
        self.body = body
        self.closure = closure

class Interpreter:
    def __init__(self):
        self.global_env = Environment()
        self.setup_builtins()
    
    def setup_builtins(self):
        # Built-in functions
        self.global_env.define('print', lambda *args: print(*args))
        self.global_env.define('len', len)
        self.global_env.define('range', range)
        self.global_env.define('str', str)
        self.global_env.define('int', int)
        self.global_env.define('float', float)
    
    def eval(self, node: ASTNode, env: Environment) -> Any:
        if isinstance(node, NumberNode):
            return node.value
        
        elif isinstance(node, StringNode):
            return node.value
        
        elif isinstance(node, BoolNode):
            return node.value
        
        elif isinstance(node, NullNode):
            return None
        
        elif isinstance(node, IdentifierNode):
            return env.get(node.name)
        
        elif isinstance(node, BinaryOpNode):
            left = self.eval(node.left, env)
            right = self.eval(node.right, env)
            
            if node.operator == '+':
                return left + right
            elif node.operator == '-':
                return left - right
            elif node.operator == '*':
                return left * right
            elif node.operator == '/':
                return left / right
            elif node.operator == '%':
                return left % right
            elif node.operator == '==':
                return left == right
            elif node.operator == '!=':
                return left != right
            elif node.operator == '<':
                return left < right
            elif node.operator == '>':
                return left > right
            elif node.operator == '<=':
                return left <= right
            elif node.operator == '>=':
                return left >= right
            elif node.operator == 'and':
                return left and right
            elif node.operator == 'or':
                return left or right
        
        elif isinstance(node, UnaryOpNode):
            operand = self.eval(node.operand, env)
            
            if node.operator == '-':
                return -operand
            elif node.operator == '!':
                return not operand
        
        elif isinstance(node, AssignmentNode):
            value = self.eval(node.value, env)
            env.define(node.name, value, node.is_mutable)
            return value
        
        elif isinstance(node, FunctionDefNode):
            func = Function(node.params, node.body, env)
            if node.name:
                env.define(node.name, func)
            return func
        
        elif isinstance(node, FunctionCallNode):
            func = env.get(node.name)
            args = [self.eval(arg, env) for arg in node.args]
            
            if callable(func) and not isinstance(func, Function):
                # Built-in function
                return func(*args)
            elif isinstance(func, Function):
                # User-defined function
                if len(args) != len(func.params):
                    raise ValueError(f"Expected {len(func.params)} arguments, got {len(args)}")
                
                func_env = Environment(func.closure)
                for param, arg in zip(func.params, args):
                    func_env.define(param, arg)
                
                try:
                    for stmt in func.body:
                        self.eval(stmt, func_env)
                    return None
                except ReturnException as ret:
                    return ret.value
            else:
                raise TypeError(f"'{node.name}' is not a function")
        
        elif isinstance(node, ReturnNode):
            value = self.eval(node.value, env) if node.value else None
            raise ReturnException(value)
        
        elif isinstance(node, IfNode):
            condition = self.eval(node.condition, env)
            
            if condition:
                for stmt in node.then_body:
                    self.eval(stmt, env)
            elif node.else_body:
                for stmt in node.else_body:
                    self.eval(stmt, env)
        
        elif isinstance(node, WhileNode):
            while self.eval(node.condition, env):
                for stmt in node.body:
                    self.eval(stmt, env)
        
        elif isinstance(node, ForNode):
            iterable = self.eval(node.iterable, env)
            
            for item in iterable:
                loop_env = Environment(env)
                loop_env.define(node.variable, item)
                for stmt in node.body:
                    self.eval(stmt, loop_env)
        
        elif isinstance(node, ListNode):
            return [self.eval(elem, env) for elem in node.elements]
        
        elif isinstance(node, RangeNode):
            start = self.eval(node.start, env)
            end = self.eval(node.end, env)
            return range(start, end)
        
        elif isinstance(node, IndexNode):
            target = self.eval(node.target, env)
            index = self.eval(node.index, env)
            return target[index]
        
        return None
    
    def run(self, source: str):
        lexer = Lexer(source)
        tokens = lexer.tokenize()
        
        parser = Parser(tokens)
        ast = parser.parse()
        
        for node in ast:
            self.eval(node, self.global_env)

# ==================== MAIN ====================

def main():
    print("=== Nexus Programming Language ===")
    print("A Universal Multi-Paradigm Language")
    print("Part of the poly-glot.ai project\n")
    
    # Example programs
    examples = [
        ("Variables and Arithmetic", """
let x = 10
let y = 20
let sum = x + y
print("Sum:", sum)
print("Product:", x * y)
"""),
        ("Functions", """
fn add(a, b) {
    return a + b
}

fn factorial(n) {
    if n <= 1 {
        return 1
    }
    return n * factorial(n - 1)
}

print("add(5, 3):", add(5, 3))
print("factorial(5):", factorial(5))
"""),
        ("Lambda Functions", """
let square = fn(x) => x * x
let double = fn(x) => x * 2

print("square(7):", square(7))
print("double(7):", double(7))
"""),
        ("Lists and Iteration", """
let numbers = [1, 2, 3, 4, 5]
print("List:", numbers)
print("First element:", numbers[0])
print("Length:", len(numbers))

for n in numbers {
    print("Number:", n)
}
"""),
        ("Ranges and For Loops", """
print("Numbers 0 to 5:")
for i in 0..6 {
    print(i)
}

print("Even squares:")
for i in 0..10 {
    if i % 2 == 0 {
        print(i * i)
    }
}
"""),
        ("Conditionals", """
fn classify(n) {
    if n < 0 {
        print("Negative")
    } else {
        if n == 0 {
            print("Zero")
        } else {
            print("Positive")
        }
    }
}

classify(-5)
classify(0)
classify(10)
"""),
        ("Fibonacci", """
fn fib(n) {
    if n <= 1 {
        return n
    }
    return fib(n - 1) + fib(n - 2)
}

print("Fibonacci sequence:")
for i in 0..10 {
    print(fib(i))
}
"""),
    ]
    
    interpreter = Interpreter()
    
    for title, code in examples:
        print(f"\n{'='*50}")
        print(f"Example: {title}")
        print('='*50)
        print(f"Code:\n{code}")
        print(f"\nOutput:")
        try:
            interpreter.run(code)
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n" + "="*50)
    print("REPL Mode - Type 'exit' to quit")
    print("="*50)
    
    # Simple REPL
    repl_interpreter = Interpreter()
    while True:
        try:
            code = input("\nnexus> ")
            if code.strip().lower() == 'exit':
                break
            if code.strip():
                repl_interpreter.run(code)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")
    
    print("\nGoodbye!")

if __name__ == "__main__":
    main()
