// Duplex printing example
import { PDFPrinter, PAPER_A4 } from '../src/index';

async function main() {
  console.log('=== Node PDF Printer - Duplex Printing Example ===\n');
  
  // Create printer instance with specific printer (or use default)
  const printer = new PDFPrinter();
  // const printer = new PDFPrinter('Your Printer Name');
  
  console.log(`Using printer: ${printer.getPrinterName()}`);
  
  // Check printer capabilities
  const capabilities = printer.getCapabilities();
  if (capabilities) {
    console.log('\nPrinter capabilities:');
    console.log(`  Duplex support: ${capabilities.supportsDuplex ? 'Yes' : 'No'}`);
    console.log(`  Color support: ${capabilities.supportsColor ? 'Yes' : 'No'}`);
    console.log();
  }
  
  const pdfPath = './test-document.pdf';
  
  // Example 1: Simplex (single-sided) printing
  console.log('Example 1: Simplex (single-sided) printing');
  try {
    await printer.print(pdfPath, {
      duplex: 'simplex',
      paperSize: PAPER_A4,
      copies: 1
    });
    console.log('✓ Simplex print job sent successfully!\n');
  } catch (error) {
    console.error('✗ Print failed:', error.message, '\n');
  }
  
  // Example 2: Duplex horizontal (flip on short edge)
  console.log('Example 2: Duplex horizontal (flip on short edge)');
  try {
    await printer.print(pdfPath, {
      duplex: 'horizontal',
      paperSize: PAPER_A4,
      copies: 1
    });
    console.log('✓ Duplex horizontal print job sent successfully!\n');
  } catch (error) {
    console.error('✗ Print failed:', error.message, '\n');
  }
  
  // Example 3: Duplex vertical (flip on long edge)
  console.log('Example 3: Duplex vertical (flip on long edge)');
  try {
    await printer.print(pdfPath, {
      duplex: 'vertical',
      paperSize: PAPER_A4,
      copies: 1
    });
    console.log('✓ Duplex vertical print job sent successfully!\n');
  } catch (error) {
    console.error('✗ Print failed:', error.message, '\n');
  }
}

main().catch(console.error);
