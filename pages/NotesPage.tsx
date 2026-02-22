
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { FileText, Plus, Search, Trash2, FileType, Eye, Table as TableIcon } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { AcademicNote, Role, Division } from '../types';
import ExcelViewer from '../components/ExcelViewer';

const NotesPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [docs, setDocs] = useState<AcademicNote[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewingExcel, setViewingExcel] = useState<AcademicNote | null>(null);
  const [deletingItem, setDeletingItem] = useState<AcademicNote | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'PDF' | 'PPT' | 'DOC' | 'XLSX'>('PDF');
  const [file, setFile] = useState<File | null>(null);
  const [uploadDivision, setUploadDivision] = useState<Division | 'ALL'>('ALL');

  useEffect(() => {
    const fetchDocs = async () => {
      if (selectedSubject) {
        try {
          const data = await supabaseService.getDocuments(selectedSubject);
          setDocs(data);
        } catch (error) {
          console.error("Error fetching documents:", error);
        }
      }
    };
    fetchDocs();
  }, [selectedSubject]);

  if (!selectedSubject || !currentUser) return null;
  const theme = THEMES[selectedSubject];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        // Auto-fill title from filename without extension
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      // Auto-detect type from extension
      const ext = selectedFile.name.split('.').pop()?.toUpperCase();
      if (ext === 'PDF') setType('PDF');
      else if (ext === 'PPT' || ext === 'PPTX') setType('PPT');
      else if (ext === 'DOC' || ext === 'DOCX') setType('DOC');
      else if (ext === 'XLSX' || ext === 'XLS') setType('XLSX');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Enter document title");
    if (!file) return alert("Please select a file to upload");
    
    try {
      const newDoc: AcademicNote = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        type,
        fileUrl: URL.createObjectURL(file), // Create a local URL for preview/download
        subject: selectedSubject,
        division: uploadDivision,
        uploadedBy: currentUser.name,
        createdAt: Date.now()
      };

      await supabaseService.addDocument(newDoc);
      
      // Create notification
      await supabaseService.addNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: 'New Note Uploaded',
        message: `"${title}" has been added to the registry.`,
        subject: selectedSubject,
        classTarget: uploadDivision,
        createdAt: Date.now()
      });

      const updatedDocs = await supabaseService.getDocuments(selectedSubject);
      setDocs(updatedDocs);
      setTitle('');
      setFile(null);
      setIsUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload note.");
    }
  };

  const handleDelete = async (id: string, division?: Division | 'ALL') => {
    try {
      const success = await supabaseService.deleteDocument(id, division);
      if (success) {
        setDeleteStatus({ message: "Item deleted successfully.", type: 'success' });
        setDocs(prev => {
          if (!division || division === 'ALL') {
            return prev.filter(d => d.id !== id);
          }
          return prev.filter(d => !(d.id === id && d.division === division));
        });
      } else {
        setDeleteStatus({ message: "No record found for selected class.", type: 'error' });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus({ message: "Failed to delete item.", type: 'error' });
    }
    setDeletingItem(null);
    setTimeout(() => setDeleteStatus(null), 3000);
  };

  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchesDivision = currentUser.role === Role.ADMIN || d.division === 'ALL' || d.division === currentUser.division;
    return matchesSearch && matchesDivision;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Academic Notes</h2>
          <p className="text-slate-400 text-sm">Access academic materials for {selectedSubject.toLowerCase()}.</p>
        </div>
        {currentUser.role === Role.ADMIN && (
          <button 
            onClick={() => setIsUploading(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${theme.button}`}
          >
            <Plus className="w-5 h-5" /> UPLOAD NOTES
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename or keyword..."
          className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:border-slate-600"
        />
      </div>

      {isUploading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Upload Asset</h3>
              <button onClick={() => setIsUploading(false)} className="text-slate-400 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Note Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                  placeholder="Lecture 01 - Basics"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">File Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['PDF', 'PPT', 'DOC', 'XLSX'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t as any)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${type === t ? `bg-white/10 ${theme.accent} border-white/20` : 'bg-transparent border-slate-800 text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Target Class</label>
                <div className="grid grid-cols-4 gap-2">
                  {['ALL', ...Object.values(Division)].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setUploadDivision(d as any)}
                      className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${uploadDivision === d ? `bg-white/10 ${theme.accent} border-white/20` : 'bg-transparent border-slate-800 text-slate-500'}`}
                    >
                      {d === 'ALL' ? 'ALL CLASS' : d}
                    </button>
                  ))}
                </div>
              </div>
              <div 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center bg-black/40 cursor-pointer hover:border-slate-600 transition-colors"
              >
                <input 
                  id="file-upload"
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                <FileType className={`w-10 h-10 mx-auto mb-2 ${file ? theme.accent : 'text-slate-600'}`} />
                {file ? (
                  <p className="text-xs text-white font-medium truncate">{file.name}</p>
                ) : (
                  <p className="text-xs text-slate-500">Click to select PDF, PPT, DOC, or XLSX</p>
                )}
              </div>
              <button type="submit" className={`w-full py-4 rounded-xl font-bold mt-4 shadow-xl ${theme.button}`}>CONFIRM UPLOAD</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className={`group relative p-6 rounded-[28px] border border-white/5 bg-slate-900/40 hover:border-slate-600 transition-all overflow-hidden`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-slate-800 ${theme.accent}`}>
                {doc.type === 'XLSX' ? <TableIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div className="flex gap-2">
                {doc.type === 'XLSX' && (
                  <button 
                    onClick={() => setViewingExcel(doc)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="View Spreadsheet"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                )}
                {currentUser.role === Role.ADMIN && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingItem(doc);
                    }} 
                    className="p-2 text-red-500/50 hover:text-red-500 transition-colors bg-red-500/10 rounded-lg"
                    title="Delete Note"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-white font-bold mb-1 truncate pr-16">{doc.title}</h3>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
              <span className={`px-2 py-0.5 rounded-full bg-slate-800 ${theme.accent}`}>{doc.type}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{doc.division === 'ALL' ? 'ALL CLASSES' : `DIV ${doc.division}`}</span>
              <span>By {doc.uploadedBy}</span>
            </div>
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px]">
            <p className="text-slate-600 font-mono text-sm">NO NOTES FOUND IN REGISTRY</p>
          </div>
        )}
      </div>

      {viewingExcel && (
        <ExcelViewer 
          fileUrl={viewingExcel.fileUrl} 
          title={viewingExcel.title} 
          onClose={() => setViewingExcel(null)} 
          theme={theme}
        />
      )}

      {deletingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Delete this item from:</h3>
            <p className="text-slate-400 text-sm mb-6">Select the class scope for deletion of "{deletingItem.title}"</p>
            
            <div className="grid grid-cols-1 gap-3 mb-8">
              {Object.values(Division).map(div => (
                <button
                  key={div}
                  onClick={() => handleDelete(deletingItem.id, div)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-white font-bold hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                >
                  {div} ONLY
                </button>
              ))}
              <button
                onClick={() => handleDelete(deletingItem.id, 'ALL')}
                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
              >
                ALL CLASSES
              </button>
            </div>
            
            <button 
              onClick={() => setDeletingItem(null)}
              className="w-full py-3 text-slate-500 font-bold hover:text-white transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {deleteStatus && (
        <div className={`fixed bottom-8 right-8 z-[300] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500 ${deleteStatus.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          <p className="font-bold text-sm uppercase tracking-widest">{deleteStatus.message}</p>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
