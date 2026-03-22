# Poly-Glot 🌐

> A comprehensive code comment library and interactive learning tool for 12+ programming languages

![Poly-Glot Banner](https://img.shields.io/badge/Languages-12%2B-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Status](https://img.shields.io/badge/status-active-success)

## 🎯 Overview

**Poly-Glot** is an interactive web application that helps developers learn and apply proper code commenting conventions across multiple programming languages. Whether you're a beginner learning to document your code or an experienced developer switching between languages, Poly-Glot provides instant access to language-specific commenting patterns, best practices, and real-world examples.

## ✨ Features

### 📚 **Comprehensive Language Support**
- **12 Programming Languages**: Python, JavaScript, Java, C++, C#, Go, Rust, Ruby, PHP, TypeScript, Swift, and Kotlin
- Language-specific documentation standards (JSDoc, Javadoc, PyDoc, Doxygen, etc.)
- Single-line, multi-line, and documentation comment syntax for each language

### 🎨 **Interactive Templates**
- Pre-built, well-commented function examples
- Class documentation templates
- Real-world code snippets
- Copy-to-clipboard functionality for instant use

### 🔍 **Code Analysis Tool**
- Analyze your code for comment coverage
- Identify undocumented functions and classes
- Calculate comment-to-code ratios
- Get suggestions for improvement

### 📖 **Best Practices Guide**
- Language-specific commenting conventions
- General documentation principles
- When to comment vs. when to refactor
- Industry-standard documentation formats

### 💾 **Favorites System**
- Bookmark frequently used templates
- Persistent storage using localStorage
- Quick access to saved snippets

### 🎓 **Learning Resources**
- Side-by-side template and code editor view
- Curated examples for common patterns
- Search functionality across all templates
- Export templates as text files

## 🚀 Quick Start

### Online Version
Simply open `index.html` in your web browser - no installation required!

```bash
# Clone the repository
git clone https://github.com/hmoses/poly-glot.git

# Navigate to the directory
cd poly-glot

# Open in your browser
open index.html
# or
python -m http.server 8000  # Then visit http://localhost:8000
```

### Local Development Server

```bash
# Using Python
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## 📋 Usage Guide

### 1. **Select Your Language**
Choose from the dropdown menu in the header to switch between programming languages.

### 2. **Browse Templates**
Navigate through different categories:
- **Comment Syntax**: Basic single-line, multi-line, and doc comments
- **Function Examples**: Well-documented function templates
- **Class Examples**: Comprehensive class documentation
- **Best Practices**: Language-specific and general guidelines
- **Code Examples**: Real-world use cases
- **Interactive Editor**: Test and analyze your own code

### 3. **Copy and Use**
Click the "Copy" button on any template to copy it to your clipboard, then paste it into your project.

### 4. **Analyze Your Code**
1. Paste your code into the Interactive Editor
2. Click "Analyze Code"
3. Review suggestions and metrics
4. Improve your documentation based on feedback

### 5. **Export Templates**
Click "Export Templates" to download language-specific templates as a text file for offline reference.

## 🎨 Screenshots

### Main Interface
![Main Interface - Coming Soon]

### Code Analysis
![Code Analysis - Coming Soon]

### Template Browser
![Template Browser - Coming Soon]

## 🛠️ Technical Details

### Built With
- **Pure HTML/CSS/JavaScript** - No frameworks or dependencies
- **CSS Grid & Flexbox** - Responsive layout
- **LocalStorage API** - Persistent favorites
- **Google Fonts** - Inter & Fira Code typography

### File Structure
```
poly-glot/
├── index.html          # Main HTML structure
├── styles.css          # All styling and theming
├── app.js              # Application logic and templates
├── README.md           # This file
├── LICENSE             # MIT License
└── screenshots/        # Application screenshots (optional)
```

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎯 Supported Languages & Documentation Standards

| Language   | Doc Standard        | Comment Syntax      |
|------------|---------------------|---------------------|
| Python     | Sphinx/Google/NumPy | `#`, `"""`          |
| JavaScript | JSDoc               | `//`, `/* */`, `/**` |
| Java       | Javadoc             | `//`, `/* */`, `/**` |
| C++        | Doxygen             | `//`, `/* */`, `/**` |
| C#         | XML Documentation   | `//`, `/* */`, `///` |
| Go         | GoDoc               | `//`, `/* */`       |
| Rust       | Rustdoc             | `//`, `/* */`, `///` |
| Ruby       | RDoc/YARD           | `#`, `=begin/end`   |
| PHP        | PHPDoc              | `//`, `/* */`, `/**` |
| TypeScript | TSDoc               | `//`, `/* */`, `/**` |
| Swift      | Swift Markup        | `//`, `/* */`, `///` |
| Kotlin     | KDoc                | `//`, `/* */`, `/**` |

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Adding New Languages
1. Fork the repository
2. Add language patterns to `commentPatterns` object in `app.js`
3. Include: single-line, multi-line, docstring syntax
4. Add function and class examples
5. List best practices (minimum 5)
6. Submit a pull request

### Adding Examples
Add real-world code examples to the `examples` object in `app.js`:

```javascript
languagename: [
    {
        title: 'Example Title',
        category: 'Category Name',
        code: `your code here`
    }
]
```

### Reporting Issues
Found a bug or have a suggestion? Please open an issue with:
- Clear description
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Browser and version

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Inspired by the need for quick reference to commenting conventions
- Built with ❤️ for the developer community
- Font: [Inter](https://fonts.google.com/specimen/Inter) & [Fira Code](https://fonts.google.com/specimen/Fira+Code)

## 📬 Contact

- **GitHub**: [@hmoses](https://github.com/hmoses)
- **Issues**: [GitHub Issues](https://github.com/hmoses/poly-glot/issues)

## 🗺️ Roadmap

- [ ] Add syntax highlighting
- [ ] More language support (SQL, R, Scala, etc.)
- [ ] Dark/light theme toggle
- [ ] Export to various formats (Markdown, JSON)
- [ ] AI-powered comment generation
- [ ] VS Code extension
- [ ] Mobile app version

---

**Made with 💻 and ☕ by developers, for developers**

Star ⭐ this repository if you found it helpful!
