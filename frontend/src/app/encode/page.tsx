'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createLetter, 
  getNextReference, 
  getNextVem,
  fetchStatuses,
  fetchPriorities,
  fetchLetterTypes,
  ClassificationItem
} from '@/lib/api';
import PeopleAutocomplete from '@/components/PeopleAutocomplete';
import { 
  Upload, 
  FileText, 
  X, 
  Sparkles, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Hash,
  Paperclip,
  Trash2
} from 'lucide-react';

export default function EncodePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<string>('INCOMING');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [vemNumber, setVemNumber] = useState('');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedSentDate, setReceivedSentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('RECEIVED');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Multiple files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic classifications
  const [types, setTypes] = useState<ClassificationItem[]>([]);
  const [statuses, setStatuses] = useState<ClassificationItem[]>([]);
  const [priorities, setPriorities] = useState<ClassificationItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingRef, setFetchingRef] = useState(false);
  const [fetchingVem, setFetchingVem] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [tList, sList, pList] = await Promise.all([
          fetchLetterTypes().catch(() => []),
          fetchStatuses().catch(() => []),
          fetchPriorities().catch(() => [])
        ]);
        setTypes(tList);
        setStatuses(sList);
        setPriorities(pList);
      } catch (err) {
        console.error('Failed to load classifications:', err);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    const fetchCodes = async () => {
      setFetchingRef(true);
      setFetchingVem(true);
      try {
        const [ref, nextVem] = await Promise.all([
          getNextReference(type as any).catch(() => ''),
          getNextVem().catch(() => ''),
        ]);
        if (ref) setReferenceNumber(ref);
        if (nextVem) setVemNumber(nextVem);
      } catch (err) {
        console.error('Failed to get reference/VEM numbers:', err);
      } finally {
        setFetchingRef(false);
        setFetchingVem(false);
      }
    };
    fetchCodes();
    setStatus(type === 'INCOMING' ? 'RECEIVED' : 'DRAFT');
  }, [type]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFilesSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles = Array.from(fileList);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sender.trim() || !recipient.trim() || !subject.trim()) {
      setError('Please fill in Sender, Recipient, and Subject.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('referenceNumber', referenceNumber);
      if (vemNumber.trim()) {
        formData.append('vemNumber', vemNumber.trim());
      }
      formData.append('type', type);
      formData.append('sender', sender);
      formData.append('recipient', recipient);
      formData.append('subject', subject);
      formData.append('letterDate', letterDate);
      formData.append('receivedSentDate', receivedSentDate);
      formData.append('priority', priority);
      formData.append('status', status);
      if (dueDate) {
        formData.append('dueDate', dueDate);
      }
      formData.append('tags', JSON.stringify(tags));

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      if (selectedFiles.length > 0) {
        formData.append('file', selectedFiles[0]);
      }

      const created = await createLetter(formData);
      router.push(`/letters/${created.letter.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save letter');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Encode Letter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter letter metadata, contacts with auto-suggest, and attach multiple scans or PDFs.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-900 dark:text-rose-100">Missing Information</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Type / Direction Selector - Compact */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Letter Classification Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {types.length > 0 ? (
              types.map(t => (
                <button
                  key={t.id || t.code}
                  type="button"
                  onClick={() => setType(t.code)}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border font-semibold text-xs transition cursor-pointer ${
                    type === t.code
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setType('INCOMING')}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border font-semibold text-xs transition cursor-pointer ${
                    type === 'INCOMING'
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Incoming</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('OUTGOING')}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border font-semibold text-xs transition cursor-pointer ${
                    type === 'OUTGOING'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Outgoing</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Details Card - Compact */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Letter Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Reference Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reference Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setFetchingRef(true);
                    const ref = await getNextReference(type as any);
                    setReferenceNumber(ref);
                    setFetchingRef(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                  title="Generate new reference code"
                >
                  <RefreshCw className={`w-3 h-3 ${fetchingRef ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* VEM Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>VEM-Number</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Tracking</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vemNumber}
                  onChange={(e) => setVemNumber(e.target.value)}
                  className="w-full pl-7 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-900 dark:text-slate-100"
                />
                <Hash className="w-3 h-3 text-emerald-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={async () => {
                    setFetchingVem(true);
                    const nextVem = await getNextVem();
                    if (nextVem) setVemNumber(nextVem);
                    setFetchingVem(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                  title="Generate next VEM Number"
                >
                  <RefreshCw className={`w-3 h-3 ${fetchingVem ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
              >
                {priorities.length > 0 ? (
                  priorities.map(p => (
                    <option key={p.id || p.code} value={p.code}>{p.label}</option>
                  ))
                ) : (
                  <>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Needs Fast Reply)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Sender & Receiver with People Autocomplete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <PeopleAutocomplete
              label="From (Sender)"
              value={sender}
              onChange={setSender}
              placeholder="Sender name or organization..."
              required
            />
            <PeopleAutocomplete
              label="To (Receiver)"
              value={recipient}
              onChange={setRecipient}
              placeholder="Receiver name or department..."
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this letter about?"
              required
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Letter Date
              </label>
              <input
                type="date"
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'INCOMING' ? 'Date Received' : 'Date Sent'}
              </label>
              <input
                type="date"
                value={receivedSentDate}
                onChange={(e) => setReceivedSentDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Due Date (SLA)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Letter Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
              >
                {statuses.length > 0 ? (
                  statuses.map(s => (
                    <option key={s.id || s.code} value={s.code}>{s.label}</option>
                  ))
                ) : (
                  <>
                    <option value="RECEIVED">Received</option>
                    <option value="DRAFT">Draft</option>
                    <option value="UNDER_REVIEW">In Review</option>
                    <option value="PROCESSED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Categories & Tags (press Enter to add)
            </label>
            <div 
              onClick={() => tagInputRef.current?.focus()}
              className="flex flex-wrap gap-1 p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[34px] items-center cursor-text focus-within:border-slate-400 dark:focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-400/20"
            >
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[11px] font-medium"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(t);
                    }}
                    className="hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "e.g. invoice, finance, notice..." : ""}
                className="tag-input flex-1 bg-transparent border-0 border-none text-xs focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 min-w-[100px] p-0 m-0 shadow-none ring-0 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Document Upload Zone - Supports Multiple Files */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Attach Document Files ({selectedFiles.length})
            </h2>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              OCR Enabled
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                : selectedFiles.length > 0
                ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/jpeg,image/png,image/tiff,image/webp,image/svg+xml,.svg"
              className="hidden"
              onChange={(e) => {
                handleFilesSelect(e.target.files);
              }}
            />

            <div className="flex flex-col items-center">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click to browse files, or <span className="text-blue-600 dark:text-blue-400">drag multiple files here</span>
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Supports PDF, JPG, PNG, and TIFF (multiple uploads supported)
              </p>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Files ready for upload:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate mr-2">
                      <Paperclip className="w-3 h-3 text-blue-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Saving Letter...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Letter</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
