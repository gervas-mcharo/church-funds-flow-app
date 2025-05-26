
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

export interface QRCodeData {
  contributorId: string;
  fundTypeId: string;
  timestamp: string;
}

export const generateQRData = (contributorId: string, fundTypeId: string): string => {
  const qrData: QRCodeData = {
    contributorId,
    fundTypeId,
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(qrData);
};

export const generateQRCodeImage = async (qrData: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const saveQRCode = async (contributorId: string, fundTypeId: string, qrData: string) => {
  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      contributor_id: contributorId,
      fund_type_id: fundTypeId,
      qr_data: qrData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const parseQRData = (qrData: string): QRCodeData | null => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};
