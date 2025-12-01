// Performance testing with multiple copies
import { PDFPrinter } from '../src/index';

async function main() {
  console.log('=== Node PDF Printer - Performance Test ===\n');

  const printer = new PDFPrinter();
  const pdfPath = './examples/test-document.pdf';

  console.log(`Using printer: ${printer.getPrinterName()}\n`);

  // Test 1: Single print (cold cache)
  console.log('Test 1: Single print (cold cache)');
  console.time('First print');
  await printer.print(pdfPath);
  console.timeEnd('First print');
  console.log('');

  // Test 2: Print 3 copies separately (cache should help)
  console.log('Test 2: Three separate prints (cache should speed up)');
  console.time('Second print');
  await printer.print(pdfPath);
  console.timeEnd('Second print');
  
  console.time('Third print');
  await printer.print(pdfPath);
  console.timeEnd('Third print');
  
  console.time('Fourth print');
  await printer.print(pdfPath);
  console.timeEnd('Fourth print');
  console.log('');

  // Add small delay to let Windows release resources
  console.log('Waiting for Windows to release resources...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Print with explicit copies option
  console.log('Test 3: Print with copies option (3 copies)');
  console.time('Print 3 copies');
  await printer.print(pdfPath, { copies: 3 });
  console.timeEnd('Print 3 copies');
  console.log('');

  console.log('✓ All performance tests completed!');
}

main().catch(console.error);
