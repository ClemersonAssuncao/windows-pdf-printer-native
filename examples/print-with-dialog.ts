/**
 * Example: Using Print Dialog
 * Demonstrates how to show the Windows print configuration dialog before printing
 * 
 * Features demonstrated:
 * - Pre-selecting a specific printer in the dialog
 * - Allowing user to select page ranges
 * - User can change all print settings interactively
 * - User-selected settings override programmatic settings
 */

import { PDFPrinter, PrinterManager } from '../src';

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

    // Example: Show print dialog with pre-selected printer
    console.log('Example: Interactive printing with dialog');
    console.log('The dialog will:');
    console.log('  - Pre-select "Microsoft Print to PDF" printer');
    console.log('  - Allow you to change the printer');
    console.log('  - Allow you to select specific page ranges (e.g., pages 1-2)');
    console.log('  - Allow you to change copies, orientation, and other settings');
    console.log('  - Click "Print" to proceed or "Cancel" to abort\n');
    
    const printer = new PDFPrinter('Microsoft Print to PDF');
    
    try {
      await printer.print('./examples/teste.pdf', {
        showPrintDialog: true,
        copies: 1
      });
      console.log('✓ Print job submitted successfully!\n');
    } catch (error: any) {
      console.error('✗ Print failed:', error.message);
    }

    // Example 2: Print with dialog using default printer
    console.log('\nExample 2: Using default printer in dialog');
    const printer2 = new PDFPrinter();
    
    try {
      await printer2.print('./examples/teste.pdf', {
        showPrintDialog: true
      });
      console.log('✓ Print job submitted successfully!\n');
    } catch (error: any) {
      console.error('✗ Print failed:', error.message);
    }
      
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
