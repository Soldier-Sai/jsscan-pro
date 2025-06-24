
# JSScan Pro - Enhanced JavaScript Secrets Scanner

A powerful tool to scan JavaScript files and URLs for exposed sensitive information, secrets, API keys, suspicious comments, and more.

---

## Features

- Scan local JS files, directories, remote JS files, or multiple URLs from a list  
- Detect API keys, secrets, hidden paths, database connections, obfuscated data, suspicious comments, and entropy-based tokens  
- Save results as JSON reports  
- Copy results directly to clipboard  
- Colorful and clear output for easy readability  
- Verbose mode to show context around findings  
- Scan timeout configuration  

---

## Prerequisites

- Node.js v12 or higher  
- npm (Node Package Manager)

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Soldier-Sai/jsscan-pro
   cd jsscan-pro
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the scanner:**

   Use `node jsscan-pro.js` with the options described below.

---

## Usage

```bash
node jsscan-pro.js [options]
```

### Options

| Option          | Alias | Description                                     |
|-----------------|-------|------------------------------------------------|
| --file          | -f    | Scan a local JS file                            |
| --url           | -u    | Scan a remote JS file via URL                   |
| --dir           | -d    | Scan a directory recursively for JS files     |
| --urllist       | -l    | Scan multiple URLs listed in a text file       |
| --output        | -o    | Save results to JSON report file                |
| --clipboard     | -p    | Copy results to clipboard                        |
| --verbose       | -v    | Show lines around findings for context          |
| --stats         | -t    | Show summary statistics                          |
| --save          | -s    | Alias for --output                               |
| --timeout       |       | HTTP request timeout in milliseconds (default: 10000) |

---

### Examples

- Scan a local file:

  ```bash
  node jsscan-pro.js -f ./test.js
  ```

- Scan a remote URL:

  ```bash
  node jsscan-pro.js -u https://example.com/app.js
  ```

- Scan a directory recursively:

  ```bash
  node jsscan-pro.js -d ./src
  ```

- Scan multiple URLs from a list file:

  ```bash
  node jsscan-pro.js -l urls.txt
  ```

- Save output to JSON file:

  ```bash
  node jsscan-pro.js -f ./test.js -o report.json
  ```

- Copy scan results to clipboard:

  ```bash
  node jsscan-pro.js -f ./test.js -p
  ```

- Show verbose context:

  ```bash
  node jsscan-pro.js -f ./test.js -v
  ```

- Show summary statistics:

  ```bash
  node jsscan-pro.js -d ./src -t
  ```

---

## Sample Output

```plaintext
📁 Source: https://example.com/file1.js
─────────────────────────────────────
┌──────┬────────────┬─────────────────────────────┐
│ Line │ Type       │ Match                       │
├──────┼────────────┼─────────────────────────────┤
│ 42   │ API_KEYS   │ AKIAIOSFODNN7EXAMPLE        │
│ 87   │ SECRETS    │ password="P@ssw0rd123"      │
└──────┴────────────┴─────────────────────────────┘

📁 Source: https://example.com/file2.js
─────────────────────────────────────
┌──────┬────────────┬─────────────────────────────┐
│ Line │ Type       │ Match                       │
├──────┼────────────┼─────────────────────────────┤
│ 15   │ DB_CONNECTIONS │ mongodb://admin:pwd@localhost │
└──────┴────────────┴─────────────────────────────┘

📊 Overall Scan Statistics:
🔴 Critical: 1
🟠 High: 2
🟡 Medium: 0
```

---

## Contributing

Feel free to submit issues or pull requests! Suggestions for new detection patterns and features are welcome.

---

## License

MIT License

---
