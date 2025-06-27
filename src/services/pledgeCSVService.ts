
export interface PledgeCSVRow {
  contributor_name: string;
  fund_type_name: string;
  pledge_amount: number;
  frequency: 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  installment_amount?: number;
  number_of_installments?: number;
  start_date: string;
  end_date?: string;
  purpose?: string;
  notes?: string;
}

export const downloadPledgeTemplateCSV = () => {
  const headers = [
    'Contributor Name',
    'Fund Type Name', 
    'Pledge Amount',
    'Frequency',
    'Installment Amount',
    'Number of Installments',
    'Start Date',
    'End Date',
    'Purpose',
    'Notes'
  ];
  
  const sampleRow = [
    'John Doe',
    'Building Fund',
    '1000',
    'monthly',
    '100',
    '10',
    '2024-01-01',
    '2024-12-31',
    'Church expansion project',
    'Monthly commitment'
  ];
  
  const csvContent = [
    headers.join(','),
    sampleRow.join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pledge_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parsePledgeCSVFile = (file: File): Promise<PledgeCSVRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header and one data row'));
          return;
        }

        // Skip header row
        const dataLines = lines.slice(1);
        
        const pledges: PledgeCSVRow[] = dataLines.map((line, index) => {
          const values = parseCSVLine(line);
          
          if (values.length < 4 || !values[0].trim() || !values[1].trim() || !values[2].trim() || !values[3].trim()) {
            throw new Error(`Row ${index + 2}: Contributor Name, Fund Type Name, Pledge Amount, and Frequency are required`);
          }
          
          const pledgeAmount = parseFloat(values[2]?.trim() || '0');
          if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
            throw new Error(`Row ${index + 2}: Pledge Amount must be a valid positive number`);
          }
          
          const frequency = values[3]?.trim().toLowerCase();
          if (!['one_time', 'weekly', 'monthly', 'quarterly', 'annually'].includes(frequency)) {
            throw new Error(`Row ${index + 2}: Frequency must be one of: one_time, weekly, monthly, quarterly, annually`);
          }
          
          return {
            contributor_name: values[0]?.trim() || '',
            fund_type_name: values[1]?.trim() || '',
            pledge_amount: pledgeAmount,
            frequency: frequency as PledgeCSVRow['frequency'],
            installment_amount: values[4]?.trim() ? parseFloat(values[4].trim()) : undefined,
            number_of_installments: values[5]?.trim() ? parseInt(values[5].trim()) : undefined,
            start_date: values[6]?.trim() || new Date().toISOString().split('T')[0],
            end_date: values[7]?.trim() || undefined,
            purpose: values[8]?.trim() || undefined,
            notes: values[9]?.trim() || undefined,
          };
        }).filter(pledge => pledge.contributor_name && pledge.fund_type_name);
        
        resolve(pledges);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};
