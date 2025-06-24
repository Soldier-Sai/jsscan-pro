// jsscan-pro.js - Enhanced JavaScript Secrets Scanner with URL List Support and improved output

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const minimist = require('minimist');
const clipboardy = require('clipboardy');
const beautify = require('js-beautify').js;
const { table } = require('table');

// ====== CONFIGURATION ====== //
const CONFIG = {
  API_KEYS: [
    /(?:aws|amazon)[^a-z0-9]*(?:key|id|secret)[\s]*[:=][\s]*["'][a-z0-9\/+=]{20,}["']/i,
    /AIza[0-9A-Za-z\-_]{35}/,
    /sk_(live|test)_[0-9a-zA-Z]{24,}/,
    /(?:AKIA|ASIA|A3T|AGPA|AIDA|AROA|ANPA)[A-Z0-9]{16}/,
    /amzn1\.ask\.account\.[a-z0-9\-]+/i,
    /ghp_[0-9a-zA-Z]{36}/,
    /xox[baprs]-([0-9a-zA-Z]{10,48})/,
    /bot[0-9]{9}:[A-Za-z0-9_\-]{35}/
  ],
  SECRETS: [
    /["']?(password|pass|pwd|secret)["']?\s*[:=]\s*["'][^"']{6,}["']/i,
    /(?:jwt|json[_\s]?web[_\s]?token)[\s]*[:=][\s]*["']ey[a-z0-9\-_]+\.[a-z0-9\-_]+\.[a-z0-9\-_]+["']/i,
    /(?:encryption|secret)[_-]?key[\s]*[:=][\s]*["'][a-z0-9+/=]{20,}["']/i,
    /authorization["']?\s*[:=]\s*["']Bearer\s+[a-z0-9\-_.=]{10,}["']/i
  ],
  SUSPICIOUS_COMMENTS: [
    /\/\/\s*(TODO|FIXME|HACK|BUG)[^\n]*/i
  ],
  HIDDEN_PATHS: [
    /\/admin\//i,
    /\/private\//i,
    /\/internal\//i,
    /\/debug\//i,
    /\/secret\//i,
  ],
  DB_CONNECTIONS: [
    /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@[^\/]+\/[^"]+/i,
    /(?:connectionString|connStr|dbUrl)[\s]*[:=][\s]*["'][^"']+["']/i,
  ],
  OBFUSCATED: [
    /(?:base64|atob|decode)[^(]*\(['"][A-Za-z0-9+/=]+['"]\)/i,
    /(?:password|secret).*?(?:\\x[0-9a-f]{2})+/i,
    /["'][A-Fa-f0-9]{32,}["']/  // Added hex string detection
  ],
};

// ====== THEMES ====== //
const THEME = {
  critical: chalk.red.bold,
  high: chalk.magenta.bold,
  medium: chalk.yellow.bold,
  low: chalk.blue.bold,
  info: chalk.green,
  path: chalk.cyan.underline,
  line: chalk.gray,
  warning: chalk.yellow.bold,
  highlight: chalk.bgRed.white,
};

// ====== ARGUMENT PARSING ====== //
const args = minimist(process.argv.slice(2), {
  string: ['file', 'url', 'dir', 'output', 'urllist'],
  boolean: ['verbose', 'clipboard', 'save', 'stats'],
  alias: {
    f: 'file',
    u: 'url',
    d: 'dir',
    o: 'output',
    v: 'verbose',
    p: 'clipboard',
    s: 'save',
    t: 'stats',
    l: 'urllist'
  },
  default: {
    timeout: 10000
  }
});

// ====== MAIN FUNCTION ====== //
async function main() {
  try {
    if (!args.file && !args.url && !args.dir && !args.urllist) return showHelp();

    let results = [];
    if (args.file) results = scanFile(args.file);
    else if (args.url) results = await scanUrl(args.url);
    else if (args.dir) results = scanDirectory(args.dir);
    else if (args.urllist) results = await scanUrlList(args.urllist);

    displayResults(results);

    if (args.save || args.output) saveResults(results, args.output || 'jsscan_report.json');
    if (args.clipboard) await copyToClipboard(results);
  } catch (e) {
    console.error(THEME.critical('ERROR:'), e.message);
    if (args.verbose) console.error(e.stack);
  }
}

// ====== URL SCANNING FUNCTIONS ====== //
async function scanUrl(url) {
  try {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    const response = await axios.get(url, {
      timeout: args.timeout,
      headers: {
        'User-Agent': 'JSScan-Pro/1.0 (+https://github.com/yourusername/jsscan-pro)'
      },
      validateStatus: status => status >= 200 && status < 400,
    });

    if (!response.data || typeof response.data !== 'string') {
      throw new Error('No JavaScript content found');
    }

    return scanContent(beautify(response.data), url);
  } catch (error) {
    console.error(THEME.warning(`⚠️  URL Scan Failed (${url}): ${error.message}`));
    return [];
  }
}

async function scanUrlList(filePath) {
  try {
    const urls = fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && !url.startsWith('#'));

    let allResults = [];
    
    for (const url of urls) {
      try {
        console.log(THEME.info(`🔍 Scanning ${url}`));
        const urlResults = await scanUrl(url);
        allResults.push(...urlResults);
      } catch (e) {
        console.error(THEME.warning(`⚠️  Failed to scan ${url}: ${e.message}`));
      }
    }

    return allResults;
  } catch (error) {
    console.error(THEME.critical('Error reading URL list:'), error.message);
    return [];
  }
}

// ====== FILE SYSTEM FUNCTIONS ====== //
function scanFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const content = filePath.endsWith('.min.js') ? beautify(raw) : raw;
    return scanContent(content, filePath);
  } catch (error) {
    console.error(THEME.critical(`Error reading file ${filePath}:`), error.message);
    return [];
  }
}

function scanDirectory(dirPath) {
  const results = [];
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...scanDirectory(fullPath));
        } else if (file.endsWith('.js')) {
          results.push(...scanFile(fullPath));
        }
      } catch (error) {
        console.error(THEME.warning(`⚠️  Skipping ${fullPath}: ${error.message}`));
      }
    }
  } catch (error) {
    console.error(THEME.critical(`Error reading directory ${dirPath}:`), error.message);
  }
  return results;
}

// ====== SCANNING LOGIC ====== //
function shannonEntropy(str) {
  const map = {};
  for (const ch of str) map[ch] = (map[ch] || 0) + 1;
  const len = str.length;
  return -Object.values(map).map(f => f / len).reduce((acc, p) => acc + p * Math.log2(p), 0);
}

function scanContent(content, source) {
  const results = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    for (const [category, patterns] of Object.entries(CONFIG)) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          results.push({
            type: category.toUpperCase(),
            source,
            line: i + 1,
            match: match[0],
            severity: getSeverity(category),
          });
        }
      }
    }
    // Entropy detection on tokens in line
    const tokens = line.split(/\W+/);
    tokens.forEach(token => {
      if (token.length > 20 && shannonEntropy(token) > 4.0) {
        results.push({
          type: 'ENTROPY',
          source,
          line: i + 1,
          match: token,
          severity: 'high'
        });
      }
    });
  });
  return results;
}

function getSeverity(category) {
  return {
    API_KEYS: 'critical',
    SECRETS: 'high',
    HIDDEN_PATHS: 'medium',
    DB_CONNECTIONS: 'high',
    OBFUSCATED: 'critical',
    SUSPICIOUS_COMMENTS: 'medium',
    ENTROPY: 'high'
  }[category] || 'medium';
}

// ====== OUTPUT FUNCTIONS ====== //
function displayResults(results) {
  if (results.length === 0) {
    console.log(THEME.info('✅ No sensitive data found!'));
    return;
  }

  // Group results by source exactly (URLs or file paths)
  const resultsBySource = {};
  results.forEach(r => {
    if (!resultsBySource[r.source]) resultsBySource[r.source] = [];
    resultsBySource[r.source].push(r);
  });

  for (const [source, entries] of Object.entries(resultsBySource)) {
    // Print source heading with color
    console.log(THEME.path(`\n📁 Source: ${source}`));

    // Print a neat underline (match source length or 40 chars max)
    const lineLen = Math.min(40, source.length + 10);
    console.log('─'.repeat(lineLen));

    // Prepare table data with colored header row
    const tableData = [
      [
        THEME.line('Line'),
        chalk.bold('Type'),        // Make header bold and default color
        chalk.bold('Match')
      ],
      ...entries.map(r => [
        THEME.line(r.line.toString()),         // Colored line numbers
        THEME[r.severity](r.type),             // colored type by severity
        r.match
      ]),
    ];

    // Print table with default box style from `table` package
    console.log(table(tableData));
  }

  // Print overall statistics if requested
  if (args.stats) {
    console.log(THEME.info('\n📊 Overall Scan Statistics:'));
    console.log(`🔴 Critical: ${results.filter(r => r.severity === 'critical').length}`);
    console.log(`🟠 High: ${results.filter(r => r.severity === 'high').length}`);
    console.log(`🟡 Medium: ${results.filter(r => r.severity === 'medium').length}`);
  }
}


function saveResults(results, outPath) {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      stats: {
        critical: results.filter(r => r.severity === 'critical').length,
        high: results.filter(r => r.severity === 'high').length,
        medium: results.filter(r => r.severity === 'medium').length,
      },
      results
    };
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(THEME.info(`💾 Report saved to ${outPath}`));
  } catch (error) {
    console.error(THEME.critical('Error saving report:'), error.message);
  }
}

async function copyToClipboard(results) {
  try {
    await clipboardy.write(results.map(r => `${r.source}:${r.line} - ${r.match}`).join('\n'));
    console.log(THEME.info('📋 Results copied to clipboard!'));
  } catch (error) {
    console.error(THEME.warning('⚠️  Failed to copy to clipboard:'), error.message);
  }
}

function showHelp() {
  console.log(`
${THEME.info('JSScan Pro - Enhanced JavaScript Secrets Scanner')}

Usage:
  node jsscan-pro.js --file <file> [options]
  node jsscan-pro.js --url <url> [options]
  node jsscan-pro.js --dir <directory> [options]
  node jsscan-pro.js --urllist <file> [options]

Options:
  --file, -f      Scan a local JS file
  --url, -u       Scan a remote JS file
  --dir, -d       Scan a directory recursively
  --urllist, -l   Scan multiple URLs from a text file (one URL per line)
  --output, -o    Save results to JSON file
  --clipboard, -p Copy results to clipboard
  --verbose, -v   Show context around findings
  --stats, -t     Show summary statistics
  --save, -s      Save results (same as --output)
  --timeout       HTTP request timeout in ms (default: 10000)

Examples:
  # Scan a single URL
  node jsscan-pro.js -u https://example.com/app.js

  # Scan multiple URLs from a file
  node jsscan-pro.js -l urls.txt -o results.json

  # Scan a local directory with stats
  node jsscan-pro.js -d ./src -t
`);
}

main();
