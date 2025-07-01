
import { BrowserMultiFormatReader, Result } from '@zxing/library';

export class QRDetectionService {
  private reader: BrowserMultiFormatReader;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.reader = new BrowserMultiFormatReader();
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async scanFromVideoElement(videoElement: HTMLVideoElement): Promise<Result | null> {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }

    try {
      // Set canvas dimensions to match video
      this.canvas.width = videoElement.videoWidth;
      this.canvas.height = videoElement.videoHeight;
      
      // Draw current video frame to canvas
      this.ctx.drawImage(videoElement, 0, 0);
      
      // Convert canvas to image element for zxing
      const imageElement = new Image();
      imageElement.src = this.canvas.toDataURL();
      
      return new Promise((resolve) => {
        imageElement.onload = async () => {
          try {
            const result = await this.reader.decodeFromImageElement(imageElement);
            resolve(result);
          } catch (error) {
            resolve(null);
          }
        };
        imageElement.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Error scanning video frame:', error);
      return null;
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

      // Convert canvas to image element for zxing
      const imageElement = new Image();
      imageElement.src = canvas.toDataURL();
      
      return new Promise((resolve) => {
        imageElement.onload = async () => {
          try {
            const result = await this.reader.decodeFromImageElement(imageElement);
            resolve(result);
          } catch (error) {
            resolve(null);
          }
        };
        imageElement.onerror = () => resolve(null);
      });
    } catch (error) {
      return null;
    }
  }

  reset() {
    this.reader.reset();
  }

  destroy() {
    this.reader.reset();
  }
}
