# PowerShell Get-PrintJob vs DEVMODE Settings

## Quick Summary

⚠️ **PowerShell's `Get-PrintJob` does NOT show DEVMODE settings** (duplex, paper size, orientation, color mode, etc.)

✅ **Use `npm run example:inspect-devmode` instead** to see actual DEVMODE configuration

## The Confusion

Many developers expect PowerShell's `Get-PrintJob` cmdlet to show print job configuration details like:
- Duplex mode (simplex, horizontal, vertical)
- Paper size (A4, Letter, Legal, etc.)
- Orientation (portrait, landscape)
- Color mode (color, monochrome)
- Print quality
- Collation settings

**However, `Get-PrintJob` does NOT show any of these settings.**

## What Get-PrintJob Actually Shows

```powershell
PS> Get-PrintJob -PrinterName "Microsoft Print to PDF"

ComputerName    : DESKTOP-ABC123
DocumentName    : document.pdf
Datatype        : RAW
Id              : 1
JobStatus       : Normal
PagesPrinted    : 0
Position        : 1
Priority        : 1
Size            : 286898
SubmittedTime   : 11/27/2025 3:45:23 PM
TotalPages      : 0
UserName        : John Doe
```

### Fields Explained

| Field | What it Shows | What it Doesn't Show |
|-------|---------------|---------------------|
| **DocumentName** | Name of the document being printed | Print settings |
| **Datatype** | Data format (RAW, EMF, TEXT, etc.) | DEVMODE configuration |
| **Id** | Print job ID in the queue | Duplex mode |
| **JobStatus** | Current status (Normal, Paused, Error, etc.) | Paper size |
| **PagesPrinted** | Number of pages printed so far | Orientation |
| **Position** | Position in the print queue | Color mode |
| **Priority** | Job priority (1-99) | Print quality |
| **Size** | Document size in bytes | Number of copies |
| **SubmittedTime** | When job was submitted | Collation setting |
| **TotalPages** | Total pages in document | Any DEVMODE settings |
| **UserName** | User who submitted the job | - |

## Why Get-PrintJob Doesn't Show DEVMODE

### Technical Explanation

1. **Different Data Structures**
   - `Get-PrintJob` retrieves **JOB_INFO_1** or **JOB_INFO_2** Windows structures
   - DEVMODE is stored in **DEVMODE** Windows structure
   - These are separate, independent data structures

2. **Different API Calls**
   - `Get-PrintJob` uses `EnumJobs` Windows API
   - DEVMODE is accessed via `DocumentPropertiesW` or `OpenPrinterW` with `PRINTER_DEFAULTS`
   - The APIs serve different purposes

3. **Print Spooler Architecture**
   - Print spooler tracks job metadata (name, status, size, user)
   - DEVMODE is device-specific configuration (embedded in print job data)
   - Spooler passes DEVMODE to printer driver, but doesn't expose it via job queries

### Diagram: Windows Print Architecture

```
Application (Node.js)
        │
        │ Calls OpenPrinterW with PRINTER_DEFAULTS (contains DEVMODE)
        ▼
Windows Print Spooler
        │
        ├─► JOB_INFO structures ──► Get-PrintJob sees this
        │   (job metadata only)
        │
        └─► DEVMODE structure ────► Get-PrintJob CANNOT see this
            (device settings)         Only printer driver sees it
```

## How to Actually View DEVMODE Settings

### Method 1: 🌟 Use Our Inspector Tool (RECOMMENDED)

```bash
npm run example:inspect-devmode
```

**Output:**
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
```

This directly reads DEVMODE from the printer using `DocumentPropertiesW` Windows API.

### Method 2: API Monitor

Use **API Monitor** to intercept Windows API calls:

1. Download: http://www.rohitab.com/apimonitor
2. Monitor `OpenPrinterW`, `DocumentPropertiesW`, `StartDocPrinterW`
3. Expand DEVMODE structure in the Parameters pane
4. See all DEVMODE fields with actual values

### Method 3: Windows Print Queue Properties

1. Open Print Queue (`printmanagement.msc`)
2. Right-click on print job → **Properties**
3. View settings in General/Advanced/Layout tabs

**Note:** UI only shows subset of DEVMODE fields.

## Real-World Example

Let's print a document with specific settings and check what `Get-PrintJob` shows:

**Print Command:**
```typescript
await printer.print('./document.pdf', {
  copies: 3,
  duplex: 'vertical',      // Long-edge flip
  paperSize: PAPER_A4,     // A4 paper
  orientation: 'landscape',
  color: false,            // Monochrome
  quality: PRINT_QUALITY_HIGH,
  collate: true
});
```

**PowerShell Get-PrintJob:**
```powershell
PS> Get-PrintJob -PrinterName "Microsoft Print to PDF"

ComputerName    : DESKTOP-ABC123
DocumentName    : document.pdf
Datatype        : RAW
Id              : 1
JobStatus       : Normal
PagesPrinted    : 0
Position        : 1
Priority        : 1
Size            : 286898
SubmittedTime   : 11/27/2025 3:45:23 PM
TotalPages      : 0
UserName        : John Doe
```

❌ **No mention of:** copies, duplex, paper size, orientation, color, quality, or collation

**Our Inspector Tool:**
```bash
npm run example:inspect-devmode
```

```
DEVMODE Configuration:
┌─────────────────────┬────────────┐
│ Field               │ Value      │
├─────────────────────┼────────────┤
│ dmOrientation       │ 2 (Landscape) ✓
│ dmPaperSize         │ 9 (A4)     ✓
│ dmCopies            │ 3          ✓
│ dmDuplex            │ 3 (Vertical) ✓
│ dmColor             │ 1 (Monochrome) ✓
│ dmPrintQuality      │ -4 (High)  ✓
│ dmCollate           │ 1 (True)   ✓
└─────────────────────┴────────────┘
```

✅ **All settings visible!**

## Common Misconceptions

### ❌ Myth 1: "Get-PrintJob should show duplex settings"

**Reality:** `Get-PrintJob` only shows job metadata. DEVMODE settings are device-specific and not part of job info structures.

### ❌ Myth 2: "I can modify DEVMODE via Get-PrintJob"

**Reality:** You can't. DEVMODE must be set when opening the printer with `OpenPrinterW` or via print dialog.

### ❌ Myth 3: "If Get-PrintJob doesn't show settings, they're not applied"

**Reality:** Settings are applied via DEVMODE structure passed to printer driver. `Get-PrintJob` simply can't see them.

### ❌ Myth 4: "Process Monitor shows DEVMODE fields"

**Reality:** Process Monitor shows I/O operations and registry access, not API parameters. Use **API Monitor** instead.

## Summary Table

| Tool | Shows Job Metadata | Shows DEVMODE Settings | Difficulty |
|------|-------------------|----------------------|-----------|
| **PowerShell Get-PrintJob** | ✅ Yes | ❌ No | Easy |
| **npm run example:inspect-devmode** | ❌ No | ✅ Yes | Easy |
| **API Monitor** | ✅ Yes | ✅ Yes | Medium |
| **Windows Print Queue UI** | ✅ Yes | ⚠️ Partial | Easy |
| **Event Viewer** | ✅ Yes | ❌ No | Easy |
| **Process Monitor** | ⚠️ I/O only | ❌ No | Medium |

## Recommendation

**For DEVMODE verification:**
1. 🥇 **First choice:** `npm run example:inspect-devmode` (easiest, most reliable)
2. 🥈 **Second choice:** API Monitor (detailed, but requires setup)
3. 🥉 **Third choice:** Windows Print Queue Properties (UI-only, partial info)

**Don't waste time with:**
- ❌ PowerShell `Get-PrintJob` (won't show DEVMODE)
- ❌ Process Monitor (wrong tool for this job)
- ❌ Event Viewer (only shows job metadata)

## Technical References

**Windows API Documentation:**
- [JOB_INFO_1](https://docs.microsoft.com/en-us/windows/win32/printdocs/job-info-1) - What Get-PrintJob uses
- [JOB_INFO_2](https://docs.microsoft.com/en-us/windows/win32/printdocs/job-info-2) - Extended job info (still no DEVMODE)
- [DEVMODEW](https://docs.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-devmodew) - Device settings structure
- [DocumentPropertiesW](https://docs.microsoft.com/en-us/windows/win32/printdocs/documentproperties) - How to read DEVMODE
- [OpenPrinterW](https://docs.microsoft.com/en-us/windows/win32/printdocs/openprinter) - How to pass DEVMODE

**Why They're Separate:**
The Windows Print Spooler architecture intentionally separates job management (JOB_INFO) from device configuration (DEVMODE) for:
- Security: Regular users can't query detailed device settings
- Modularity: Job tracking is independent of device capabilities
- Backward compatibility: Different structure evolution paths

---

**Bottom Line:** Use `npm run example:inspect-devmode` to verify DEVMODE settings. Don't expect PowerShell to show them.
