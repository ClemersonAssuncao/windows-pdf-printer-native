// Simple printing example
import { PDFPrinter, listPrinters, getDefaultPrinter } from '../src/index';

async function main() {
  console.log('=== Node PDF Printer - Simple Example ===\n');

  // Inicia o timer
  console.time('Tempo total');

  // List all available printers
  console.log('Available printers:');
  const printers = await listPrinters();
  printers.forEach(printer => {
    console.log(`  ${printer.isDefault ? '* ' : '  '}${printer.name}`);
    if ('location' in printer && printer.location)
      console.log(`    Location: ${printer.location}`);
  });
  console.log();

  // Get default printer
  const defaultPrinter = await getDefaultPrinter();
  console.log(`Default printer: ${defaultPrinter}\n`);

  // Create printer instance (uses default printer)
  const printer = new PDFPrinter('Microsoft Print to PDF');
  console.log(`Using printer: ${printer.getPrinterName()}\n`);

  // Print a PDF file with default settings
  const pdfPath = './examples/teste-signed.pdf';
  console.log(`Printing: ${pdfPath}`);
  console.log('Options: Default settings');

  try {
    console.time('Tempo de impressão');
    await printer.print(pdfPath, {
      showPrintDialog: true
    });
    console.timeEnd('Tempo de impressão');
    console.log('✓ Print job sent successfully!');
  } catch (error) {
    console.error('✗ Print failed:', error.message);
  }

  // Finaliza o timer total
  console.timeEnd('Tempo total');
}

main().catch(console.error);
