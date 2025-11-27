# Testing DEVMODE Configuration on Windows

This guide explains how to verify that print settings (DEVMODE) are correctly applied when printing on Windows.

## What is DEVMODE?

**DEVMODE** is a Windows structure that contains all device-specific settings for a printer:
- Number of copies
- Duplex mode (simplex, horizontal, vertical)
- Paper size (A4, Letter, Legal, etc.)
- Paper source/tray
- Orientation (portrait, landscape)
- Color mode (color, monochrome)
- Print quality
- Collation

## The Problem (Fixed in v1.0.1)

**Before v1.0.1:**
- DEVMODE was being created but never passed to Windows API
- Print options were ignored by the printer
- All jobs printed with default settings

**After v1.0.1:**
- DEVMODE is correctly configured via `DocumentPropertiesW`
- DEVMODE is passed via `PRINTER_DEFAULTS` when opening printer
- All print settings are properly applied

## How to Verify DEVMODE Settings

### Method 1: 🌟 DEVMODE Inspector (RECOMMENDED)

The most reliable way to verify DEVMODE configuration:

```bash
npm run example:inspect-devmode
```

**What it does:**
1. Calls `DocumentPropertiesW` to read DEVMODE directly from printer
2. Displays all DEVMODE fields with their values
3. Shows exactly what settings the printer driver is using

**Example Output:**
```
=== DEVMODE Inspector ===

Printer: Microsoft Print to PDF

DEVMODE Configuration:
┌─────────────────────┬────────────┐
│ Field               │ Value      │
├─────────────────────┼────────────┤
│ dmOrientation       │ 1 (Portrait) │
│ dmPaperSize         │ 9 (A4)     │
│ dmCopies            │ 3          │
│ dmDuplex            │ 3 (Vertical) │
│ dmColor             │ 2 (Color)  │
│ dmPrintQuality      │ -4 (High)  │
│ dmCollate           │ 1 (True)   │
└─────────────────────┴────────────┘

✓ DEVMODE successfully read from printer driver
```

### Method 2: Test DEVMODE Application

Test print job submission with various DEVMODE configurations:

```bash
npm run example:test-devmode
```

**What it does:**
1. Tests printing with different option combinations
2. Verifies job submission to print spooler
3. Checks that no errors occur during DEVMODE configuration

**Example Output:**
```
=== DEVMODE Configuration Test ===

✓ Test 1: Default settings
  Bytes sent: 286898
  Status: Success

✓ Test 2: 3 copies, duplex vertical, A4
  Bytes sent: 286898
  Status: Success

✓ Test 3: Landscape, color, high quality
  Bytes sent: 286898
  Status: Success

All tests passed! DEVMODE is being correctly configured.
```

### Method 3: Windows Print Queue

View print job properties in Windows:

1. Open Windows Print Queue:
   - Press `Win + R`
   - Type `printmanagement.msc`
   - Or: Settings → Devices → Printers & scanners → Open queue

2. Submit a print job:
   ```bash
   npm run example:simple
   ```

3. Right-click on the print job → **Properties**

4. Check the settings:
   - **General** tab: Number of copies
   - **Advanced** tab: Paper size, orientation
   - **Layout** tab: Duplex settings

**Note:** Microsoft Print to PDF may not show all DEVMODE settings in the UI.

### Method 4: PowerShell Get-PrintJob ⚠️

**IMPORTANT:** PowerShell's `Get-PrintJob` does **NOT** show DEVMODE settings.

```powershell
Get-PrintJob -PrinterName "Microsoft Print to PDF"
```

**What it shows:**
- Job ID, Name, Status
- Document name
- User who submitted the job
- Time submitted
- Total pages

**What it does NOT show:**
- Duplex mode ❌
- Paper size ❌
- Orientation ❌
- Color mode ❌
- Print quality ❌
- Any DEVMODE settings ❌

See [GET-PRINTJOB-VS-DEVMODE.md](GET-PRINTJOB-VS-DEVMODE.md) for detailed explanation.

### Method 5: API Monitor (Advanced)

**API Monitor** is a tool that intercepts and displays Windows API calls with their parameters.

**Download:** http://www.rohitab.com/apimonitor

**Setup:**
1. Download and install API Monitor (64-bit version recommended)
2. Run API Monitor as Administrator
3. In the API Filter, expand **Printers and Print Spooler**
4. Check these functions:
   - `OpenPrinterW`
   - `DocumentPropertiesW`
   - `StartDocPrinterW`
   - `WritePrinter`
   - `ClosePrinter`

**Monitor Print Job:**
1. Click **Monitor** → **Monitor New Process**
2. Browse to: `C:\Program Files\nodejs\node.exe`
3. Arguments: `--import tsx examples/simple-print.ts`
4. Working Directory: Your project path
5. Click **OK**

**What to look for:**
- `OpenPrinterW` should show `PRINTER_DEFAULTS` structure with `pDevMode` pointer
- `DocumentPropertiesW` should be called with `DM_IN_BUFFER | DM_OUT_BUFFER` flags
- `StartDocPrinterW` should show document information
- `WritePrinter` should show PDF data being sent

**DEVMODE Structure in API Monitor:**
When you click on `OpenPrinterW` or `DocumentPropertiesW`, you can expand the DEVMODE structure to see:
```
DEVMODEW
├─ dmDeviceName: "Microsoft Print to PDF"
├─ dmCopies: 3
├─ dmOrientation: 1 (Portrait)
├─ dmPaperSize: 9 (A4)
├─ dmDuplex: 3 (Vertical)
├─ dmColor: 2 (Color)
└─ dmPrintQuality: -4 (High)
```

### Method 6: Windows Event Viewer

Check Windows event logs for print job details:

1. Open Event Viewer:
   - Press `Win + R`
   - Type `eventvwr.msc`
   - Enter

2. Navigate to:
   ```
   Applications and Services Logs
   └── Microsoft
       └── Windows
           └── PrintService
               └── Operational
   ```

3. Look for events with:
   - **Event ID 307**: Print job submitted
   - **Event ID 805**: Print job rendered
   - **Event ID 842**: Print job completed

4. Event details show:
   - Document name
   - Printer name
   - User
   - Total pages
   - Data size

**Note:** Event logs show job metadata but not detailed DEVMODE settings.

## Testing Checklist

Use this checklist to verify DEVMODE is working:

### Basic Tests
- [ ] Run `npm run example:inspect-devmode` successfully
- [ ] DEVMODE shows configured values (copies, duplex, paper size)
- [ ] No errors when opening printer with DEVMODE
- [ ] Print job submits successfully

### Print Options Tests
- [ ] **Copies**: Print with 2, 3, 5 copies
  ```typescript
  await printer.print('./doc.pdf', { copies: 3 });
  ```
- [ ] **Duplex**: Test simplex, horizontal, vertical
  ```typescript
  await printer.print('./doc.pdf', { duplex: 'vertical' });
  ```
- [ ] **Paper Size**: Test A4, Letter, Legal
  ```typescript
  await printer.print('./doc.pdf', { paperSize: PAPER_A4 });
  ```
- [ ] **Orientation**: Test portrait and landscape
  ```typescript
  await printer.print('./doc.pdf', { orientation: 'landscape' });
  ```
- [ ] **Color**: Test color and monochrome
  ```typescript
  await printer.print('./doc.pdf', { color: false }); // monochrome
  ```

### Edge Cases
- [ ] Print with default settings (no options)
- [ ] Print with all options specified
- [ ] Print to different printers
- [ ] Print with invalid options (should use defaults)

## Common Issues

### "Failed to configure DEVMODE"

**Cause:** Printer driver rejected the DEVMODE configuration

**Solution:**
1. Check that printer supports requested feature (e.g., duplex)
2. Verify printer is online and ready
3. Try with default settings first
4. Update printer driver if outdated

### "OpenPrinterW failed"

**Cause:** Cannot open printer handle

**Solution:**
1. Verify printer name is correct
2. Check printer is not paused or offline
3. Ensure you have print permissions
4. Restart Print Spooler service: `net stop spooler && net start spooler`

### Settings Not Applied

**Cause:** DEVMODE not properly configured or passed

**Solution:**
1. Run `npm run example:inspect-devmode` to verify DEVMODE reading
2. Check that you're using v1.0.1 or later (fixed in this version)
3. Verify printer driver supports the requested settings
4. Check Windows Event Viewer for errors

## Technical Details

### How DEVMODE is Applied (v1.0.1+)

```typescript
// 1. Get printer's default DEVMODE
const devModeSize = DocumentPropertiesW(null, hPrinter, printerName, null, null, 0);
const devMode = Buffer.alloc(devModeSize);
DocumentPropertiesW(null, hPrinter, printerName, devMode, null, DM_OUT_BUFFER);

// 2. Modify DEVMODE with user options
if (options.copies) {
  devMode.dmCopies = options.copies;
  devMode.dmFields |= DM_COPIES;
}
if (options.duplex) {
  devMode.dmDuplex = getDuplexValue(options.duplex);
  devMode.dmFields |= DM_DUPLEX;
}
// ... more options

// 3. Validate DEVMODE with printer driver
DocumentPropertiesW(null, hPrinter, printerName, devMode, devMode, DM_IN_BUFFER | DM_OUT_BUFFER);

// 4. Open printer with configured DEVMODE
const printerDefaults = {
  pDatatype: null,
  pDevMode: devMode,
  DesiredAccess: PRINTER_ALL_ACCESS
};
OpenPrinterW(printerName, hPrinter, printerDefaults);
```

### DEVMODE Structure Size

DEVMODE is **220 bytes** on modern Windows (DEVMODEW):
- Fixed fields: 156 bytes
- Private driver data: Variable (dmDriverExtra field)

Always use `DocumentPropertiesW` with size query (passing 0) to get correct size.

### DEVMODE Fields Bitmask

The `dmFields` member indicates which fields are valid:
```typescript
DM_ORIENTATION   = 0x00000001  // dmOrientation
DM_PAPERSIZE     = 0x00000002  // dmPaperSize
DM_COPIES        = 0x00000100  // dmCopies
DM_DUPLEX        = 0x00001000  // dmDuplex
DM_COLOR         = 0x00000800  // dmColor
DM_PRINTQUALITY  = 0x00000400  // dmPrintQuality
DM_COLLATE       = 0x00008000  // dmCollate
```

Set the corresponding bit when modifying a field.

## Conclusion

✅ **DEVMODE configuration is now working correctly** as of v1.0.1

✅ **Use `npm run example:inspect-devmode`** as primary verification method

✅ **All print settings are properly applied** via PRINTER_DEFAULTS structure

For more technical details, see:
- [Windows DEVMODE documentation](https://docs.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-devmodew)
- [DocumentPropertiesW function](https://docs.microsoft.com/en-us/windows/win32/printdocs/documentproperties)
- [OpenPrinterW function](https://docs.microsoft.com/en-us/windows/win32/printdocs/openprinter)
