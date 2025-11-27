# Clean Architecture - Estrutura do Projeto

## 📁 Nova Estrutura

```
src/
├── core/                           # Camada de domínio (regras de negócio)
│   ├── types/
│   │   └── index.ts               # PrintOptions, PrinterInfo, PrinterCapabilities
│   └── interfaces/
│       └── index.ts               # IPrinter, IPrinterManager (contratos)
│
├── adapters/                       # Camada de adaptadores (implementações específicas)
│   └── windows/
│       ├── api/
│       │   └── winspool.api.ts   # Windows API bindings (Koffi FFI)
│       └── windows-printer-manager.adapter.ts  # Implementação Windows do IPrinterManager
│
├── services/                       # Camada de serviços (utilitários)
│   └── platform-detector.service.ts  # Detecta Windows vs Unix
│
├── factories/                      # Padrão Factory
│   └── printer.factory.ts         # Cria implementações específicas por plataforma
│
├── index.ts                        # Entry point - Facade API limpa
├── pdf-printer.ts                  # Implementação Windows (legado mantido)
├── printer-manager.ts              # Manager Windows (legado mantido)
└── unix-printer.ts                 # Implementação Unix (legado mantido)
```

## 🎯 Princípios Aplicados

### 1. **Separation of Concerns**
- **Core**: Define tipos e contratos (não depende de nada)
- **Adapters**: Implementa contratos para plataformas específicas
- **Services**: Lógica auxiliar reutilizável
- **Factories**: Cria instâncias corretas baseado no contexto

### 2. **Dependency Inversion**
```typescript
// Antes (acoplamento direto):
import { PDFPrinter } from './pdf-printer';  // Windows-specific
const printer = new PDFPrinter();

// Depois (inversão de dependência):
import { PrinterFactory } from './factories/printer.factory';
const printer = PrinterFactory.createPrinter();  // Platform-agnostic
```

### 3. **Single Responsibility**
- `platform-detector.service.ts`: Apenas detecta plataforma
- `printer.factory.ts`: Apenas cria instâncias
- `winspool.api.ts`: Apenas define bindings da API Windows
- `windows-printer-manager.adapter.ts`: Apenas gerencia impressoras Windows

### 4. **Open/Closed Principle**
Para adicionar suporte a nova plataforma (ex: MacOS):
1. Criar `adapters/macos/macos-printer.adapter.ts`
2. Implementar `IPrinter` e `IPrinterManager`
3. Adicionar caso no `PrinterFactory`
4. **Sem modificar código existente!**

## 🔌 API Pública (Backward Compatible)

```typescript
// Tudo funciona como antes:
import { PDFPrinter, PrinterManager, listPrinters } from 'node-pdf-printer';

const printer = new PDFPrinter();
await printer.print('./doc.pdf', { copies: 2 });

const printers = await PrinterManager.getAvailablePrinters();
const defaultPrinter = await PrinterManager.getDefaultPrinter();
```

## 🆕 Nova API (Clean Architecture)

```typescript
// Usando interfaces e factory:
import { PrinterFactory, type IPrinter } from 'node-pdf-printer';

const printer: IPrinter = PrinterFactory.createPrinter();
await printer.print('./doc.pdf', { copies: 2 });

const manager = PrinterFactory.createPrinterManager();
const printers = await manager.getAvailablePrinters();
```

## 📊 Benefícios

### 1. **Testabilidade**
```typescript
// Mock fácil com interfaces:
class MockPrinter implements IPrinter {
  async print() { /* test logic */ }
  async printRaw() { /* test logic */ }
  // ...
}
```

### 2. **Manutenibilidade**
- Mudanças na API Windows não afetam código Unix
- Cada adapter é independente
- Fácil localizar e corrigir bugs

### 3. **Extensibilidade**
```typescript
// Novo adapter para impressoras na nuvem:
export class CloudPrinterAdapter implements IPrinter {
  async print(pdfPath: string) {
    // Enviar para Google Cloud Print, AWS Print, etc.
  }
}

// No factory:
if (config.useCloud) {
  return new CloudPrinterAdapter();
}
```

### 4. **Organização**
- Estrutura clara e previsível
- Fácil onboarding de novos desenvolvedores
- Documentação viva através da estrutura de pastas

## 🗑️ Arquivos Removidos

- ❌ `src/windows-print-api.ts` → Movido para `src/adapters/windows/api/winspool.api.ts`
- ❌ `src/index.old.ts` → Backup removido

## ✅ Testes Executados

```bash
✓ npm run build              # Compilação sem erros
✓ list-printers.ts           # Lista impressoras corretamente
✓ simple-print.ts            # Impressão funcionando
✓ Backward compatibility     # API antiga ainda funciona
```

## 🚀 Próximos Passos (Opcional)

1. **Criar adapters completos**:
   - `WindowsPrinterAdapter` implementando `IPrinter` totalmente
   - `UnixPrinterAdapter` refatorado para seguir interfaces

2. **Remover legado**:
   - Após adapters completos, remover `pdf-printer.ts`, `printer-manager.ts`, `unix-printer.ts`
   - Manter apenas estrutura Clean Architecture

3. **Adicionar testes unitários**:
   - Testar cada adapter isoladamente
   - Mockar interfaces facilmente

4. **Documentação**:
   - Atualizar README.md com nova estrutura
   - Adicionar exemplos usando factory pattern

---

**Status**: ✅ Refatoração completa e funcional  
**Compatibilidade**: ✅ 100% backward compatible  
**Testes**: ✅ Todos passando
