# Testing Guide for Demo Feature

## Quick Start

### 1. Install Dependencies & Build

```bash
cd /workspace/poly-glot/cli

# Install dependencies (if not already installed)
npm install

# Build TypeScript to JavaScript
npm run build

# Verify build succeeded
ls -la dist/
```

Expected output in `dist/`:
- `config.js`
- `demo-samples.js`
- `generator.js`
- `index.js`

### 2. Test the Demo Command

#### Test Interactive Mode (Default)
```bash
node dist/index.js demo

# Or if installed globally:
poly-glot demo
```

**Expected behavior:**
1. Shows welcome message with film emoji 🎬
2. Lists 6 available languages with descriptions
3. Prompts: "Select a language [1-6] or name:"
4. After selection, displays before/after code
5. Shows benefits and next steps

#### Test Direct Language Selection
```bash
node dist/index.js demo --lang javascript
node dist/index.js demo --lang python
node dist/index.js demo --lang typescript
node dist/index.js demo --lang java
node dist/index.js demo --lang go
node dist/index.js demo --lang rust
```

**Expected behavior:**
- Skips interactive menu
- Directly shows selected language example
- Displays before/after code
- Shows benefits and CTA

#### Test Invalid Language
```bash
node dist/index.js demo --lang invalid
```

**Expected behavior:**
- Shows error message: "Language 'invalid' not found in demo samples."
- Lists available languages
- Exits with error code

#### Test Live Mode (Requires API Key)

**Without API key configured:**
```bash
node dist/index.js demo --lang javascript --live
```

**Expected behavior:**
- Shows warning: "API key not configured. Showing pre-generated example."
- Falls back to static example
- Prompts user to run `poly-glot config`

**With API key configured:**
```bash
# First configure (if not already done)
node dist/index.js config --key YOUR_API_KEY --provider openai --model gpt-4o-mini

# Then run live demo
node dist/index.js demo --lang python --live
```

**Expected behavior:**
- Shows "Generating live comments with openai (gpt-4o-mini)..."
- Displays spinner while generating
- Shows generated code with actual AI comments
- Displays cost and token usage
- Falls back to static on API error

### 3. Test Help Text

```bash
node dist/index.js --help
node dist/index.js -h
```

**Verify:**
- `demo` command is listed first under Commands
- `--live` flag is documented
- Examples section includes demo usage
- Formatting is clean and readable

### 4. Verify No Regressions

Test existing commands still work:

```bash
# Config
node dist/index.js config

# Version
node dist/index.js --version

# Help (already tested above)
node dist/index.js --help

# Comment command (requires test file)
echo 'function test() { console.log("hi"); }' > /tmp/test.js
node dist/index.js comment /tmp/test.js --output /tmp/test-commented.js
cat /tmp/test-commented.js
```

All existing commands should work without issues.

## Detailed Test Cases

### Test Case 1: Color Output
**Goal:** Verify ANSI color codes work correctly

**Steps:**
1. Run `node dist/index.js demo`
2. Observe output

**Expected:**
- Headers in cyan and bold
- "BEFORE" label in yellow
- "AFTER" label in green
- Separators (────) in dim gray
- Success checkmarks (✓) in green
- Benefits list with green checkmarks

### Test Case 2: Interactive Selection (Number)
**Steps:**
1. Run `node dist/index.js demo`
2. Enter `1` when prompted

**Expected:**
- JavaScript example is shown
- No errors
- Complete before/after display

### Test Case 3: Interactive Selection (Name)
**Steps:**
1. Run `node dist/index.js demo`
2. Enter `python` when prompted

**Expected:**
- Python example is shown
- Case-insensitive (also try `Python`, `PYTHON`)

### Test Case 4: API Error Handling
**Steps:**
1. Configure with invalid API key: `node dist/index.js config --key invalid-key`
2. Run: `node dist/index.js demo --lang javascript --live`

**Expected:**
- Shows error during generation
- Falls back to static example
- Continues without crashing

### Test Case 5: Multiple Language Coverage
**Steps:**
Run demo for each language and verify:

| Language   | Before Keywords          | After Keywords                |
|------------|--------------------------|-------------------------------|
| JavaScript | `// calculates`          | `/** @param @returns */`      |
| Python     | `# process data`         | `"""Args: Returns:"""`        |
| TypeScript | `// fetch user`          | `/** @param @returns */`      |
| Java       | `// check if`            | `/** @param @return */`       |
| Go         | `// handle health`       | `// Parameters: Response:"`   |
| Rust       | `// find max`            | `/// # Arguments # Returns`   |

### Test Case 6: Output Format
**Goal:** Ensure consistent formatting

**Check:**
- 80-character separator lines
- Proper spacing between sections
- No broken lines or overflow
- Unicode characters render correctly (🎬, ✨, ✓)

## Integration Tests

### Test with Real Workflow
```bash
# 1. New user discovers demo
node dist/index.js demo

# 2. Likes what they see, configures API
node dist/index.js config --key sk-xxx --provider openai

# 3. Tests with live demo
node dist/index.js demo --lang python --live

# 4. Comments their actual file
node dist/index.js comment myfile.py
```

All steps should work smoothly.

## Performance Tests

### Load Time
```bash
time node dist/index.js demo --lang javascript
```

**Expected:** < 1 second for static examples

### Live Generation Time
```bash
time node dist/index.js demo --lang python --live
```

**Expected:** 2-5 seconds (depends on API latency)

## Edge Cases

### Empty Selection
**Input:** Just press Enter when prompted
**Expected:** Treats as invalid, shows error

### Very Long Code
Check that code examples don't overflow terminal width (they should wrap properly)

### Terminal Without Color Support
Set `NO_COLOR=1` or test in basic terminal:
```bash
NO_COLOR=1 node dist/index.js demo
```

**Expected:** Still readable without ANSI codes

## Automated Testing (Future)

Consider adding:
```javascript
// test/demo.test.ts
import { getSampleLanguages, getSample } from '../src/demo-samples';

describe('Demo Samples', () => {
  test('all languages have valid samples', () => {
    const langs = getSampleLanguages();
    expect(langs.length).toBeGreaterThan(0);
    
    langs.forEach(lang => {
      const sample = getSample(lang);
      expect(sample).toBeDefined();
      expect(sample?.before).toBeTruthy();
      expect(sample?.after).toBeTruthy();
      expect(sample?.description).toBeTruthy();
    });
  });
});
```

## Checklist Before Deployment

- [ ] All test cases pass
- [ ] No TypeScript compilation errors
- [ ] Help text is accurate
- [ ] README is updated
- [ ] No breaking changes to existing commands
- [ ] Works with and without API key
- [ ] Color output looks good
- [ ] Error messages are helpful
- [ ] Performance is acceptable
- [ ] Git commit is clean

## Troubleshooting

### "Cannot find module 'demo-samples'"
**Fix:** Run `npm run build` to compile TypeScript

### Colors don't show up
**Check:** Terminal supports ANSI colors, try different terminal

### API errors in live mode
**Check:** 
1. API key is valid: `cat ~/.config/polyglot/config.json`
2. Internet connection works
3. Provider/model are correct

### Demo command not recognized
**Check:**
1. TypeScript compiled: `ls dist/index.js`
2. Running correct file: `node dist/index.js demo`
3. If global install: re-install with `npm install -g .`

## Success Criteria

✅ Demo runs without errors  
✅ All 6 languages work  
✅ Colors display correctly  
✅ Live mode works with valid API key  
✅ Graceful fallback without API key  
✅ Help text is accurate  
✅ Existing commands unaffected  
✅ Performance is good  
✅ User experience is smooth  

**When all criteria met → Ready to commit and deploy!** 🚀
