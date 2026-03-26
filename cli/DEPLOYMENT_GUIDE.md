# Deployment Guide - Demo Feature v1.1.0

## Pre-Deployment Checklist

### 1. Code Quality
- [x] TypeScript files created/modified
- [x] No compilation errors expected
- [x] Follows existing code patterns
- [x] Error handling implemented
- [x] Documentation added

### 2. Testing
- [ ] Run full test suite (see TESTING_GUIDE.md)
- [ ] Manual testing completed
- [ ] All 6 language examples verified
- [ ] Live mode tested with API
- [ ] Regression testing passed

### 3. Documentation
- [x] README.md updated
- [x] DEMO_FEATURE.md created
- [x] TESTING_GUIDE.md created
- [x] Help text updated
- [x] Commit message prepared

## Deployment Steps

### Step 1: Build and Verify

```bash
cd /workspace/poly-glot/cli

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify no errors
echo $?  # Should output 0

# Quick smoke test
node dist/index.js demo --lang javascript
```

### Step 2: Git Commit

```bash
cd /workspace/poly-glot

# Check status
git status

# Add new files
git add cli/src/demo-samples.ts
git add cli/DEMO_FEATURE.md
git add cli/TESTING_GUIDE.md
git add cli/DEPLOYMENT_GUIDE.md
git add COMMIT_MESSAGE.txt

# Add modified files
git add cli/src/index.ts
git add cli/README.md

# Commit with prepared message
git commit -F COMMIT_MESSAGE.txt

# Or use conventional commit format
git commit -m "feat(cli): Add interactive demo command

See DEMO_FEATURE.md for complete details.

- New poly-glot demo command
- Interactive language selection
- Live generation mode with --live flag
- 6+ language examples
- No breaking changes"
```

### Step 3: Version Bump

Update version in `cli/package.json`:

```bash
cd /workspace/poly-glot/cli

# Option 1: Manual edit
# Edit package.json: "version": "1.0.0" → "1.1.0"

# Option 2: Use npm (recommended)
npm version minor  # 1.0.0 → 1.1.0

# This creates a git tag automatically
```

**Versioning Guide:**
- **Major** (2.0.0): Breaking changes
- **Minor** (1.1.0): New features, no breaking changes ← **Use this**
- **Patch** (1.0.1): Bug fixes only

### Step 4: Build Distribution

```bash
cd /workspace/poly-glot/cli

# Clean previous build
rm -rf dist/

# Rebuild
npm run build

# Verify dist contents
ls -la dist/
# Should see: config.js, demo-samples.js, generator.js, index.js
```

### Step 5: Test Installation

#### Local Installation Test
```bash
cd /workspace/poly-glot/cli

# Install locally (creates symlink)
npm link

# Test globally accessible command
poly-glot demo

# Test with different options
poly-glot demo --lang python
poly-glot --help

# Unlink when done testing
npm unlink -g poly-glot-ai-cli
```

#### Package Tarball Test
```bash
cd /workspace/poly-glot/cli

# Create tarball (like npm publish does)
npm pack

# This creates: poly-glot-ai-cli-1.1.0.tgz

# Install from tarball in a test directory
mkdir /tmp/test-install
cd /tmp/test-install
npm install /workspace/poly-glot/cli/poly-glot-ai-cli-1.1.0.tgz

# Test it
npx poly-glot demo

# Cleanup
cd /workspace/poly-glot/cli
rm poly-glot-ai-cli-1.1.0.tgz
rm -rf /tmp/test-install
```

### Step 6: Push to Repository

```bash
cd /workspace/poly-glot

# Push commits
git push origin main

# Push tags (if created by npm version)
git push origin --tags
```

### Step 7: Publish to npm (Optional)

**⚠️ Only for maintainers with npm publish access**

```bash
cd /workspace/poly-glot/cli

# Login to npm (one-time)
npm login

# Dry run - see what will be published
npm publish --dry-run

# Publish to npm registry
npm publish

# Verify publication
npm view poly-glot-ai-cli
```

**After publishing:**
- Package available at: https://www.npmjs.com/package/poly-glot-ai-cli
- Users can install with: `npm install -g poly-glot-ai-cli`

### Step 8: Create GitHub Release (Recommended)

1. Go to: https://github.com/hmoses/poly-glot/releases
2. Click "Draft a new release"
3. Tag: `cli-v1.1.0`
4. Title: `Poly-Glot CLI v1.1.0 - Interactive Demo Feature`
5. Description:

```markdown
## 🎬 New Feature: Interactive Demo

Try Poly-Glot risk-free with the new `poly-glot demo` command!

### What's New
- Interactive code examples in 6+ languages
- See before/after transformations instantly
- No API key required for demos
- Optional live generation with `--live` flag

### Usage
```bash
# Install/upgrade
npm install -g poly-glot-ai-cli

# Try the demo
poly-glot demo
```

### Commands
- `poly-glot demo` - Interactive language selection
- `poly-glot demo --lang javascript` - Direct language
- `poly-glot demo --lang python --live` - Live generation

See [DEMO_FEATURE.md](cli/DEMO_FEATURE.md) for details.

### Full Changelog
- feat: Add interactive demo command
- docs: Update README with demo usage
- feat: Add 6+ language sample library
```

6. Attach the tarball (optional): `poly-glot-ai-cli-1.1.0.tgz`
7. Click "Publish release"

## Post-Deployment

### 1. Verify Installation
```bash
# As a new user would
npm install -g poly-glot-ai-cli

# Test fresh install
poly-glot demo
poly-glot --version  # Should show 1.1.0
```

### 2. Update Documentation Sites

If there are external docs:
- Update poly-glot.ai website
- Update any tutorials or guides
- Announce on social media
- Update changelog

### 3. Monitor for Issues

Check for:
- Installation problems
- Bug reports
- Feature requests
- Performance issues

GitHub Issues: https://github.com/hmoses/poly-glot/issues

### 4. Announce Release

**Twitter/X:**
```
🎬 New in Poly-Glot CLI v1.1.0!

Try before you buy with the new interactive demo:
$ poly-glot demo

✨ Features:
- 6+ language examples
- No API key needed
- See transformations live
- Optional real-time generation

npm install -g poly-glot-ai-cli

#coding #developer #documentation
```

**LinkedIn:**
```
Excited to announce Poly-Glot CLI v1.1.0 with interactive demos!

Now you can experience professional code documentation generation
risk-free before using it on your projects.

Try it: poly-glot demo
```

## Rollback Plan

If critical issues are found:

### Quick Rollback
```bash
cd /workspace/poly-glot/cli

# Revert to previous version
npm version 1.0.0 --no-git-tag-version

# Republish previous version
npm publish

# Or unpublish current version (within 72 hours)
npm unpublish poly-glot-ai-cli@1.1.0
```

### Git Rollback
```bash
cd /workspace/poly-glot

# Create a revert commit
git revert HEAD

# Or reset to previous commit (destructive)
git reset --hard HEAD~1
git push origin main --force
```

## Troubleshooting Deployment

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Publish Fails - Authentication
```bash
npm logout
npm login
npm publish
```

### Publish Fails - Version Already Exists
```bash
# Bump patch version
npm version patch
npm publish
```

### Tests Fail After Build
```bash
# Check TypeScript config
cat tsconfig.json

# Verify all files compiled
ls -la dist/

# Check for missing imports
grep -r "import.*demo-samples" dist/
```

## Success Metrics

Track after deployment:
- [ ] npm downloads increase
- [ ] GitHub stars increase
- [ ] Issue reports (should be minimal)
- [ ] User feedback (Twitter, GitHub)
- [ ] Demo command usage analytics (if implemented)

## Timeline

Estimated deployment time: **30-45 minutes**

- Build & verify: 5 min
- Git commit: 5 min
- Version bump: 2 min
- Testing: 10 min
- Push to GitHub: 2 min
- npm publish: 5 min
- GitHub release: 5 min
- Verification: 5 min
- Announcement: 5 min

## Contact

For deployment questions:
- Project maintainer: Harold Moses
- Repository: https://github.com/hmoses/poly-glot
- Issues: https://github.com/hmoses/poly-glot/issues

---

**Ready to deploy? Follow the steps above and ship it! 🚀**
