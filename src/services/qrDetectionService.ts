
import { BrowserMultiFormatReader, Result } from '@zxing/library';

export class QRDetectionService {
  private reader: BrowserMultiFormatReader;
  private isScanning = false;

  constructor() {
    this.reader = new BrowserMultiFormatReader();
  }

  async scanFromVideo(videoElement: HTMLVideoElement): Promise<Result | null> {
    if (!videoElement || this.isScanning) {
      return null;
    }

    try {
      this.isScanning = true;
      const result = await this.reader.decodeOnceFromVideoDevice(undefined, videoElement);
      return result;
    } catch (error) {
      // No QR code found or other error
      return null;
    } finally {
      this.isScanning = false;
    }
  }

  async scanFromImageData(imageData: ImageData): Promise<Result | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);

      const result = await this.reader.decodeFromCanvas(canvas);
      return result;
    } catch (error) {
      return null;
    }
  }

  reset() {
    this.reader.reset();
    this.isScanning = false;
  }

  destroy() {
    this.reader.reset();
  }
}
