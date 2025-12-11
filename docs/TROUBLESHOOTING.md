# Troubleshooting Guide

## Common Issues

### Installation Issues

#### Issue: "Cannot find module 'windows-pdf-printer-native'"

**Solution:**
```bash
# Ensure package is installed
npm install windows-pdf-printer-native

# Verify installation
npm list windows-pdf-printer-native
```

#### Issue: "PDFium library not found"

The PDFium library (`pdfium.dll`) is included in the npm package. If you see this error:

**Solution:**
```bash
# Reinstall the package
npm uninstall windows-pdf-printer-native
npm install windows-pdf-printer-native

# Verify pdfium.dll exists
# Should be at: node_modules/windows-pdf-printer-native/bin/pdfium.dll
```

### Printer Issues

#### Issue: "Printer not found"

**Symptoms:**
```
Error: Printer "HP LaserJet Pro" not found
```

**Solutions:**

1. **List available printers:**
   ```typescript
   import { PrinterManager } from 'windows-pdf-printer-native';
   
   const printers = await PrinterManager.getAvailablePrinters();
   console.log('Available printers:');
   printers.forEach(p => console.log(`  - ${p.name}`));
   ```

2. **Use exact printer name:**
   ```typescript
   // Printer names are case-sensitive and must match exactly
   const printer = new PDFPrinter('HP LaserJet Pro M404dn');
   ```

3. **Use default printer:**
   ```typescript
   // Let the system choose
   const printer = new PDFPrinter();
   ```

4. **Check printer is installed:**
   - Open Windows Settings → Devices → Printers & scanners
   - Verify printer appears in the list
   - Try printing a test page from Windows

#### Issue: "Failed to start print job"

**Symptoms:**
```
Error: Failed to start print job
```

**Solutions:**

1. **Check printer status:**
   - Open Windows Settings → Devices → Printers & scanners
   - Click on the printer
   - Ensure it's not paused, offline, or showing errors
   - Clear any stuck print jobs

2. **Verify printer permissions:**
   - Right-click printer → Printer properties → Security tab
   - Ensure your user account has "Print" permission

3. **Restart print spooler:**
   ```powershell
   # Run as Administrator
   net stop spooler
   net start spooler
   ```

4. **Check Windows Event Viewer:**
   - Open Event Viewer
   - Navigate to: Windows Logs → System
   - Look for errors from source "Print" or "PrintService"

#### Issue: "Access denied" when printing

**Solutions:**

1. **Run with elevated permissions:**
   - Run your Node.js application as Administrator
   - Or configure printer permissions for your user

2. **Check printer sharing settings:**
   - Printer properties → Sharing tab
   - Ensure "Share this printer" is configured correctly

### PDF Rendering Issues

#### Issue: PDF not rendering correctly

**Symptoms:**
- Blank pages
- Garbled output
- Missing content

**Solutions:**

1. **Verify PDF is valid:**
   ```typescript
   import fs from 'fs';
   
   const buffer = fs.readFileSync('./document.pdf');
   console.log('PDF size:', buffer.length, 'bytes');
   
   // Try opening PDF in a viewer first
   ```

2. **Test with simple PDF:**
   ```typescript
   // Create a simple test PDF first
   // Test with known-good PDF file
   await printer.print('./simple-test.pdf');
   ```

3. **Check PDF format:**
   - Some advanced PDF features may not render correctly
   - Try saving PDF as "PDF/A" format
   - Flatten forms and annotations

4. **Increase DPI:**
   ```typescript
   // Higher DPI may improve rendering quality
   await printer.print('./document.pdf', {
     quality: PrintQuality.HIGH
   });
   ```

#### Issue: "Failed to load PDF document"

**Solutions:**

1. **Check file path:**
   ```typescript
   import path from 'path';
   
   // Use absolute path
   const pdfPath = path.resolve('./document.pdf');
   await printer.print(pdfPath);
   ```

2. **Verify file exists:**
   ```typescript
   import fs from 'fs';
   
   if (!fs.existsSync(pdfPath)) {
     console.error('PDF file not found:', pdfPath);
   }
   ```

3. **Check file permissions:**
   - Ensure Node.js process can read the file
   - Check file is not locked by another process

4. **Try buffer approach:**
   ```typescript
   const buffer = fs.readFileSync('./document.pdf');
   await printer.printRaw(buffer, 'Document');
   ```

### Configuration Issues

#### Issue: Print settings not applied

**Symptoms:**
- Duplex not working
- Wrong paper size
- Quality settings ignored

**Solutions:**

1. **Check printer capabilities:**
   ```typescript
   import { PrinterManager } from 'windows-pdf-printer-native';
   
   const printers = await PrinterManager.getAvailablePrinters();
   const printer = printers.find(p => p.name === 'Your Printer');
   console.log('Printer info:', printer);
   ```

2. **Verify driver support:**
   - Some settings require specific printer driver support
   - Update printer driver to latest version
   - Check manufacturer's documentation

3. **Test with print dialog:**
   ```typescript
   // Let user configure settings interactively
   await printer.print('./document.pdf', {
     showPrintDialog: true
   });
   ```

4. **Use driver defaults:**
   ```typescript
   // Don't specify all options, let driver use defaults
   await printer.print('./document.pdf', {
     quality: PrintQuality.MEDIUM
     // Let driver choose other settings
   });
   ```

### Performance Issues

#### Issue: Slow printing performance

See the [Performance Guide](./PERFORMANCE.md) for detailed optimization strategies.

**Quick fixes:**

1. **Lower quality:**
   ```typescript
   await printer.print('./document.pdf', {
     quality: PrintQuality.LOW  // 2x faster
   });
   ```

2. **Disable cache for batch:**
   ```typescript
   printer.setCacheEnabled(false);
   ```

3. **Check system resources:**
   - Close other applications
   - Check CPU/memory usage
   - Verify sufficient disk space

#### Issue: High memory usage

**Solutions:**

1. **Disable caching:**
   ```typescript
   const printer = new PDFPrinter();
   printer.setCacheEnabled(false);
   ```

2. **Process in batches:**
   ```typescript
   const batchSize = 10;
   for (let i = 0; i < files.length; i += batchSize) {
     const batch = files.slice(i, i + batchSize);
     for (const file of batch) {
       await printer.print(file);
     }
     // Give GC time to clean up
     await new Promise(resolve => setTimeout(resolve, 1000));
   }
   ```

3. **Force garbage collection:**
   ```typescript
   // Run node with --expose-gc flag
   // node --expose-gc your-script.js
   
   if (global.gc) {
     global.gc();
   }
   ```

### Platform Issues

#### Issue: "This library only supports Windows"

**Symptoms:**
```
Error: Unsupported platform: darwin/linux
```

**Solution:**

This library is Windows-only. For other platforms:
- **Linux/macOS**: Use [unix-print](https://www.npmjs.com/package/unix-print)
- **Cross-platform**: Implement platform detection:
  ```typescript
  if (process.platform === 'win32') {
    const { PDFPrinter } = require('windows-pdf-printer-native');
    // ...
  } else {
    const printer = require('unix-print');
    // ...
  }
  ```

### TypeScript Issues

#### Issue: Type definitions not found

**Solution:**

The package includes TypeScript definitions. Ensure you're using:
```typescript
// Use named imports
import { PDFPrinter, PrintQuality, PaperSize } from 'windows-pdf-printer-native';

// Check tsconfig.json includes node_modules
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

#### Issue: Enum errors

**Solution:**

Use the exported enum values:
```typescript
import { PrintQuality, PaperSize } from 'windows-pdf-printer-native';

// ✅ Correct
await printer.print('./doc.pdf', {
  quality: PrintQuality.HIGH,
  paperSize: PaperSize.A4
});

// ❌ Incorrect
await printer.print('./doc.pdf', {
  quality: 'high',  // Type error
  paperSize: 'A4'   // Type error
});
```

## Debug Mode

Enable detailed logging to troubleshoot issues:

### Windows CMD
```cmd
set DEBUG=windows-pdf-printer-native:*
node your-script.js
```

### Windows PowerShell
```powershell
$env:DEBUG = "windows-pdf-printer-native:*"
node your-script.js
```

### Git Bash / WSL
```bash
DEBUG=windows-pdf-printer-native:* node your-script.js
```

### Debug Output

```
windows-pdf-printer-native:printer Creating printer for: HP LaserJet Pro
windows-pdf-printer-native:printer-manager Enumerating printers...
windows-pdf-printer-native:printer-manager Found 3 printers
windows-pdf-printer-native:pdf-render Loading PDF: document.pdf
windows-pdf-printer-native:pdf-render PDF loaded, pages: 4
windows-pdf-printer-native:pdf-render Rendering page 1 at 300 DPI
windows-pdf-printer-native:devmode Configuring DEVMODE...
windows-pdf-printer-native:devmode Setting quality: 300 DPI
windows-pdf-printer-native:devmode Setting paper size: A4
windows-pdf-printer-native:printer Starting print job...
windows-pdf-printer-native:printer Print job completed in 5.5s
```

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: [GitHub Issues](https://github.com/ClemersonAssuncao/windows-pdf-printer-native/issues)

2. **Create a bug report** with:
   - Node.js version (`node --version`)
   - Windows version
   - Package version
   - Minimal reproduction code
   - Error messages and stack traces
   - Debug output (if applicable)

3. **Ask for help**: [GitHub Discussions](https://github.com/ClemersonAssuncao/windows-pdf-printer-native/discussions)

## Diagnostic Script

Run this script to collect diagnostic information:

```typescript
import { PrinterManager, PDFPrinter } from 'windows-pdf-printer-native';
import os from 'os';

async function diagnostics() {
  console.log('=== System Information ===');
  console.log('Node.js:', process.version);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('OS:', os.type(), os.release());
  
  console.log('\n=== Printer Information ===');
  try {
    const printers = await PrinterManager.getAvailablePrinters();
    console.log(`Found ${printers.length} printer(s):`);
    printers.forEach(p => {
      console.log(`  - ${p.name}${p.isDefault ? ' (DEFAULT)' : ''}`);
      console.log(`    Driver: ${p.driverName}`);
      console.log(`    Port: ${p.portName}`);
    });
    
    const defaultPrinter = await PrinterManager.getDefaultPrinter();
    console.log('\nDefault printer:', defaultPrinter);
  } catch (error) {
    console.error('Error getting printers:', error.message);
  }
  
  console.log('\n=== Package Information ===');
  console.log('Package:', require('windows-pdf-printer-native/package.json').version);
  console.log('PDFium DLL:', require('path').resolve(__dirname, '../bin/pdfium.dll'));
}

diagnostics();
```

---

For more information, see the main [README](../README.md).
