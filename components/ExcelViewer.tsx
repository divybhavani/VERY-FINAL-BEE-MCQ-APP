
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, Table as TableIcon } from 'lucide-react';

interface ExcelViewerProps {
  fileUrl: string;
  title: string;
  onClose: () => void;
  theme: any;
}

const ExcelViewer: React.FC<ExcelViewerProps> = ({ fileUrl, title, onClose, theme }) => {
  const [data, setData] = useState<any[][]>([]);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcel = async () => {
      try {
        setError(null);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        
        const firstSheetName = wb.SheetNames[0];
        const worksheet = wb.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        setData(jsonData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading Excel:", err);
        setError(err.message || "Failed to fetch file. This is likely a CORS issue in Supabase Storage.");
        setLoading(false);
      }
    };

    loadExcel();
  }, [fileUrl]);

  const handleSheetChange = (index: number) => {
    if (!workbook) return;
    setActiveSheet(index);
    const sheetName = sheets[index];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    setData(jsonData);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col">
      <header className={`h-16 border-b ${theme.border} bg-slate-900/80 flex items-center justify-between px-6 shrink-0`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/5 ${theme.accent}`}>
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-[10px] text-slate-500 font-mono">EXCEL SPREADSHEET VIEWER</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className={`w-12 h-12 border-4 border-t-transparent ${theme.accent.replace('text-', 'border-')} rounded-full animate-spin`} />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 mb-6">
              <X className="w-12 h-12 text-rose-500" />
            </div>
            <h4 className="text-white font-bold text-xl mb-2">PREVIEW FAILED</h4>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              The system could not fetch the file for preview. This is likely due to CORS restrictions in your Supabase Storage settings.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={onClose}
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${theme.button}`}
              >
                CLOSE VIEWER
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-black/60 border-b border-white/10">
                    <th className="px-4 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-r border-white/5 w-12 text-center">#</th>
                    {data[0]?.map((cell, i) => (
                      <th key={i} className="px-6 py-4 text-[10px] font-mono text-emerald-500 uppercase tracking-widest border-r border-white/5 whitespace-nowrap">
                        {String(cell || String.fromCharCode(65 + i))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/10 transition-colors group">
                      <td className="px-4 py-4 text-[10px] font-mono text-slate-600 border-r border-white/5 text-center bg-black/20">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 text-sm text-slate-300 border-r border-white/5 min-w-[180px] max-w-[400px] break-words group-hover:text-white">
                          {String(cell || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer className="h-12 bg-black border-t border-white/10 flex items-center px-6 gap-2 shrink-0 overflow-x-auto">
        {sheets.map((sheet, i) => (
          <button
            key={sheet}
            onClick={() => handleSheetChange(i)}
            className={`px-4 h-full text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeSheet === i ? `${theme.accent} border-current bg-white/5` : 'text-slate-500 border-transparent hover:text-slate-300'}`}
          >
            {sheet}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default ExcelViewer;
