# Automatic CSV Export Setup

This guide explains how to set up automatic CSV exports every 5 minutes.

## Setup

1. **Configure the API endpoint** (optional):
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set `EXPORT_API_URL` to your actual endpoint if different from localhost.

2. **Test the export**:
   ```bash
   node auto-export.js
   ```
   You should see a CSV file appear in `csv-downloads/` folder immediately.

## Running the Service

### Option 1: Run in Terminal (Development)

```bash
node auto-export.js
```

This will:
- Download a CSV immediately
- Continue downloading every 5 minutes
- Save files to `csv-downloads/` folder
- Keep running until you press Ctrl+C

### Option 2: Run in Background (macOS/Linux)

```bash
nohup node auto-export.js > export.log 2>&1 &
```

To stop it later:
```bash
ps aux | grep auto-export
kill [PID]
```

### Option 3: Run as System Service (Production)

#### Using PM2 (Recommended)

1. Install PM2:
```bash
npm install -g pm2
```

2. Start the service:
```bash
pm2 start auto-export.js --name "csv-export"
```

3. Make it auto-start on boot:
```bash
pm2 startup
pm2 save
```

4. Monitor the service:
```bash
pm2 status
pm2 logs csv-export
```

5. Stop the service:
```bash
pm2 stop csv-export
```

#### Using launchd (macOS)

Create a file at `~/Library/LaunchAgents/com.internetawards.csvexport.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.internetawards.csvexport</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/your/internet-awards/auto-export.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/csv-export.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/csv-export-error.log</string>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.internetawards.csvexport.plist
```

## Configuration

Edit `auto-export.js` to customize:

- **Export Interval**: Change `EXPORT_INTERVAL` (default: 5 minutes)
- **Download Folder**: Change `DOWNLOAD_FOLDER` path
- **API URL**: Update `API_URL` if your server runs on a different port
- **File Retention**: Modify cleanup logic (default: keeps last 100 files)

## Output

Files are saved as: `nominations-YYYY-MM-DDTHH-MM-SS-mmmZ.csv`

Example: `csv-downloads/nominations-2026-01-24T10-25-30-123Z.csv`

## Monitoring

Check the console output or logs for:
- ✅ Successful downloads
- ❌ Errors (network issues, API problems)
- 🗑️ Old file cleanup notifications

## Troubleshooting

**Problem**: "Connection refused" error

**Solution**: Make sure your Devvit app server is running. The script connects to `http://localhost:3000/api/export-csv`

**Problem**: Empty or invalid CSV files

**Solution**: Check that nominations exist in your app and the export endpoint is working

**Problem**: Too many files

**Solution**: The script auto-deletes old files, keeping the most recent 100. Adjust this number in the `cleanupOldFiles()` function if needed.

## Notes

- The CSV files are excluded from git (via `.gitignore`)
- The script will continue running even if individual downloads fail
- Timestamps are in ISO 8601 format (UTC timezone)
- Each file is independent - no incremental exports
