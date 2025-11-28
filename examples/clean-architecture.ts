/**
 * Simple example using the new Clean Architecture API
 * This example shows how to use the cross-platform PDFPrinter
 */
import { PDFPrinter, PrinterManager, listPrinters, getDefaultPrinter } from '../src/index';

async function main() {
  try {
    console.log('=== Cross-Platform Printer Example ===\n');
    
    // List all available printers
    console.log('Available printers:');
    const printers = await listPrinters();
    printers.forEach(p => {
      console.log(`  - ${p.name}${p.isDefault ? ' (default)' : ''}`);
    });
    console.log();
    
    // Get default printer
    const defaultPrinter = await getDefaultPrinter();
    console.log(`Default printer: ${defaultPrinter || 'None'}\n`);
    
    // Create a printer instance (uses default printer)
    const printer = new PDFPrinter();
    console.log(`Using printer: ${printer.getPrinterName()}\n`);
    
    // Get printer capabilities
    const capabilities = await printer.getCapabilities();
    if (capabilities) {
      console.log('Printer capabilities:');
      console.log(`  - Supports duplex: ${capabilities.supportsDuplex}`);
      console.log(`  - Supports color: ${capabilities.supportsColor}`);
      console.log(`  - Default paper size: ${capabilities.defaultPaperSize}`);
      console.log();
    }
    
    // Example: Print with options (uncomment to actually print)
    // await printer.print('./document.pdf', {
    //   copies: 2,
    //   duplex: 'vertical',
    //   color: true,
    //   orientation: 'portrait'
    // });
    
    console.log('Done!');
    
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
