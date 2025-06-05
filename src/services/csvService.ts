
export interface ContributorCSVRow {
  name: string;
  email?: string;
  phone?: string;
}

export const downloadContributorsAsCSV = (contributors: any[]) => {
  const headers = ['Name', 'Email', 'Phone'];
  const csvContent = [
    headers.join(','),
    ...contributors.map(contributor => [
      `"${contributor.name || ''}"`,
      `"${contributor.email || ''}"`,
      `"${contributor.phone || ''}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contributors_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseCSVFile = (file: File): Promise<ContributorCSVRow[]> => {
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
        
        const contributors: ContributorCSVRow[] = dataLines.map((line, index) => {
          const values = parseCSVLine(line);
          
          if (values.length < 1 || !values[0].trim()) {
            throw new Error(`Row ${index + 2}: Name is required`);
          }
          
          return {
            name: values[0]?.trim() || '',
            email: values[1]?.trim() || undefined,
            phone: values[2]?.trim() || undefined,
          };
        }).filter(contributor => contributor.name); // Filter out empty rows
        
        resolve(contributors);
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
