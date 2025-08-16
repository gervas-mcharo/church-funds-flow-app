
import { supabase } from '@/integrations/supabase/client';
import { generateQRData, generateQRCodeImage } from './qrCodeService';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

export interface BulkQROptions {
  type: 'all-contributors' | 'fund-type';
  fundTypeId?: string;
  format: 'page' | 'cards' | 'labels';
  pageSize?: 'A4' | 'A3' | 'A5' | 'Letter';
}

export interface BulkQRResult {
  contributorName: string;
  contributorPhone: string;
  fundTypeName: string;
  qrData: string;
  qrImage: string;
}

export const generateBulkQRCodes = async (options: BulkQROptions): Promise<BulkQRResult[]> => {
  let contributors: any[] = [];
  let fundTypes: any[] = [];

  // Get all contributors for both generation types
  const { data: contributorData, error: contributorError } = await supabase
    .from('contributors')
    .select('*')
    .order('name');
  if (contributorError) throw contributorError;
  contributors = contributorData;

  // Get fund types based on generation type
  if (options.type === 'fund-type' && options.fundTypeId) {
    const { data, error } = await supabase
      .from('fund_types')
      .select('*')
      .eq('id', options.fundTypeId);
    if (error) throw error;
    fundTypes = data;
  } else {
    // For 'all-contributors', get all active fund types
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
        contributorPhone: contributor.phone || '',
        fundTypeName: fundType.name,
        qrData,
        qrImage
      });
    }
  }

  return results;
};

export const exportBulkQRCodes = async (results: BulkQRResult[], format: string, pageSize?: string): Promise<string> => {
  if (format === 'page') {
    return generatePagePDF(results, pageSize || 'A4');
  } else if (format === 'cards') {
    return generateCardsPDF(results);
  } else {
    return generateLabelsZip(results);
  }
};

const generatePagePDF = async (results: BulkQRResult[], pageSize: string): Promise<string> => {
  // Page dimensions in mm
  const pageSizes = {
    'A4': [210, 297],
    'A3': [297, 420],
    'A5': [148, 210],
    'Letter': [216, 279]
  };
  
  const [pageWidth, pageHeight] = pageSizes[pageSize as keyof typeof pageSizes] || pageSizes.A4;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight]
  });

  const qrSize = 30; // 30x30px converted to mm (approximately 10.6mm)
  const margin = 15;
  const spacing = 5;
  const textHeight = 8;
  const cellWidth = qrSize + spacing;
  const cellHeight = qrSize + textHeight + spacing;
  
  const itemsPerRow = Math.floor((pageWidth - 2 * margin) / cellWidth);
  const itemsPerColumn = Math.floor((pageHeight - 2 * margin) / cellHeight);
  const itemsPerPage = itemsPerRow * itemsPerColumn;

  let currentItem = 0;
  
  for (const result of results) {
    if (currentItem > 0 && currentItem % itemsPerPage === 0) {
      pdf.addPage();
    }
    
    const pagePosition = currentItem % itemsPerPage;
    const row = Math.floor(pagePosition / itemsPerRow);
    const col = pagePosition % itemsPerRow;
    
    const x = margin + col * cellWidth;
    const y = margin + row * cellHeight;
    
    // Add QR code
    pdf.addImage(result.qrImage, 'PNG', x, y, qrSize, qrSize);
    
    // Add contributor name
    pdf.setFontSize(8);
    pdf.text(result.contributorName, x, y + qrSize + 4, { maxWidth: qrSize });
    
    // Add fund type name
    pdf.setFontSize(6);
    pdf.text(result.fundTypeName, x, y + qrSize + 7, { maxWidth: qrSize });
    
    currentItem++;
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
    
    // Add phone number if available
    if (result.contributorPhone) {
      pdf.setFontSize(6);
      pdf.text(result.contributorPhone, xPosition + 2, yPosition + 22);
    }
    
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
