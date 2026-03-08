import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

describe('Employee Master Headers', () => {
  it('should extract all column headers from employee_master.xlsx', () => {
    const filePath = path.resolve(__dirname, '../../public/data/employee_master.xlsx');
    const data = fs.readFileSync(filePath);
    const workbook = XLSX.read(data, { type: 'buffer' });
    const sheetName = workbook.SheetNames.includes('Master') ? 'Master' : workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const headers = rows[0] as string[];
    
    console.log('Sheet:', sheetName);
    console.log('Column count:', headers.length);
    console.log('Columns:', JSON.stringify(headers));
    
    expect(headers.length).toBeGreaterThan(0);
  });
});
