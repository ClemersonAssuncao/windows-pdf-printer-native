// Example to list all printers and their capabilities
import { listPrinters, PrinterManager } from '../src/index';

async function main() {
  console.log('=== Available Printers ===\n');
  
  const printers = await listPrinters();
  
  if (printers.length === 0) {
    console.log('No printers found on this system.');
    return;
  }
  
  printers.forEach(async (printer, index) => {
    console.log(`${index + 1}. ${printer.name}${printer.isDefault ? ' (DEFAULT)' : ''}`);
    console.log(`   Driver: ${printer.driverName || 'N/A'}`);
    console.log(`   Port: ${printer.portName || 'N/A'}`);
    
    if ('location' in printer && printer.location) {
      console.log(`   Location: ${printer.location}`);
    }
    
    if ('comment' in printer && printer.comment) {
      console.log(`   Comment: ${printer.comment}`);
    }
    
    // Get capabilities (Windows only)
    const capabilities = await PrinterManager.getPrinterCapabilities(printer.name);
    if (capabilities) {
      console.log('   Capabilities:');
      console.log(`     - Duplex: ${capabilities.supportsDuplex ? 'Supported' : 'Not supported'}`);
      console.log(`     - Color: ${capabilities.supportsColor ? 'Supported' : 'Not supported'}`);
      console.log(`     - Default paper size: ${capabilities.defaultPaperSize}`);
    }
    
    console.log();
  });
}

main().catch(console.error);
