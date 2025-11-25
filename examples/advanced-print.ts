// Advanced printing example with all options
import { 
  PDFPrinter, 
  PAPER_A4, 
  PAPER_LETTER,
  PRINT_QUALITY_HIGH 
} from '../src/index';

async function main() {
  console.log('=== Node PDF Printer - Advanced Example ===\n');
  
  // You can specify a particular printer or use the default
  const printerName = "Microsoft Print to PDF"; // Set to specific printer name if needed
  const printer = new PDFPrinter(printerName);
  
  console.log(`Using printer: ${printer.getPrinterName()}\n`);
  
  const pdfPath = './test-document.pdf';
  
  // Advanced printing with all options
  console.log('Printing with advanced options:');
  console.log('  - Paper: A4');
  console.log('  - Duplex: Vertical (long edge flip)');
  console.log('  - Copies: 2');
  console.log('  - Orientation: Portrait');
  console.log('  - Color: Yes');
  console.log('  - Paper Source: Tray 1');
  console.log('  - Collate: Yes');
  console.log();
  
  try {
    await printer.print(pdfPath, {
      copies: 2,
      duplex: 'vertical',
      paperSize: PAPER_A4,
      paperSource: 1, // 1 = Upper tray, 2 = Lower tray, 4 = Manual feed
      orientation: 'portrait',
      color: true,
      quality: PRINT_QUALITY_HIGH,
      collate: true
    });
    console.log('✓ Advanced print job sent successfully!');
  } catch (error) {
    console.error('✗ Print failed:', error.message);
    process.exit(1);
  }
  
  // Example: Print to specific printer
  console.log('\n--- Printing to specific printer ---');
  try {
    const specificPrinter = new PDFPrinter('Microsoft Print to PDF');
    await specificPrinter.print(pdfPath, {
      copies: 1,
      paperSize: PAPER_LETTER
    });
    console.log('✓ Print to specific printer successful!');
  } catch (error) {
    console.error('✗ Could not print to specific printer:', error.message);
  }
  
  // Example: Print raw data
  console.log('\n--- Printing raw PCL/PostScript data ---');
  try {
    const rawData = Buffer.from('%PDF-1.4\n...');
    await printer.printRaw(rawData, 'Raw Document', {
      paperSize: PAPER_A4
    });
    console.log('✓ Raw data print job sent successfully!');
  } catch (error) {
    console.error('✗ Raw print failed:', error.message);
  }
}

main().catch(console.error);
