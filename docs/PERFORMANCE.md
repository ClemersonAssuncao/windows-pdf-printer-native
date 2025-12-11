# Performance Guide

## Benchmark Results

### Test Environment
- **OS**: Windows 10/11
- **Document**: 4-page PDF
- **Printer**: Virtual/Physical printer
- **Node.js**: v18+

### Quality vs Speed Trade-offs

| Quality | DPI | Total Time | Per Page | Memory | Use Case |
|---------|-----|------------|----------|--------|----------|
| **LOW** | 150 | ~3.2s | ~0.8s | Low | Draft documents, internal use |
| **MEDIUM** | 300 | ~5.5s | ~1.4s | Medium | Standard documents, reports ✅ |
| **HIGH** | 600 | ~18.5s | ~4.6s | High | Photos, presentations |

### Performance Comparison

**vs Legacy Approaches:**
- ✅ **44% faster** than WritePrinter with PostScript
- ✅ **72% faster** per-page rendering (300 DPI vs 706 DPI baseline)
- ✅ **Zero disk I/O** - All operations in memory
- ✅ **No temporary files** - Direct bitmap transfer

## Optimization Strategies

### 1. Choose Appropriate Quality

```typescript
import { PDFPrinter, PrintQuality } from 'windows-pdf-printer-native';

const printer = new PDFPrinter();

// Draft/Internal documents - 2x faster than medium
await printer.print('./internal-memo.pdf', {
  quality: PrintQuality.LOW  // 150 DPI
});

// Standard documents - optimal balance (DEFAULT)
await printer.print('./report.pdf', {
  quality: PrintQuality.MEDIUM  // 300 DPI
});

// High-quality output - only when necessary
await printer.print('./presentation.pdf', {
  quality: PrintQuality.HIGH  // 600 DPI
});
```

### 2. Page Caching for Multiple Copies

Page caching is **enabled by default** and provides significant benefits when printing multiple copies.

**How it works:**
- Pages are rendered once to bitmap
- Bitmaps are cached in memory
- Subsequent copies reuse cached bitmaps
- Cache is cleared when document closes

**Benefits:**
```typescript
// Without cache: 10 copies × 4 pages × 1.4s = ~56s total
// With cache: 4 pages × 1.4s + 10 copies × minimal = ~8s total
// 🚀 7x faster for 10 copies!

await printer.print('./report.pdf', { 
  copies: 10  // Cache automatically used
});
```

### 3. Disable Cache for Batch Processing

When printing many different PDFs sequentially, disable caching to prevent memory buildup:

```typescript
const printer = new PDFPrinter();

// Disable cache for sequential batch printing
printer.setCacheEnabled(false);

for (let i = 1; i <= 100; i++) {
  await printer.print(`./invoice-${i}.pdf`);
  // Each document is rendered and immediately freed
}

// Re-enable cache for next job with multiple copies
printer.setCacheEnabled(true);
```

### 4. Reuse Printer Instances

```typescript
// ❌ Bad: Creates new printer for each job
for (const file of files) {
  const printer = new PDFPrinter();
  await printer.print(file);
}

// ✅ Good: Reuse printer instance
const printer = new PDFPrinter();
for (const file of files) {
  await printer.print(file);
}
```

### 5. Print Multiple Copies, Not Multiple Jobs

```typescript
// ❌ Bad: Multiple print jobs
for (let i = 0; i < 5; i++) {
  await printer.print('./document.pdf');
}

// ✅ Good: Single job with multiple copies
await printer.print('./document.pdf', { copies: 5 });
```

## Memory Management

### Understanding Memory Usage

Memory consumption depends on:
1. **DPI**: Higher DPI = larger bitmaps
2. **Page Size**: A4 vs A3 vs Legal
3. **Page Count**: Total pages in document
4. **Copies**: With caching enabled
5. **Cache State**: Enabled/disabled

### Memory Formula

```
Per-Page Memory = (Width × Height × BytesPerPixel) at target DPI

Example (A4 at 300 DPI):
Width = 8.27" × 300 DPI = 2481 pixels
Height = 11.69" × 300 DPI = 3507 pixels
Memory = 2481 × 3507 × 4 bytes = ~34 MB per page
```

### Memory Usage Examples

| Document | DPI | Pages | Copies | Cache | Memory |
|----------|-----|-------|--------|-------|--------|
| A4 Report | 150 | 4 | 1 | N/A | ~36 MB |
| A4 Report | 300 | 4 | 1 | N/A | ~136 MB |
| A4 Report | 300 | 4 | 10 | On | ~136 MB |
| A4 Report | 300 | 4 | 10 | Off | ~36 MB |
| A4 Report | 600 | 4 | 1 | N/A | ~544 MB |

### Memory Best Practices

1. **For Multiple Copies**: Keep cache enabled (default)
   ```typescript
   // Memory efficient for multiple copies
   await printer.print('./doc.pdf', { copies: 10 });
   ```

2. **For Batch Processing**: Disable cache
   ```typescript
   printer.setCacheEnabled(false);
   for (const file of files) {
     await printer.print(file);
   }
   ```

3. **Monitor Memory**: Use Node.js profiling tools
   ```typescript
   const used = process.memoryUsage();
   console.log('Memory:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
   ```

## Performance Monitoring

### Enable Debug Logging

Set the `DEBUG` environment variable to see detailed performance metrics:

```bash
# Windows CMD
set DEBUG=windows-pdf-printer-native:*
node your-script.js

# Windows PowerShell
$env:DEBUG = "windows-pdf-printer-native:*"
node your-script.js

# Bash (Git Bash, WSL)
DEBUG=windows-pdf-printer-native:* node your-script.js
```

### Debug Output Example

```
windows-pdf-printer-native:pdf-render Rendering PDF: document.pdf
windows-pdf-printer-native:pdf-render Pages: 4, DPI: 300
windows-pdf-printer-native:pdf-render Page 1 rendered in 1.2s
windows-pdf-printer-native:pdf-render Page 2 rendered in 1.3s
windows-pdf-printer-native:pdf-render Page 3 rendered in 1.4s
windows-pdf-printer-native:pdf-render Page 4 rendered in 1.5s
windows-pdf-printer-native:printer Total print time: 5.5s
```

## Real-World Scenarios

### Scenario 1: High-Volume Document Processing

**Goal**: Print 1000 invoices as fast as possible

```typescript
const printer = new PDFPrinter();
printer.setCacheEnabled(false);  // Prevent memory buildup

const startTime = Date.now();

for (let i = 1; i <= 1000; i++) {
  await printer.print(`./invoices/invoice-${i}.pdf`, {
    quality: PrintQuality.LOW  // 150 DPI for speed
  });
  
  if (i % 100 === 0) {
    console.log(`Printed ${i}/1000 invoices`);
  }
}

const duration = (Date.now() - startTime) / 1000;
console.log(`Completed in ${duration}s (${(1000/duration).toFixed(1)} docs/s)`);
```

### Scenario 2: Multi-Copy Reports

**Goal**: Print 50 copies of a 20-page report

```typescript
const printer = new PDFPrinter();
// Cache enabled by default - optimal for multiple copies

await printer.print('./monthly-report.pdf', {
  copies: 50,
  quality: PrintQuality.MEDIUM,  // 300 DPI for quality
  duplex: DuplexMode.VERTICAL,   // Save paper
  collate: true                   // Collate copies
});

// Pages rendered once, then cached and reused for all 50 copies
// Estimated time: ~28s (vs ~1400s without caching!)
```

### Scenario 3: Mixed Quality Batch

**Goal**: Print different documents with appropriate quality

```typescript
const printer = new PDFPrinter();

const jobs = [
  { file: './internal-memo.pdf', quality: PrintQuality.LOW },
  { file: './client-proposal.pdf', quality: PrintQuality.HIGH },
  { file: './daily-report.pdf', quality: PrintQuality.MEDIUM },
  { file: './draft-contract.pdf', quality: PrintQuality.LOW }
];

for (const job of jobs) {
  await printer.print(job.file, { quality: job.quality });
}
```

## Troubleshooting Performance Issues

### Slow Printing

**Symptoms**: Printing takes longer than expected

**Solutions**:
1. Lower the DPI quality setting
2. Check printer driver is up to date
3. Verify printer is local (network printers are slower)
4. Disable cache for single-copy jobs
5. Monitor system resources (CPU, memory)

### High Memory Usage

**Symptoms**: Memory usage grows unexpectedly

**Solutions**:
1. Disable cache for batch processing
2. Lower DPI for large documents
3. Process documents in smaller batches
4. Force garbage collection between jobs: `global.gc()`

### Inconsistent Performance

**Symptoms**: Performance varies significantly between runs

**Possible Causes**:
1. Other applications competing for resources
2. Printer queue status (paused, errors)
3. Windows print spooler issues
4. Network printer latency
5. PDF complexity (images, fonts, vectors)

---

For more information, see the main [README](../README.md) or [ARCHITECTURE](./ARCHITECTURE.md).
