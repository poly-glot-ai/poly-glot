# Poly-Glot 🌐

> **AI generates comments. Poly-Glot ensures they're consistent.**  
> A comprehensive code comment library and standardization tool for 12+ programming languages

![Poly-Glot Banner](https://img.shields.io/badge/Languages-12%2B-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Status](https://img.shields.io/badge/status-active-success) ![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)

**🌐 Live App:** [https://hmoses.github.io/poly-glot/](https://hmoses.github.io/poly-glot/)

<!-- Demo GIF placeholder - will be added -->
<!-- ![Poly-Glot Demo](./assets/demo.gif) -->

## 🎯 Overview

**Poly-Glot** is an interactive web application designed for the AI coding era. While tools like GitHub Copilot and ChatGPT generate documentation instantly, they create inconsistent styles across your team. Poly-Glot provides standardized templates and best practices (JSDoc, Javadoc, PyDoc, Doxygen, and more) to ensure your team's documentation is professional, consistent, and maintainable—whether written by humans or AI.

### 🎬 See It In Action

The app features an interactive demo showing how Poly-Glot transforms inconsistent AI-generated comments into standardized documentation:

**Before:** Inconsistent AI comments → **After:** Professional JSDoc standard  
**Result:** 12% comment coverage → 85% coverage (+73% improvement)

[Try the live demo](https://hmoses.github.io/poly-glot/) and click "▶️ Play Demo" to see the transformation!

## ✨ Features

### 🤖 **AI-Powered Comment Generation** ⚡ NEW!
- **Generate professional comments instantly** using GPT-4o, Claude 3.5, or other AI models
- **Bring your own API key** - Works with OpenAI and Anthropic APIs
- **Privacy-first**: Your API key stays in your browser (localStorage), never sent to our servers
- **Cost-effective**: Most requests cost less than $0.01 (as low as $0.001 with GPT-4o-mini)
- **Smart formatting**: Automatically applies language-specific documentation standards
- **Real-time cost tracking**: See estimated cost before and after each generation
- **One-click integration**: Copy or replace your code with AI-generated comments

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

### 1. **Configure AI Settings** 🤖 (Optional but Recommended)
1. Click the "⚙️ AI Settings" button in the header
2. Choose your AI provider (OpenAI or Anthropic)
3. Select your preferred model (GPT-4o-mini recommended for cost)
4. Enter your API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys)
5. Click "Test Connection" to verify your key works
6. Click "Save Settings" - your key is stored locally in your browser only

**Privacy Note:** Your API key never leaves your browser and is stored in localStorage. All AI calls go directly from your browser to OpenAI/Anthropic.

### 2. **Generate AI Comments** ⚡
1. Select your programming language from the dropdown
2. Paste your undocumented code into the editor
3. Click "🤖 Generate Comments"
4. Review the AI-generated comments with proper documentation format
5. Click "📋 Copy to Clipboard" or "✅ Replace Code" to use the generated comments
6. Cost is displayed for each generation (typically $0.001-$0.01)

### 3. **Select Your Language**
Choose from the dropdown menu in the header to switch between programming languages.

### 4. **Browse Templates**
Navigate through different categories:
- **Comment Syntax**: Basic single-line, multi-line, and doc comments
- **Function Examples**: Well-documented function templates
- **Class Examples**: Comprehensive class documentation
- **Best Practices**: Language-specific and general guidelines
- **Code Examples**: Real-world use cases
- **Interactive Editor**: Test and analyze your own code

### 5. **Copy and Use**
Click the "Copy" button on any template to copy it to your clipboard, then paste it into your project.

### 6. **Analyze Your Code**
1. Paste your code into the Interactive Editor
2. Click "Analyze Code"
3. Review suggestions and metrics
4. Improve your documentation based on feedback

### 7. **Export Templates**
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
├── ai-generator.js     # AI comment generation (OpenAI/Anthropic)
├── analytics.js        # Privacy-first analytics system
├── README.md           # This file
├── ANALYTICS.md        # Analytics documentation
├── LICENSE             # MIT License
└── .gitignore          # Git ignore rules
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

- [x] **AI-powered comment generation** ✅ (GPT-4o, Claude 3.5 - LIVE!)
- [ ] Add syntax highlighting to code editor
- [ ] More language support (SQL, R, Scala, Dart, etc.)
- [ ] Dark/light theme toggle
- [ ] Export to various formats (Markdown, JSON)
- [ ] Backend API for premium features
- [ ] GitHub Sponsors integration
- [ ] VS Code extension
- [ ] Mobile app version
- [ ] Team collaboration features
- [ ] CI/CD integration plugins

---

**Made with 💻 and ☕ by developers, for developers**

Star ⭐ this repository if you found it helpful!
