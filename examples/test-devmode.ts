// Test DEVMODE settings with Microsoft Print to PDF
import { WindowsPDFPrinter, WindowsPrinterManager, PAPER_A4, PAPER_LETTER } from '../src/index';

async function testDevMode() {
  console.log('=== Testing DEVMODE Configuration ===\n');
  
  // Use Microsoft Print to PDF (available on all Windows 10+)
  const printerName = 'Microsoft Print to PDF';
  
  // Check if printer exists
  if (!WindowsPrinterManager.printerExists(printerName)) {
    console.error('Microsoft Print to PDF not found!');
    console.log('\nAvailable printers:');
    const printers = WindowsPrinterManager.getAvailablePrinters();
    for (const p of printers) {
      console.log(`  - ${p.name}`);
    }
    return;
  }
  
  console.log(`Using printer: ${printerName}\n`);
  
  // Get printer capabilities
  const capabilities = WindowsPrinterManager.getPrinterCapabilities(printerName);
  console.log('Printer Capabilities:');
  console.log(`  Supports Duplex: ${capabilities?.supportsDuplex}`);
  console.log(`  Supports Color: ${capabilities?.supportsColor}`);
  console.log(`  Default Paper Size: ${capabilities?.defaultPaperSize}`);
  console.log();
  
  // Create a test PDF path (this example doesn't actually need a real PDF)
  const testPdfPath = './test-document.pdf';
  
  // Test 1: Print with various DEVMODE settings
  console.log('Test 1: Multiple copies with duplex');
  const printer1 = new WindowsPDFPrinter(printerName);
  
  try {
    await printer1.print(testPdfPath, {
      copies: 3,
      duplex: 'vertical',
      paperSize: PAPER_A4,
      orientation: 'portrait',
      color: true
    });
    console.log('✓ Print job submitted successfully with DEVMODE options\n');
  } catch (error: any) {
    console.log(`✗ Print failed: ${error.message}\n`);
  }
  
  // Test 2: Different paper size
  console.log('Test 2: Letter size with landscape orientation');
  const printer2 = new WindowsPDFPrinter(printerName);
  
  try {
    await printer2.print(testPdfPath, {
      paperSize: PAPER_LETTER,
      orientation: 'landscape',
      copies: 1
    });
    console.log('✓ Print job submitted successfully\n');
  } catch (error: any) {
    console.log(`✗ Print failed: ${error.message}\n`);
  }
  
  // Test 3: Monochrome printing
  console.log('Test 3: Monochrome (B&W) printing');
  const printer3 = new WindowsPDFPrinter(printerName);
  
  try {
    await printer3.print(testPdfPath, {
      color: false,
      copies: 2
    });
    console.log('✓ Print job submitted successfully\n');
  } catch (error: any) {
    console.log(`✗ Print failed: ${error.message}\n`);
  }
  
  console.log('=== Testing Complete ===');
  console.log('\nTo verify DEVMODE is working:');
  console.log('1. Open Windows Settings → Devices → Printers & scanners');
  console.log('2. Click "Microsoft Print to PDF" → Manage');
  console.log('3. Click "Print queue" to see the jobs');
  console.log('4. Check the print queue properties to see if settings are applied');
}

testDevMode().catch(console.error);
