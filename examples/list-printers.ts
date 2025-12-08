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
  });
}

main().catch(console.error);
