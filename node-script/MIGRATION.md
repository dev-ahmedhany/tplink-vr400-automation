# Data Migration

This script migrates your existing usage data from the old format to the new optimized format.

## What it does

- **Old format**: Each entry stored both usage and device name together
  ```json
  {
    "data": {
      "AA:BB:CC:DD:EE:FF": {
        "usage": "150M",
        "name": "iPhone"
      }
    }
  }
  ```

- **New format**: Separates usage data and device names into different files
  - `usage-data.json`: Contains only usage values
  - `devices.json`: Contains device name mappings

## How to run

### Option 1: Using npm script (recommended)
```bash
cd node-script
npm run migrate
```

### Option 2: Direct execution
```bash
cd node-script
node migrate-data.js
```

### Option 3: Make executable and run
```bash
cd node-script
chmod +x migrate-data.js
./migrate-data.js
```

## What happens during migration

1. **Backup**: Creates `usage-data.backup.json` with your original data
2. **Extract**: Separates device names from usage data
3. **Convert**: Transforms usage data to new format
4. **Save**: Creates/updates both `usage-data.json` and `devices.json`
5. **Report**: Shows migration statistics including file size reduction

## Safety features

- ✅ Creates automatic backup before migration
- ✅ Detects if data is already migrated (won't run twice)
- ✅ Atomic file writes (prevents corruption)
- ✅ Merges with existing devices file if present
- ✅ Detailed progress and error reporting

## Benefits of new format

- 📦 **Smaller files**: Removes duplicate device names from each entry
- 🚀 **Better performance**: Faster parsing and processing
- 🔄 **Persistent device names**: Device names survive data cleanup
- 📊 **Cleaner data**: Separates concerns (usage vs metadata)

## Recovery

If something goes wrong, you can restore from backup:

```bash
cd node-script/data
cp usage-data.backup.json usage-data.json
```

## Example output

```
🔄 Starting data migration...
📖 Reading old data file...
📊 Found 1440 entries to migrate
💾 Creating backup of original data...
✅ Backup created: /path/to/data/usage-data.backup.json
🔧 Migrating data format...
   Processed 1440/1440 entries...
📱 Found 12 device names in migration
📱 Total devices after merge: 12
💾 Saving migrated data...
✅ Migration completed successfully!

📊 Migration Summary:
   Entries migrated: 1440
   Device names extracted: 12
   Total unique devices: 12
   Original file size: 2.45 MB
   New file size: 1.23 MB
   Size reduction: 49.8%

📁 Files created:
   Backup: /path/to/data/usage-data.backup.json
   Usage data: /path/to/data/usage-data.json
   Devices: /path/to/data/devices.json

🎉 You can now restart your server to use the new data format!
```
