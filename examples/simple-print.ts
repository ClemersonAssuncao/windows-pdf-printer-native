// Simple printing example
import { PDFPrinter, listPrinters, getDefaultPrinter } from '../src/index';

async function main() {
  console.log('=== Node PDF Printer - Simple Example ===\n');
  
  // List all available printers
  console.log('Available printers:');
  const printers = await listPrinters();
  printers.forEach(printer => {
    console.log(`  ${printer.isDefault ? '* ' : '  '}${printer.name}`);
    if ('location' in printer && printer.location) console.log(`    Location: ${printer.location}`);
  });
  console.log();
  
  // Get default printer
  const defaultPrinter = await getDefaultPrinter();
  console.log(`Default printer: ${defaultPrinter}\n`);
  
  // Create printer instance (uses default printer)
  const printer = new PDFPrinter();
  console.log(`Using printer: ${printer.getPrinterName()}\n`);
  
  // Print a PDF file with default settings
  const pdfPath = './test-document.pdf';
  
  console.log(`Printing: ${pdfPath}`);
  console.log('Options: Default settings');
  
  try {
    await printer.print(pdfPath);
    console.log('✓ Print job sent successfully!');
  } catch (error) {
    console.error('✗ Print failed:', error.message);
  }
}

main().catch(console.error);
