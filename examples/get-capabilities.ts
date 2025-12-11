// Simple printing example
import { PrinterManager } from '../src/index';

async function main() {
  PrinterManager.getPrinterCapabilities('Microsoft Print to PDF').then(capabilities => {
    console.log('=== Printer Capabilities ===\n');
    console.log(JSON.stringify(capabilities, null, 2));
  });
}

main().catch(console.error);
