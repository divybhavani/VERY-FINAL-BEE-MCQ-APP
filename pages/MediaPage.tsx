import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { Image as ImageIcon, Plus, Search, Trash2, FileType, Eye, Video } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { AcademicNote, Role, Division } from '../types';

const MediaPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [media, setMedia] = useState<AcademicNote[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingItem, setDeletingItem] = useState<AcademicNote | null>(null);
  const [viewingMedia, setViewingMedia] = useState<AcademicNote | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [file, setFile] = useState<File | null>(null);
  const [uploadDivision, setUploadDivision] = useState<Division | 'ALL'>('ALL');
  const [inputMethod, setInputMethod] = useState<'FILE' | 'URL'>('URL');
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchMedia = async () => {
      if (selectedSubject) {
        try {
          const data = await supabaseService.getDocuments(selectedSubject);
          setMedia(data.filter(d => d.type === 'IMAGE' || d.type === 'VIDEO'));
        } catch (error) {
          console.error("Error fetching media:", error);
        }
      }
    };
    fetchMedia();
  }, [selectedSubject]);

  if (!selectedSubject || !currentUser) return null;
  const theme = THEMES[selectedSubject];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      
      if (selectedFile.type.startsWith('video/')) {
        setType('VIDEO');
      } else {
        setType('IMAGE');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Enter media title");
    if (inputMethod === 'FILE' && !file) return alert("Please select a file to upload");
    if (inputMethod === 'URL' && !externalUrl) return alert("Please enter a valid URL");
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let publicUrl = externalUrl;
      if (inputMethod === 'FILE' && file) {
        publicUrl = await supabaseService.uploadFile(file, 'academic-assets', (progress) => {
          setUploadProgress(progress);
        });
      }

      const newMedia: AcademicNote = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        type,
        fileUrl: publicUrl,
        subject: selectedSubject,
        division: uploadDivision,
        uploadedBy: currentUser.name,
        createdAt: Date.now()
      };

      await supabaseService.addDocument(newMedia);
      
      await supabaseService.addNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: 'New Media Uploaded',
        message: `"${title}" has been added to the media gallery.`,
        subject: selectedSubject,
        classTarget: uploadDivision,
        createdAt: Date.now()
      });

      const updatedDocs = await supabaseService.getDocuments(selectedSubject);
      setMedia(updatedDocs.filter(d => d.type === 'IMAGE' || d.type === 'VIDEO'));
      setTitle('');
      setFile(null);
      setExternalUrl('');
      setUploadProgress(0);
      setIsUploading(false);
      alert("Media uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload media: ${error.message || 'Check your storage bucket permissions.'}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string, division?: Division | 'ALL') => {
    try {
      const success = await supabaseService.deleteDocument(id, division);
      if (success) {
        setDeleteStatus({ message: "Item deleted successfully.", type: 'success' });
        setMedia(prev => {
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

  const filteredMedia = media.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchesDivision = currentUser.role === Role.ADMIN || d.division === 'ALL' || d.division === currentUser.division;
    return matchesSearch && matchesDivision;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Images & Video</h2>
          <p className="text-slate-400 text-sm">Access media materials for {selectedSubject.toLowerCase()}.</p>
        </div>
        {currentUser.role === Role.ADMIN && (
          <button 
            onClick={() => setIsUploading(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${theme.button}`}
          >
            <Plus className="w-5 h-5" /> UPLOAD MEDIA
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or keyword..."
          className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:border-slate-600"
        />
      </div>

      {isUploading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Upload Media</h3>
              <button onClick={() => setIsUploading(false)} className="text-slate-400 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Media Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                  placeholder="Lab Experiment 01"
                />
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
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Input Method</label>
                <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setInputMethod('URL')} className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${inputMethod === 'URL' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}`}>DIRECT URL</button>
                  <button type="button" onClick={() => setInputMethod('FILE')} className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${inputMethod === 'FILE' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}`}>UPLOAD FILE</button>
                </div>
              </div>
              
              {inputMethod === 'FILE' ? (
                <div 
                  onClick={() => document.getElementById('media-upload')?.click()}
                  className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center bg-black/40 cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <input 
                    id="media-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                  <FileType className={`w-10 h-10 mx-auto mb-2 ${file ? theme.accent : 'text-slate-600'}`} />
                  {file ? (
                    <p className="text-xs text-white font-medium truncate">{file.name}</p>
                  ) : (
                    <p className="text-xs text-slate-500">Click to select Image or Video (Small only)</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Media URL</label>
                    <input 
                      type="url" 
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Media Type</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setType('IMAGE')} className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${type === 'IMAGE' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}`}>IMAGE</button>
                      <button type="button" onClick={() => setType('VIDEO')} className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${type === 'VIDEO' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}`}>VIDEO</button>
                    </div>
                  </div>
                </div>
              )}
              {isSubmitting && inputMethod === 'FILE' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono uppercase">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${theme.accent} transition-all duration-300 ease-out`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-bold mt-4 shadow-xl transition-all ${isSubmitting ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : theme.button}`}
              >
                {isSubmitting ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMedia.map(item => (
          <div key={item.id} className={`group relative p-6 rounded-[28px] border border-white/5 bg-slate-900/40 hover:border-slate-600 transition-all overflow-hidden`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-slate-800 ${theme.accent}`}>
                {item.type === 'VIDEO' ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${
                  item.division === 'ALL' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {item.division}
                </span>
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border bg-slate-800 text-slate-300 border-slate-700">
                  {item.type}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1 truncate">{item.title}</h3>
            <p className="text-xs text-slate-400 font-mono mb-6">Uploaded by {item.uploadedBy}</p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setViewingMedia(item)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all bg-white/5 hover:bg-white/10 text-white border border-white/5`}
              >
                <Eye className="w-4 h-4" /> VIEW
              </button>
              {currentUser.role === Role.ADMIN && (
                <button 
                  onClick={() => setDeletingItem(item)}
                  className="p-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredMedia.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px]">
            <p className="text-slate-600 font-mono text-sm">NO MEDIA FOUND</p>
          </div>
        )}
      </div>

      {deletingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Delete Media</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete "{deletingItem.title}"? This action cannot be undone.</p>
            
            {deletingItem.division === 'ALL' ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => handleDelete(deletingItem.id)}
                  className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                >
                  DELETE EVERYWHERE
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => handleDelete(deletingItem.id, deletingItem.division)}
                  className="w-full py-3 rounded-xl font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/20 transition-colors"
                >
                  DELETE FOR {deletingItem.division} ONLY
                </button>
                <button 
                  onClick={() => handleDelete(deletingItem.id)}
                  className="w-full py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                >
                  DELETE EVERYWHERE
                </button>
                <button 
                  onClick={() => setDeletingItem(null)}
                  className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteStatus && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 ${
          deleteStatus.type === 'success' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
        }`}>
          {deleteStatus.message}
        </div>
      )}

      {viewingMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-center">
            <button 
              onClick={() => setViewingMedia(null)}
              className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="text-sm font-bold tracking-widest uppercase">Close</span>
              <Plus className="w-6 h-6 rotate-45" />
            </button>
            
            {viewingMedia.type === 'IMAGE' ? (
              <img 
                src={viewingMedia.fileUrl} 
                alt={viewingMedia.title}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
            ) : viewingMedia.type === 'VIDEO' ? (
              <video 
                src={viewingMedia.fileUrl} 
                controls 
                autoPlay
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl bg-black"
              />
            ) : null}
            
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-white">{viewingMedia.title}</h3>
              <p className="text-sm text-slate-400 mt-1">Uploaded by {viewingMedia.uploadedBy}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
