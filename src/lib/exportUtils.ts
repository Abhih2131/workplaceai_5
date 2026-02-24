import * as XLSX from 'xlsx';
import { ChartDataPoint } from './types';

export async function exportToExcel(title: string, data: ChartDataPoint[], appliedFilters?: Record<string, string>) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data.map(d => ({ Category: d.name, Value: d.value })));
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const summary: Record<string, string | number>[] = [
    { Field: 'Report', Value: title },
    { Field: 'Exported At', Value: new Date().toLocaleString() },
    { Field: 'Total Items', Value: data.length },
    { Field: 'Total Value', Value: data.reduce((s, d) => s + d.value, 0) },
  ];
  if (appliedFilters) {
    Object.entries(appliedFilters).forEach(([k, v]) => {
      summary.push({ Field: `Filter: ${k}`, Value: v });
    });
  }
  const summaryWs = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  XLSX.writeFile(wb, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}

export async function exportToPDF(title: string, data: ChartDataPoint[], chartElement?: HTMLElement | null) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(108, 117, 125);
  doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 25);

  let yPos = 35;

  // Chart image
  if (chartElement) {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 260;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      doc.addImage(imgData, 'PNG', 14, yPos, imgWidth, Math.min(imgHeight, 120));
      yPos += Math.min(imgHeight, 120) + 8;
    } catch (e) { console.warn('Chart capture failed:', e); }
  }

  // Data table
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);
  doc.text('Category', 14, yPos);
  doc.text('Value', 200, yPos);
  yPos += 2;
  doc.setDrawColor(200);
  doc.line(14, yPos, 280, yPos);
  yPos += 5;
  doc.setFontSize(9);
  data.forEach(d => {
    if (yPos > 190) { doc.addPage(); yPos = 20; }
    doc.text(String(d.name).substring(0, 60), 14, yPos);
    doc.text(String(d.value), 200, yPos);
    yPos += 5;
  });

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export async function exportToPPT(title: string, data: ChartDataPoint[], chartElement?: HTMLElement | null) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();

  // Title
  slide.addText(title, { x: 0.5, y: 0.2, w: 12, fontSize: 22, bold: true, color: '1a1a2e' });
  slide.addText(`Exported: ${new Date().toLocaleString()}`, { x: 0.5, y: 0.65, fontSize: 9, color: '6c757d' });

  // Chart image
  if (chartElement) {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      slide.addImage({ data: imgData, x: 0.5, y: 1.1, w: 8.5, h: 4.2 });
    } catch (e) { console.warn('Chart capture failed:', e); }
  }

  // Data table
  const headerRow = [
    { text: 'Category', options: { bold: true, fill: { color: '1a365d' }, color: 'FFFFFF', fontSize: 10 } },
    { text: 'Value', options: { bold: true, fill: { color: '1a365d' }, color: 'FFFFFF', fontSize: 10 } },
  ];
  const dataRows = data.slice(0, 20).map(d => [
    { text: String(d.name), options: { fontSize: 9 } },
    { text: String(d.value), options: { fontSize: 9 } },
  ]);

  slide.addTable([headerRow, ...dataRows] as any, {
    x: 9.5, y: 1.1, w: 3.5,
    border: { pt: 0.5, color: 'CCCCCC' },
    rowH: 0.3,
  });

  await pptx.writeFile({ fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx` });
}
