#!/usr/bin/env node
/**
 * Poly-Glot CLI v1.9.0
 * AI-powered code comment generation, bug finding, refactoring, and test generation.
 *
 * Usage:
 *   poly-glot comment <file>                        # Doc-comment a file (default mode)
 *   poly-glot comment <file> --why                  # Add why-comments instead
 *   poly-glot comment <file> --both                 # Doc + why in one two-pass run
 *   poly-glot comment <file> --dry-run              # Preview changes without writing
 *   poly-glot comment <file> --diff                 # Show unified diff of changes
 *   poly-glot comment <file> --backup               # Save .orig backup before overwriting
 *   poly-glot comment --dir <dir> --changed          # Comment only new/modified files (free)
 *   poly-glot comment --dir <dir>                   # Comment all supported files (Pro)
 *   poly-glot comment --dir <dir> --yes             # Skip confirmation prompt
 *   poly-glot why <file>                            # Shorthand for --why
 *   poly-glot bugs <file>                           # Find bugs, edge cases, null derefs
 *   poly-glot refactor <file>                       # Suggest refactors with before/after diffs
 *   poly-glot test <file>                           # Generate unit tests
 *   poly-glot explain <file>                        # Deep code analysis
 *   poly-glot config                                # Interactive setup
 *   poly-glot config --key <key> --provider openai  # Non-interactive setup
 */

import * as fs             from 'fs';
import * as path           from 'path';
import * as os             from 'os';
import * as http           from 'http';
import * as readline       from 'readline';
import { execSync }        from 'child_process';
import { PolyGlotGenerator, WhyResult, BothResult, BugsResult, RefactorResult, TestResult } from './generator';
import { CommentMode } from './config';
import { loadConfig, saveConfig, Config } from './config';
import { DEMO_SAMPLES, getSampleLanguages } from './demo-samples';
import { ping } from './telemetry';
import { assertQuota, hasRemainingQuota, incrementUsage, FREE_MONTHLY_LIMIT, earlyBirdLine } from './usage';
