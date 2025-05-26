
import { supabase } from '@/integrations/supabase/client';
import { generateQRData, generateQRCodeImage } from './qrCodeService';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

export interface BulkQROptions {
  type: 'all-contributors' | 'fund-type' | 'department';
  fundTypeId?: string;
  departmentId?: string;
  format: 'envelope' | 'cards' | 'labels';
}

export interface BulkQRResult {
  contributorName: string;
  fundTypeName: string;
  qrData: string;
  qrImage: string;
}

export const generateBulkQRCodes = async (options: BulkQROptions): Promise<BulkQRResult[]> => {
  let contributors: any[] = [];
  let fundTypes: any[] = [];

  // Get contributors based on type
  if (options.type === 'all-contributors') {
    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .order('name');
    if (error) throw error;
    contributors = data;
  }

  // Get fund types
  if (options.fundTypeId) {
    const { data, error } = await supabase
      .from('fund_types')
      .select('*')
      .eq('id', options.fundTypeId);
    if (error) throw error;
    fundTypes = data;
  } else {
    // Default to all active fund types
    const { data, error } = await supabase
      .from('fund_types')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    fundTypes = data;
  }

  const results: BulkQRResult[] = [];

  // Generate QR codes for each contributor-fund type combination
  for (const contributor of contributors) {
    for (const fundType of fundTypes) {
      const qrData = generateQRData(contributor.id, fundType.id);
      const qrImage = await generateQRCodeImage(qrData);
      
      // Save to database
      await supabase
        .from('qr_codes')
        .insert({
          contributor_id: contributor.id,
          fund_type_id: fundType.id,
          qr_data: qrData
        });

      results.push({
        contributorName: contributor.name,
        fundTypeName: fundType.name,
        qrData,
        qrImage
      });
    }
  }

  return results;
};

export const exportBulkQRCodes = async (results: BulkQRResult[], format: string): Promise<string> => {
  if (format === 'envelope') {
    return generateEnvelopePDF(results);
  } else if (format === 'cards') {
    return generateCardsPDF(results);
  } else {
    return generateLabelsZip(results);
  }
};

const generateEnvelopePDF = async (results: BulkQRResult[]): Promise<string> => {
  const pdf = new jsPDF();
  let yPosition = 20;

  for (const result of results) {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.text(`${result.contributorName} - ${result.fundTypeName}`, 20, yPosition);
    
    // Add QR code image
    const qrSize = 30;
    pdf.addImage(result.qrImage, 'PNG', 150, yPosition - 15, qrSize, qrSize);
    
    yPosition += 40;
  }

  return pdf.output('datauristring');
};

const generateCardsPDF = async (results: BulkQRResult[]): Promise<string> => {
  const pdf = new jsPDF();
  let xPosition = 20;
  let yPosition = 20;
  const cardWidth = 80;
  const cardHeight = 50;

  for (const result of results) {
    if (xPosition + cardWidth > 190) {
      xPosition = 20;
      yPosition += cardHeight + 10;
    }
    
    if (yPosition + cardHeight > 270) {
      pdf.addPage();
      xPosition = 20;
      yPosition = 20;
    }

    // Draw card border
    pdf.rect(xPosition, yPosition, cardWidth, cardHeight);
    
    // Add text
    pdf.setFontSize(8);
    pdf.text(result.contributorName, xPosition + 2, yPosition + 10);
    pdf.text(result.fundTypeName, xPosition + 2, yPosition + 16);
    
    // Add QR code
    const qrSize = 25;
    pdf.addImage(result.qrImage, 'PNG', xPosition + cardWidth - qrSize - 2, yPosition + 2, qrSize, qrSize);
    
    xPosition += cardWidth + 10;
  }

  return pdf.output('datauristring');
};

const generateLabelsZip = async (results: BulkQRResult[]): Promise<string> => {
  const zip = new JSZip();

  for (const result of results) {
    const fileName = `${result.contributorName.replace(/\s+/g, '-')}-${result.fundTypeName.replace(/\s+/g, '-')}.png`;
    const base64Data = result.qrImage.split(',')[1];
    zip.file(fileName, base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return URL.createObjectURL(zipBlob);
};
