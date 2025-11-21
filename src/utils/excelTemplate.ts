import * as XLSX from 'xlsx';

export function generateExcelTemplate() {
  const headers = [
    'TEG [h]',
    'Ausschuss',
    'Datum',
    'Internes BA-Kürzel',
    'Ressource',
    'Menge gut'
  ];

  const sampleData = [
    {
      'TEG [h]': 8.5,
      'Ausschuss': 12,
      'Datum': '2024-01-15',
      'Internes BA-Kürzel': 'BA-001',
      'Ressource': 'Maschine 1',
      'Menge gut': 950
    },
    {
      'TEG [h]': 7.2,
      'Ausschuss': 8,
      'Datum': '2024-01-16',
      'Internes BA-Kürzel': 'BA-002',
      'Ressource': 'Maschine 2',
      'Menge gut': 1020
    },
    {
      'TEG [h]': 9.1,
      'Ausschuss': 15,
      'Datum': '2024-01-17',
      'Internes BA-Kürzel': 'BA-003',
      'Ressource': 'Maschine 1',
      'Menge gut': 875
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const columnWidths = headers.map(header => ({ wch: Math.max(header.length + 2, 15) }));
  worksheet['!cols'] = columnWidths;

  XLSX.writeFile(workbook, 'machine_hours_template.xlsx');
}
