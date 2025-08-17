#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const OLD_DATA_FILE = path.join(DATA_DIR, 'usage-data.json');
const NEW_DATA_FILE = path.join(DATA_DIR, 'usage-data.json');
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');
const BACKUP_FILE = path.join(DATA_DIR, 'usage-data.backup.json');

console.log('🔄 Starting data migration...');

// Check if data directory exists
if (!fs.existsSync(DATA_DIR)) {
  console.log('❌ Data directory does not exist:', DATA_DIR);
  process.exit(1);
}

// Check if old data file exists
if (!fs.existsSync(OLD_DATA_FILE)) {
  console.log('❌ No data file found to migrate:', OLD_DATA_FILE);
  process.exit(1);
}

try {
  // Read the old data
  console.log('📖 Reading old data file...');
  const oldDataContent = fs.readFileSync(OLD_DATA_FILE, 'utf8');
  const oldData = JSON.parse(oldDataContent);
  
  console.log(`📊 Found ${oldData.length} entries to migrate`);
  
  // Create backup
  console.log('💾 Creating backup of original data...');
  fs.writeFileSync(BACKUP_FILE, oldDataContent);
  console.log(`✅ Backup created: ${BACKUP_FILE}`);
  
  // Initialize new data structures
  const newData = [];
  const allDevices = {};
  
  // Check if this data needs migration
  let needsMigration = false;
  
  // Check a few entries to see if they have the old format
  for (let i = 0; i < Math.min(3, oldData.length); i++) {
    const entry = oldData[i];
    if (entry.data) {
      const firstMac = Object.keys(entry.data)[0];
      if (firstMac && entry.data[firstMac] && typeof entry.data[firstMac] === 'object' && entry.data[firstMac].usage !== undefined) {
        needsMigration = true;
        break;
      }
    }
  }
  
  if (!needsMigration) {
    console.log('✅ Data is already in the new format, no migration needed!');
    process.exit(0);
  }
  
  console.log('🔧 Migrating data format...');
  
  // Process each entry
  oldData.forEach((entry, index) => {
    const newEntry = {
      timestamp: entry.timestamp,
      startTime: entry.startTime,
      endTime: entry.endTime,
      data: {}
    };
    
    if (entry.data) {
      Object.entries(entry.data).forEach(([mac, deviceInfo]) => {
        if (typeof deviceInfo === 'object' && deviceInfo.usage !== undefined) {
          // Old format: { usage: "150M", name: "iPhone" }
          newEntry.data[mac] = deviceInfo.usage; // Store only usage value
          
          // Collect device name if it's not "null"
          if (deviceInfo.name && deviceInfo.name !== "null") {
            allDevices[mac] = deviceInfo.name;
          }
        } else {
          // Already new format or invalid data
          newEntry.data[mac] = deviceInfo;
        }
      });
    }
    
    newData.push(newEntry);
    
    // Progress indicator
    if ((index + 1) % 100 === 0 || index === oldData.length - 1) {
      console.log(`   Processed ${index + 1}/${oldData.length} entries...`);
    }
  });
  
  // Check if devices file already exists and merge
  let existingDevices = {};
  if (fs.existsSync(DEVICES_FILE)) {
    console.log('📱 Found existing devices file, merging data...');
    try {
      const existingDevicesContent = fs.readFileSync(DEVICES_FILE, 'utf8');
      existingDevices = JSON.parse(existingDevicesContent);
    } catch (error) {
      console.log('⚠️  Warning: Could not read existing devices file, creating new one');
    }
  }
  
  // Merge devices (new devices take priority)
  const finalDevices = { ...existingDevices, ...allDevices };
  
  console.log(`📱 Found ${Object.keys(allDevices).length} device names in migration`);
  console.log(`📱 Total devices after merge: ${Object.keys(finalDevices).length}`);
  
  // Write new data files atomically
  console.log('💾 Saving migrated data...');
  
  // Write usage data
  const tempDataFile = NEW_DATA_FILE + '.tmp';
  fs.writeFileSync(tempDataFile, JSON.stringify(newData, null, 2));
  fs.renameSync(tempDataFile, NEW_DATA_FILE);
  
  // Write devices data
  const tempDevicesFile = DEVICES_FILE + '.tmp';
  fs.writeFileSync(tempDevicesFile, JSON.stringify(finalDevices, null, 2));
  fs.renameSync(tempDevicesFile, DEVICES_FILE);
  
  // Calculate file size reduction
  const oldSize = fs.statSync(BACKUP_FILE).size;
  const newSize = fs.statSync(NEW_DATA_FILE).size;
  const reduction = ((oldSize - newSize) / oldSize * 100).toFixed(1);
  
  console.log('✅ Migration completed successfully!');
  console.log('');
  console.log('📊 Migration Summary:');
  console.log(`   Entries migrated: ${newData.length}`);
  console.log(`   Device names extracted: ${Object.keys(allDevices).length}`);
  console.log(`   Total unique devices: ${Object.keys(finalDevices).length}`);
  console.log(`   Original file size: ${(oldSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   New file size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Size reduction: ${reduction}%`);
  console.log('');
  console.log('📁 Files created:');
  console.log(`   Backup: ${BACKUP_FILE}`);
  console.log(`   Usage data: ${NEW_DATA_FILE}`);
  console.log(`   Devices: ${DEVICES_FILE}`);
  console.log('');
  console.log('🎉 You can now restart your server to use the new data format!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('');
  console.error('🔄 To restore from backup:');
  console.error(`   cp "${BACKUP_FILE}" "${OLD_DATA_FILE}"`);
  process.exit(1);
}
