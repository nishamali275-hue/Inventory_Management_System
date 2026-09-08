import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-qr-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconComponent],
  template: `
    <app-modal [isOpen]="isOpen()" title="Product QR Code Label" (close)="close.emit()" customWidth="max-w-md">
      <div class="flex flex-col items-center text-center p-4">
        <div class="bg-white p-4 rounded-2xl shadow-inner border border-slate-200 mb-4 inline-block">
          @if (qrCode()) {
            <img [src]="qrCode()" alt="Product QR Code" class="w-64 h-64 object-contain" />
          } @else {
            <div class="w-64 h-64 flex items-center justify-center text-slate-400">
              <span class="animate-spin mr-2">⟳</span> Generating QR...
            </div>
          }
        </div>

        <h4 class="text-base font-bold text-slate-900 dark:text-white">{{ productName() }}</h4>
        <div class="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
          <app-icon name="qr-code" customClass="w-3.5 h-3.5 text-indigo-500" />
          <span>SKU: {{ sku() }}</span>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-xs">
          Scan this QR code to quickly pull up product specifications, stock levels, or initiate stock movements.
        </p>

        <div class="flex items-center justify-center gap-3 mt-6 w-full">
          <button
            (click)="downloadQr()"
            class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
          >
            <app-icon name="download" customClass="w-4 h-4" />
            Download Image
          </button>
          <button
            (click)="printLabel()"
            class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm transition"
          >
            <app-icon name="box" customClass="w-4 h-4" />
            Print Label
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class QrModalComponent {
  isOpen = input<boolean>(false);
  productName = input<string>('');
  sku = input<string>('');
  qrCode = input<string>('');
  close = output<void>();

  downloadQr() {
    if (!this.qrCode()) return;
    const a = document.createElement('a');
    a.href = this.qrCode();
    a.download = `QR-${this.sku() || 'product'}.png`;
    a.click();
  }

  printLabel() {
    if (!this.qrCode()) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Label - ${this.sku()}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .card { border: 2px solid #000; display: inline-block; padding: 20px; border-radius: 8px; }
              h2 { margin: 0 0 10px; font-size: 18px; }
              p { margin: 8px 0 0; font-family: monospace; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>${this.productName()}</h2>
              <img src="${this.qrCode()}" width="220" height="220" />
              <p>SKU: ${this.sku()}</p>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
}
