import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.scss']
})
export class ScanComponent implements OnInit, OnDestroy {
  hasDevices = false;
  hasPermission = false;
  qrResultString: string | null = null;
  errorMessage = '';
  formats = [BarcodeFormat.QR_CODE];
  showScanner = true;
  isScanning = true;

  constructor(private router: Router) { }

  ngOnInit() {
    console.log('Scan component initialized');
    this.isScanning = true;
  }

  ngOnDestroy() {
    console.log('Scan component destroyed');
    this.isScanning = false;
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    console.log('onCamerasFound:', devices?.length || 0);
    this.hasDevices = devices && devices.length > 0;
    if (!this.hasDevices) {
      this.errorMessage = 'No camera found on this device';
    }
  }

  onHasPermission(has: boolean) {
    console.log('onHasPermission:', has);
    this.hasPermission = has;
    if (!has) {
      this.errorMessage = 'Camera permission denied. Please allow camera access.';
    } else {
      this.errorMessage = '';
    }
  }

  onScanSuccess(result: any) {
    if (!result) {
      console.warn('Empty scan result');
      return;
    }
    
    // Handle both string and Result object from zxing
    let scanText = typeof result === 'string' ? result : result.getText?.();
    
    if (!scanText) {
      console.warn('Could not extract text from result:', result);
      return;
    }

    console.log('Scan success:', scanText);
    this.qrResultString = scanText;
    this.isScanning = false;

    if (scanText.startsWith('upi://')) {
      // Handle UPI code
      console.log('UPI code detected, redirecting...');
      setTimeout(() => {
        window.location.href = scanText;
      }, 500);
    } else {
      // Handle other codes
      const message = `Scanned:\n${scanText}\n\nCopy to clipboard?`;
      if (confirm(message)) {
        navigator.clipboard.writeText(scanText).then(() => {
          alert('Copied!');
          this.goBack();
        }).catch(() => {
          alert('Failed to copy');
          this.resumeScanning();
        });
      } else {
        this.resumeScanning();
      }
    }
  }

  resumeScanning() {
    console.log('Resuming scan...');
    this.isScanning = true;
    this.qrResultString = null;
  }

  onScanError(error: any) {
    console.warn('Scan error:', error);
  }

  retryCamera() {
    console.log('Retrying camera...');
    this.errorMessage = '';
    this.hasPermission = false;
    this.hasDevices = false;
    this.showScanner = false;
    this.isScanning = false;
    
    setTimeout(() => {
      this.showScanner = true;
      this.isScanning = true;
    }, 500);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
