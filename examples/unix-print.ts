// Simple example for Unix systems
import { PDFPrinter, listPrinters, getDefaultPrinter } from '../src/index';

async function main() {
  console.log('=== Node PDF Printer - Unix Example ===\n');
  
  // List all available printers
  console.log('Available printers:');
  const printers = await listPrinters();
  printers.forEach(printer => {
    console.log(`  ${printer.isDefault ? '* ' : '  '}${printer.name}`);
    if ('status' in printer) console.log(`    Status: ${printer.status}`);
  });
  console.log();
  
  // Get default printer
  const defaultPrinter = await getDefaultPrinter();
  console.log(`Default printer: ${defaultPrinter}\n`);
  
  // Create printer instance
  const printer = new PDFPrinter();
  console.log(`Using printer: ${printer.getPrinterName()}\n`);
  
  // Print a PDF file
  const pdfPath = './test-document.pdf';
  
  console.log(`Printing: ${pdfPath}`);
  
  try {
    await printer.print(pdfPath, {
      copies: 1,
      duplex: 'vertical',
      paperSize: 'a4',
      orientation: 'portrait'
    });
    console.log('✓ Print job sent successfully!');
  } catch (error: any) {
    console.error('✗ Print failed:', error.message);
  }
}

main().catch(console.error);
