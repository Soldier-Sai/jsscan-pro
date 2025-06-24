# JSScan Pro - JavaScript Secrets Scanner

JSScan Pro is an enhanced JavaScript secrets scanning tool that detects API keys, passwords, tokens, hidden paths, database connections, suspicious comments, and more in JavaScript files and URLs.

## Features

- Scan local JS files, directories recursively, remote JS URLs, and URL lists
- Detects API keys, secrets, hidden/internal paths, database connection strings, obfuscated secrets
- Detects suspicious comments (TODO, FIXME, etc.)
- Detects entropy-based token-like strings
- Outputs color-coded, detailed results
- Save results to JSON file or copy to clipboard
- Shows scan summary statistics

## Usage

```bash
# Scan a local JavaScript file
node jsscan-pro.js --file ./example.js

# Scan a directory recursively
node jsscan-pro.js --dir ./src

# Scan a remote JS URL
node jsscan-pro.js --url https://example.com/script.js

# Scan multiple URLs from a list file
node jsscan-pro.js --urllist urls.txt

# Save results to a JSON file and show stats
node jsscan-pro.js --file ./example.js --output results.json --stats
```

## Installation

Make sure you have Node.js installed.

Install dependencies:

```bash
npm install chalk axios minimist clipboardy js-beautify table
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License.
