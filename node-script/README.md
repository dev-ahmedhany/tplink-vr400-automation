# TP-Link VR400 Router Usage Scraper

A simple Node.js script that automatically scrapes usage data from a TP-Link VR400 router. This is a standalone version converted from the original Firebase Cloud Function.

## Features

- Automatically logs into the TP-Link VR400 router
- Navigates to usage statistics
- Extracts device usage data
- Resets statistics after collection
- Saves data to JSON file with timestamps
- Maintains history of scraping sessions

## Prerequisites

- Node.js 16 or higher
- TP-Link VR400 router with web interface access

## Installation

1. Clone or download this project
2. Navigate to the `node-script` directory
3. Install dependencies:

```bash
npm install
```

4. Create environment file:

```bash
cp .env.example .env
```

5. Edit `.env` file with your router details:

```
URL=http://192.168.1.1  # Your router's IP address
PASSWORD=your_password_here
```

## Usage

```bash
# Run the scraper
npm start

# Or run directly
node index.js
```

## Output

The script will:

1. Log the scraping process to the console
2. Display extracted usage data
3. Save results to `data/usage-data.json`

Example output format:

```json
[
  {
    "timestamp": "1692123456789",
    "startTime": "2023-08-15T10:30:45.123Z",
    "endTime": "2023-08-15T10:31:15.456Z",
    "data": {
      "AA:BB:CC:DD:EE:FF": {
        "usage": "1.2 GB",
        "name": "Device Name"
      }
    }
  }
]
```

## Environment Variables

- `URL` - Router web interface URL (required)
- `PASSWORD` - Router admin password (required)
- `OUTPUT_FILE` - Custom output file path (optional, defaults to `./data/usage-data.json`)
- `DEBUG` - Enable debug logging (optional)

## Automation

You can set up periodic scraping using cron:

```bash
# Run every hour
0 * * * * cd /path/to/node-script && npm run scrape
```

Or use PM2 for process management:

```bash
pm2 start index.js --name "router-scraper" --cron "0 * * * *"
```

## Error Handling

The script includes comprehensive error handling:
- Validates required environment variables
- Handles browser crashes gracefully
- Retries failed operations
- Logs detailed error information

## Troubleshooting

1. **Connection errors**: Verify router IP and network connectivity
2. **Login failures**: Check password and router accessibility
3. **Selector issues**: Router firmware updates may change web interface selectors
4. **Browser issues**: Ensure sufficient memory and disable headless mode for debugging

## Differences from Firebase Version

This standalone version:
- Uses local file storage instead of Firestore
- Includes environment variable validation
- Adds comprehensive logging
- Provides simple JavaScript implementation
- Includes data history management
- Removes Firebase-specific scheduling (use system cron instead)

## License

MIT
