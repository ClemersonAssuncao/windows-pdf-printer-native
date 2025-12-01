// Advanced printing example with all options
import { 
  PDFPrinter,
  PrinterManager,
  PrintQuality,
  PaperSize,
  DuplexMode,
  PageOrientation,
  ColorMode,
  PaperTray
} from '../src/index';

async function main() {
  console.log('=== Windows PDF Printer Native - Advanced Example ===\n');
  
  // List available printers
  const printers = await PrinterManager.getAvailablePrinters();
  console.log('Available printers:', printers.map(p => p.name).join(', '));
  console.log();
  
  // You can specify a particular printer or use the default
  const printerName = "Microsoft Print to PDF"; // Set to specific printer name if needed
  const printer = new PDFPrinter(printerName);
  
  console.log(`Using printer: ${printer.getPrinterName()}\n`);
  
  // Check if test PDF exists
  const fs = await import('fs');
  const pdfPath = './examples/test-document.pdf';
  
  // Advanced printing with all options
  console.log('Printing with advanced options:');
  console.log('  - Paper: A4');
  console.log('  - Quality: HIGH (600 DPI)');
  console.log('  - Duplex: VERTICAL (long edge flip)');
  console.log('  - Copies: 2');
  console.log('  - Orientation: Portrait');
  console.log('  - Color: Monochrome');
  console.log('  - Paper Tray: Upper');
  console.log('  - Collate: Yes');
  console.log();
  
  try {
    await printer.print(pdfPath, {
      copies: 2,
      duplex: DuplexMode.VERTICAL,
      paperSize: PaperSize.A4,
      paperTray: PaperTray.UPPER,
      orientation: PageOrientation.PORTRAIT,
      color: ColorMode.MONOCHROME,
      quality: PrintQuality.HIGH,
      collate: true
    });
    console.log('✓ Advanced print job sent successfully!');
  } catch (error) {
    console.error('✗ Print failed:', (error as Error).message);
    process.exit(1);
  }
  
  // Example 2: Print with different quality settings
  console.log('\n--- Example 2: Different Paper Sizes ---');
  console.log('Printing on Letter size paper with LOW quality (150 DPI)...');
  try {
    await printer.print(pdfPath, {
      copies: 1,
      paperSize: PaperSize.LETTER,
      quality: PrintQuality.LOW,
      orientation: PageOrientation.LANDSCAPE
    });
    console.log('✓ Print to Letter size successful!');
  } catch (error) {
    console.error('✗ Could not print:', (error as Error).message);
  }
  
  // Example 3: Print raw buffer data
  console.log('\n--- Example 3: Print from Buffer ---');
  try {
    const fs = await import('fs');
    const rawData = fs.readFileSync(pdfPath);
    console.log(`Printing ${rawData.length} bytes from buffer...`);
    
    await printer.printRaw(rawData, 'Raw Document', {
      paperSize: PaperSize.A4,
      quality: PrintQuality.MEDIUM,
      duplex: DuplexMode.HORIZONTAL
    });
    console.log('✓ Raw buffer print job sent successfully!');
  } catch (error) {
    console.error('✗ Raw print failed:', (error as Error).message);
  }
}

main().catch(console.error);
