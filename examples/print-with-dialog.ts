/**
 * Example: Using Print Dialog
 * Demonstrates how to show the Windows print configuration dialog before printing
 */

import { PDFPrinter, PrinterManager, DuplexMode, PageOrientation, ColorMode, PaperSize, PrintQuality } from '../src';

async function main() {
  try {
    console.log('=== Print Dialog Example ===\n');

    // Get available printers
    const printers = await PrinterManager.getAvailablePrinters();
    console.log('Available printers:');
    printers.forEach((printer, index) => {
      console.log(`  ${index + 1}. ${printer.name}${printer.isDefault ? ' (Default)' : ''}`);
    });
    console.log();

    // Get default printer
    const defaultPrinter = await PrinterManager.getDefaultPrinter();
    console.log(`Default printer: ${defaultPrinter}\n`);

    // Example 1: Show print dialog with default printer
    console.log('Example 1: Printing with dialog (default printer)');
    const printer1 = new PDFPrinter();
    
    try {
      await printer1.print('./test.pdf', {
        showPrintDialog: true,
        // These settings will be pre-populated in the dialog
        copies: 1,
        duplex: DuplexMode.VERTICAL,
        orientation: PageOrientation.PORTRAIT,
        color: ColorMode.COLOR,
        paperSize: PaperSize.A4,
        quality: PrintQuality.MEDIUM
      });
      console.log('✓ Print job submitted successfully (or cancelled by user)\n');
    } catch (error: any) {
      console.error('✗ Print failed:', error.message);
    }

    // Example 2: Show print dialog with specific printer
    console.log('Example 2: Printing with dialog (specific printer)');
    if (printers.length > 0) {
      const specificPrinter = printers[0].name;
      console.log(`Using printer: ${specificPrinter}`);
      
      const printer2 = new PDFPrinter(specificPrinter);
      
      try {
        await printer2.print('./test.pdf', {
          showPrintDialog: true,
          copies: 2,
          color: ColorMode.MONOCHROME,
          quality: PrintQuality.HIGH
        });
        console.log('✓ Print job submitted successfully (or cancelled by user)\n');
      } catch (error: any) {
        console.error('✗ Print failed:', error.message);
      }
    }

    // Example 3: Print without dialog (programmatic)
    console.log('Example 3: Printing without dialog (programmatic)');
    const printer3 = new PDFPrinter();
    
    try {
      await printer3.print('./test.pdf', {
        showPrintDialog: false, // or omit this parameter (default is false)
        copies: 1,
        duplex: DuplexMode.SIMPLEX,
        orientation: PageOrientation.LANDSCAPE,
        paperSize: PaperSize.LETTER,
        quality: PrintQuality.MEDIUM
      });
      console.log('✓ Print job submitted successfully\n');
    } catch (error: any) {
      console.error('✗ Print failed:', error.message);
    }

    // Example 4: Print with dialog and let user override all settings
    console.log('Example 4: Minimal options, let user configure everything in dialog');
    const printer4 = new PDFPrinter();
    
    try {
      await printer4.print('./test.pdf', {
        showPrintDialog: true
        // No other options - user will configure everything in the dialog
      });
      console.log('✓ Print job submitted successfully (or cancelled by user)\n');
    } catch (error: any) {
      console.error('✗ Print failed:', error.message);
    }

    console.log('=== All examples completed ===');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main();
