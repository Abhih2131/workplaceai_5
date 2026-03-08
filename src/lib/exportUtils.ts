import * as XLSX from 'xlsx';
import { ChartDataPoint, ChartSpec } from './types';

// ─── High-res chart capture ───────────────────────────────────────
// Tries SVG first, falls back to 4x PNG with anti-aliasing

async function captureChartAsSVG(chartElement: HTMLElement): Promise<string | null> {
  try {
    const svgEl = chartElement.querySelector('svg.recharts-surface');
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true) as SVGElement;
    // Ensure proper namespace and sizing
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!clone.getAttribute('width')) clone.setAttribute('width', String(svgEl.clientWidth));
    if (!clone.getAttribute('height')) clone.setAttribute('height', String(svgEl.clientHeight));
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
  } catch {
    return null;
  }
}

async function captureChartAsHighResPNG(chartElement: HTMLElement, scale = 4): Promise<string | null> {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      imageTimeout: 5000,
    });
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('High-res chart capture failed:', e);
    return null;
  }
}

async function captureChart(chartElement: HTMLElement | null): Promise<{ data: string; width: number; height: number } | null> {
  if (!chartElement) return null;

  // Try SVG-based capture first — render SVG to high-res canvas for universal embed
  const svgEl = chartElement.querySelector('svg.recharts-surface') as SVGElement | null;
  if (svgEl) {
    try {
      const clone = svgEl.cloneNode(true) as SVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const w = svgEl.clientWidth || svgEl.getBoundingClientRect().width;
      const h = svgEl.clientHeight || svgEl.getBoundingClientRect().height;
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      // Inline computed styles for text elements
      const texts = svgEl.querySelectorAll('text');
      const cloneTexts = clone.querySelectorAll('text');
      texts.forEach((t, i) => {
        const cs = getComputedStyle(t);
        if (cloneTexts[i]) {
          cloneTexts[i].setAttribute('style',
            `font-family:${cs.fontFamily};font-size:${cs.fontSize};fill:${cs.fill};font-weight:${cs.fontWeight}`);
        }
      });
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

      // Render SVG to 4x canvas
      const scale = 4;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = svgDataUrl;
        });
        ctx.drawImage(img, 0, 0, w * scale, h * scale);
        return { data: canvas.toDataURL('image/png'), width: w, height: h };
      }
    } catch (e) {
      console.warn('SVG-based capture failed, falling back:', e);
    }
  }

  // Fallback: 4x html2canvas
  const png = await captureChartAsHighResPNG(chartElement, 4);
  if (png) {
    return { data: png, width: chartElement.offsetWidth, height: chartElement.offsetHeight };
  }
  return null;
}

// ─── Native PPT chart generation helpers ──────────────────────────

type PptxSlide = any;

function addNativePptChart(slide: PptxSlide, pptx: any, spec: ChartSpec, x: number, y: number, w: number, h: number) {
  const { type, data, title, yLabel } = spec;

  // pptxgenjs chart types
  const chartData = [{
    name: yLabel || 'Value',
    labels: data.map(d => String(d.name)),
    values: data.map(d => d.value),
  }];

  const CHART_COLORS = [
    '0EA5E9', '22C55E', 'F97316', '8B5CF6', 'EC4899',
    'EAB308', '3B82F6', '10B981', 'EF4444', '84CC16',
  ];

  const commonOpts: any = {
    x, y, w, h,
    showTitle: true,
    title,
    titleFontSize: 11,
    titleColor: '1a1a2e',
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 8,
    chartColors: CHART_COLORS,
    dataLabelPosition: 'outEnd',
    dataLabelFontSize: 8,
    showValue: true,
  };

  try {
    if (type === 'bar') {
      slide.addChart(pptx.charts.BAR, chartData, {
        ...commonOpts,
        barDir: 'col',
        barGapWidthPct: 80,
        catAxisLabelFontSize: 8,
        valAxisLabelFontSize: 8,
        catAxisOrientation: data.length > 6 ? 'minMax' : 'minMax',
        catAxisLabelRotate: data.length > 6 ? 315 : 0,
        valAxisTitle: yLabel || '',
        valAxisTitleFontSize: 9,
      });
      return true;
    } else if (type === 'line') {
      slide.addChart(pptx.charts.LINE, chartData, {
        ...commonOpts,
        lineSize: 3,
        lineDataSymbolSize: 8,
        catAxisLabelFontSize: 8,
        valAxisLabelFontSize: 8,
        valAxisTitle: yLabel || '',
        valAxisTitleFontSize: 9,
      });
      return true;
    } else if (type === 'pie' || type === 'donut') {
      slide.addChart(
        type === 'donut' ? pptx.charts.DOUGHNUT : pptx.charts.PIE,
        chartData,
        {
          ...commonOpts,
          showPercent: true,
          showValue: false,
          dataLabelPosition: 'bestFit',
          dataLabelFontSize: 8,
        }
      );
      return true;
    }
  } catch (e) {
    console.warn('Native PPT chart failed:', e);
  }
  return false;
}

// ─── Excel Export ─────────────────────────────────────────────────

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

// ─── PDF Export (high-res) ────────────────────────────────────────

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

  // High-res chart image
  const capture = await captureChart(chartElement || null);
  if (capture) {
    const imgWidth = 260;
    const aspectRatio = capture.height / capture.width;
    const imgHeight = imgWidth * aspectRatio;
    const maxHeight = 120;
    const finalHeight = Math.min(imgHeight, maxHeight);
    const finalWidth = finalHeight === maxHeight ? maxHeight / aspectRatio : imgWidth;
    doc.addImage(capture.data, 'PNG', 14, yPos, finalWidth, finalHeight);
    yPos += finalHeight + 8;
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

// ─── PPT Export (native charts with image fallback) ───────────────

export async function exportToPPT(title: string, data: ChartDataPoint[], chartElement?: HTMLElement | null, spec?: ChartSpec) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();

  // Title
  slide.addText(title, { x: 0.5, y: 0.2, w: 12, fontSize: 22, bold: true, color: '1a1a2e' });
  slide.addText(`Exported: ${new Date().toLocaleString()}`, { x: 0.5, y: 0.65, fontSize: 9, color: '6c757d' });

  // Try native editable chart first
  let chartAdded = false;
  if (spec && (spec.type === 'bar' || spec.type === 'line' || spec.type === 'pie' || spec.type === 'donut')) {
    chartAdded = addNativePptChart(slide, pptx, spec, 0.5, 1.1, 8.5, 4.5);
  }

  // Fallback to high-res image if native chart failed
  if (!chartAdded && chartElement) {
    const capture = await captureChart(chartElement);
    if (capture) {
      const maxW = 8.5;
      const maxH = 4.5;
      const aspectRatio = capture.height / capture.width;
      let w = maxW;
      let h = w * aspectRatio;
      if (h > maxH) { h = maxH; w = h / aspectRatio; }
      const xOffset = 0.5 + (maxW - w) / 2;
      slide.addImage({ data: capture.data, x: xOffset, y: 1.1, w, h });
    }
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

// ─── Full Dashboard PPT Export ────────────────────────────────────

interface DashboardSlideData {
  sectionTitle: string;
  charts: ChartSpec[];
  kpis?: { label: string; value: string }[];
}

export async function exportDashboardToPPT(
  sections: DashboardSlideData[],
  filters: Record<string, string>,
  meta: { employeeCount: number; isDemo: boolean; fileName?: string; asOfDate: Date; fyStart: Date; fyEnd: Date }
) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'HR Analytics Dashboard';
  pptx.subject = 'HR Dashboard Report';

  const BRAND_COLOR = '1a1a2e';
  const ACCENT_COLOR = '0EA5E9';
  const MUTED_COLOR = '6c757d';

  // ── Slide 1: Title + Filters ──
  const titleSlide = pptx.addSlide();
  titleSlide.addShape('rect' as any, { x: 0, y: 0, w: 13.33, h: 2.5, fill: { color: BRAND_COLOR } });
  titleSlide.addText('HR Analytics Dashboard', { x: 0.8, y: 0.5, w: 11, fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Arial' });
  titleSlide.addText(
    `${meta.isDemo ? 'Demo Data' : meta.fileName || 'Master File'} · ${meta.employeeCount.toLocaleString()} employees`,
    { x: 0.8, y: 1.4, w: 11, fontSize: 14, color: 'CCCCCC', fontFace: 'Arial' }
  );
  titleSlide.addText(
    `As of: ${meta.asOfDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    { x: 0.8, y: 1.85, w: 5, fontSize: 12, color: 'AAAAAA', fontFace: 'Arial' }
  );
  titleSlide.addText(
    `FY: ${meta.fyStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} – ${meta.fyEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
    { x: 6, y: 1.85, w: 5, fontSize: 12, color: 'AAAAAA', fontFace: 'Arial' }
  );

  // Filters on title slide
  const filterEntries = Object.entries(filters);
  if (filterEntries.length > 0) {
    titleSlide.addText('Applied Filters:', { x: 0.8, y: 3.0, w: 10, fontSize: 12, bold: true, color: BRAND_COLOR });
    const filterText = filterEntries.map(([k, v]) => `${k}: ${v}`).join('  |  ');
    titleSlide.addText(filterText, { x: 0.8, y: 3.4, w: 11, fontSize: 10, color: MUTED_COLOR });
  }

  titleSlide.addText(`Generated: ${new Date().toLocaleString()}`, { x: 0.8, y: 6.8, w: 10, fontSize: 9, color: MUTED_COLOR });

  // ── Section slides ──
  for (const section of sections) {
    // KPIs slide
    if (section.kpis && section.kpis.length > 0) {
      const kpiSlide = pptx.addSlide();
      kpiSlide.addShape('rect' as any, { x: 0, y: 0, w: 13.33, h: 0.8, fill: { color: ACCENT_COLOR } });
      kpiSlide.addText(section.sectionTitle + ' — Key Metrics', { x: 0.5, y: 0.15, w: 12, fontSize: 20, bold: true, color: 'FFFFFF' });

      const cols = Math.min(section.kpis.length, 4);
      const cardW = 2.8;
      const gap = 0.3;
      const totalW = cols * cardW + (cols - 1) * gap;
      const startX = (13.33 - totalW) / 2;

      section.kpis.forEach((kpi, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const x = startX + col * (cardW + gap);
        const y = 1.3 + row * 1.8;

        kpiSlide.addShape('roundRect' as any, {
          x, y, w: cardW, h: 1.4,
          fill: { color: 'F8FAFC' },
          line: { color: 'E2E8F0', width: 1 },
          rectRadius: 0.1,
        });
        kpiSlide.addText(kpi.value, { x, y: y + 0.2, w: cardW, fontSize: 24, bold: true, color: BRAND_COLOR, align: 'center' });
        kpiSlide.addText(kpi.label, { x, y: y + 0.85, w: cardW, fontSize: 10, color: MUTED_COLOR, align: 'center' });
      });
    }

    // Charts slides — 2 charts per slide
    const charts = section.charts.filter(c => c.data && c.data.length > 0);
    for (let i = 0; i < charts.length; i += 2) {
      const chartSlide = pptx.addSlide();
      chartSlide.addShape('rect' as any, { x: 0, y: 0, w: 13.33, h: 0.6, fill: { color: ACCENT_COLOR } });
      chartSlide.addText(section.sectionTitle, { x: 0.5, y: 0.1, w: 12, fontSize: 16, bold: true, color: 'FFFFFF' });

      const chartsOnSlide = charts.slice(i, i + 2);

      chartsOnSlide.forEach((spec, idx) => {
        const isWide = chartsOnSlide.length === 1;
        const chartW = isWide ? 11.5 : 5.8;
        const chartX = isWide ? 0.9 : (idx === 0 ? 0.4 : 6.9);
        const chartY = 1.0;
        const chartH = 5.5;

        // Try native chart
        const added = addNativePptChart(chartSlide, pptx, spec, chartX, chartY, chartW, chartH);

        if (!added) {
          // Wordcloud fallback: render as table
          chartSlide.addText(spec.title, { x: chartX, y: chartY, w: chartW, fontSize: 13, bold: true, color: BRAND_COLOR });
          const rows = spec.data.slice(0, 15).map(d => [
            { text: String(d.name), options: { fontSize: 9 } },
            { text: String(d.value), options: { fontSize: 9 } },
          ]);
          const hdr = [
            { text: 'Item', options: { bold: true, fill: { color: '1a365d' }, color: 'FFFFFF', fontSize: 9 } },
            { text: 'Count', options: { bold: true, fill: { color: '1a365d' }, color: 'FFFFFF', fontSize: 9 } },
          ];
          chartSlide.addTable([hdr, ...rows] as any, {
            x: chartX, y: chartY + 0.5, w: chartW,
            border: { pt: 0.5, color: 'DEE2E6' },
            rowH: 0.28,
          });
        }
      });
    }
  }

  await pptx.writeFile({ fileName: 'HR_Analytics_Dashboard.pptx' });
}
