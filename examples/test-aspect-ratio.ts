// Test aspect ratio calculation
import { PDFPrinter } from '../src/index';
import { setLogLevel } from '../src/core/logger';

async function main() {
  console.log('=== Testing Aspect Ratio Calculation ===\n');

  // Enable debug logs to see the calculation
  setLogLevel('debug');

  // Create printer instance
  const printer = new PDFPrinter('Microsoft Print to PDF');
  console.log(`Using printer: ${printer.getPrinterName()}\n`);

  // Print a PDF file
  const pdfPath = './examples/teste-signed.pdf';
  console.log(`Printing: ${pdfPath}`);
  console.log('Testing with debug logs enabled to verify aspect ratio calculation\n');

  try {
    await printer.print(pdfPath, {
      paperSize: 'A4',
    });
    console.log('\n✓ Print job sent successfully!');
    console.log('Check the logs above to verify:');
    console.log('  - PDF dimensions in points');
    console.log('  - Calculated render width based on aspect ratio');
    console.log('  - No stretching should occur');
  } catch (error) {
    console.error('✗ Print failed:', error.message);
  }
}

main().catch(console.error);
