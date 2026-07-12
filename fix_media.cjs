const fs = require('fs');

let content = fs.readFileSync('pages/MediaPage.tsx', 'utf8');

content = content.replace(
  "const [uploadDivision, setUploadDivision] = useState<Division | 'ALL'>('ALL');",
  "const [uploadDivision, setUploadDivision] = useState<Division | 'ALL'>('ALL');\n  const [inputMethod, setInputMethod] = useState<'FILE' | 'URL'>('URL');\n  const [externalUrl, setExternalUrl] = useState('');"
);

content = content.replace(
  `  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Enter media title");
    if (!file) return alert("Please select a file to upload");
    
    setIsSubmitting(true);
    
    try {
      const publicUrl = await supabaseService.uploadFile(file);
      const newMedia: AcademicNote = {`,
  `  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Enter media title");
    if (inputMethod === 'FILE' && !file) return alert("Please select a file to upload");
    if (inputMethod === 'URL' && !externalUrl) return alert("Please enter a valid URL");
    
    setIsSubmitting(true);
    
    try {
      let publicUrl = externalUrl;
      if (inputMethod === 'FILE' && file) {
        publicUrl = await supabaseService.uploadFile(file);
      }
      const newMedia: AcademicNote = {`
);

content = content.replace(
  `setTitle('');
      setFile(null);
      setIsUploading(false);`,
  `setTitle('');
      setFile(null);
      setExternalUrl('');
      setIsUploading(false);`
);

content = content.replace(
  `              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Target Class</label>
                <div className="grid grid-cols-4 gap-2">
                  {['ALL', ...Object.values(Division)].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setUploadDivision(d as any)}
                      className={\`py-2 rounded-lg border text-[10px] font-bold transition-all \${uploadDivision === d ? \`bg-white/10 \${theme.accent} border-white/20\` : 'bg-transparent border-slate-800 text-slate-500'}\`}
                    >
                      {d === 'ALL' ? 'ALL CLASS' : d}
                    </button>
                  ))}
                </div>
              </div>
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
                <FileType className={\`w-10 h-10 mx-auto mb-2 \${file ? theme.accent : 'text-slate-600'}\`} />
                {file ? (
                  <p className="text-xs text-white font-medium truncate">{file.name}</p>
                ) : (
                  <p className="text-xs text-slate-500">Click to select Image or Video</p>
                )}
              </div>`,
  `              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Target Class</label>
                <div className="grid grid-cols-4 gap-2">
                  {['ALL', ...Object.values(Division)].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setUploadDivision(d as any)}
                      className={\`py-2 rounded-lg border text-[10px] font-bold transition-all \${uploadDivision === d ? \`bg-white/10 \${theme.accent} border-white/20\` : 'bg-transparent border-slate-800 text-slate-500'}\`}
                    >
                      {d === 'ALL' ? 'ALL CLASS' : d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Input Method</label>
                <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setInputMethod('URL')} className={\`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all \${inputMethod === 'URL' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}\`}>DIRECT URL</button>
                  <button type="button" onClick={() => setInputMethod('FILE')} className={\`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all \${inputMethod === 'FILE' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}\`}>UPLOAD FILE</button>
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
                  <FileType className={\`w-10 h-10 mx-auto mb-2 \${file ? theme.accent : 'text-slate-600'}\`} />
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
                      <button type="button" onClick={() => setType('IMAGE')} className={\`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all \${type === 'IMAGE' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}\`}>IMAGE</button>
                      <button type="button" onClick={() => setType('VIDEO')} className={\`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all \${type === 'VIDEO' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-800 text-slate-500'}\`}>VIDEO</button>
                    </div>
                  </div>
                </div>
              )}`
);

fs.writeFileSync('pages/MediaPage.tsx', content);
console.log('Done');
