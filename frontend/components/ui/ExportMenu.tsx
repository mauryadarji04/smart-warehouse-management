'use client';

import { Download, FileText, FileSpreadsheet, Printer, Share2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface ExportRow {
  [key: string]: string | number | undefined;
}

interface ExportMenuProps {
  data: ExportRow[];
  filename?: string;
  headers?: string[];
  onShareLink?: () => void;
}

function toCSV(data: ExportRow[], headers?: string[]): string {
  const keys = headers ?? Object.keys(data[0] ?? {});
  const rows = data.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','));
  return [keys.join(','), ...rows].join('\n');
}

function downloadBlob(content: string, filename: string, mime: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

export function ExportMenu({ data, filename = 'export', headers, onShareLink }: ExportMenuProps) {
  const exportCSV = () => {
    downloadBlob(toCSV(data, headers), `${filename}.csv`, 'text/csv');
  };

  const exportExcel = async () => {
    // Lightweight XLSX via SheetJS (dynamic import to keep bundle small)
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch {
      // Fallback to CSV if xlsx not installed
      exportCSV();
    }
  };

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      const keys = headers ?? Object.keys(data[0] ?? {});
      autoTable(doc, {
        head: [keys],
        body: data.map((r) => keys.map((k) => String(r[k] ?? ''))),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      doc.save(`${filename}.pdf`);
    } catch {
      alert('PDF export requires jspdf and jspdf-autotable packages.');
    }
  };

  const print = () => {
    const keys = headers ?? Object.keys(data[0] ?? {});
    const rows = data.map((r) => `<tr>${keys.map((k) => `<td style="padding:6px 10px;border:1px solid #e2e8f0">${r[k] ?? ''}</td>`).join('')}</tr>`).join('');
    const html = `<html><head><title>${filename}</title><style>body{font-family:sans-serif;font-size:12px}table{border-collapse:collapse;width:100%}th{background:#3b82f6;color:white;padding:8px 10px;text-align:left}</style></head><body><h2 style="margin-bottom:12px">${filename}</h2><table><thead><tr>${keys.map((k) => `<th>${k}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus-ring"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
        aria-label="Export options"
      >
        <Download className="w-4 h-4" /> Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Export As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={exportCSV} className="flex items-center gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-green-600" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={exportExcel} className="flex items-center gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={exportPDF} className="flex items-center gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-red-500" /> PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={print} className="flex items-center gap-2 cursor-pointer">
          <Printer className="w-4 h-4 text-slate-500" /> Print
        </DropdownMenuItem>
        {onShareLink && (
          <DropdownMenuItem onSelect={onShareLink} className="flex items-center gap-2 cursor-pointer">
            <Share2 className="w-4 h-4 text-blue-500" /> Share Link
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
