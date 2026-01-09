import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-entry-scanner',
  templateUrl: './entry-scanner.component.html',
  styleUrls: ['./entry-scanner.component.scss']
})
export class EntryScannerComponent implements OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() scanResult = new EventEmitter<string>();

  hasDevices = false;
  hasPermission = false;
  errorMessage = '';
  formats = [BarcodeFormat.QR_CODE];
  isScanning = false;

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.hasDevices = Boolean(devices && devices.length);
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
    if (!has) {
      this.errorMessage = 'Camera permission denied. Please allow camera access.';
    }
  }

  onScanSuccess(result: string) {
    if (!result) return;
    this.isScanning = true;

    // Emit the scan result
    this.scanResult.emit(result);

    // Auto close after short delay
    setTimeout(() => {
      this.closeScanner();
    }, 500);
  }

  onScanError(error: any) {
    // Silent error handling for continuous scanning
  }

  closeScanner() {
    this.isOpen = false;
    this.errorMessage = '';
    this.hasPermission = false;
    this.isScanning = false;
    this.close.emit();
  }

  ngOnDestroy() {
    this.closeScanner();
  }
}
