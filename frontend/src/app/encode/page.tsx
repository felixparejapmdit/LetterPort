'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createLetter, getNextReference, getNextVem } from '@/lib/api';
import { 
  Upload, 
  FileText, 
  X, 
  Sparkles, 
  Send, 
  Inbox, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Hash
} from 'lucide-react';

export default function EncodePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingRef, setFetchingRef] = useState(false);
  const [fetchingVem, setFetchingVem] = useState(false);

  useEffect(() => {
    const fetchCodes = async () => {
      setFetchingRef(true);
      setFetchingVem(true);
      try {
        const [ref, nextVem] = await Promise.all([
          getNextReference(type).catch(() => ''),
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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
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

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const created = await createLetter(formData);
      router.push(`/letters/${created.letter.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save letter');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Upload Letter
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter letter details and upload a document scan or PDF.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-900 dark:text-rose-100">Missing Information</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Direction Selector */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Letter Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('INCOMING')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition ${
                type === 'INCOMING'
                  ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Inbox className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Incoming (Received)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('OUTGOING')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition ${
                type === 'OUTGOING'
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Outgoing (Sent)</span>
            </button>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Letter Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reference Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reference Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setFetchingRef(true);
                    const ref = await getNextReference(type);
                    setReferenceNumber(ref);
                    setFetchingRef(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 rounded"
                  title="Generate new reference code"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingRef ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* VEM Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>VEM-Number</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Tracking</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vemNumber}
                  onChange={(e) => setVemNumber(e.target.value)}
                  placeholder=""
                  className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-900 dark:text-slate-100"
                />
                <Hash className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={async () => {
                    setFetchingVem(true);
                    const nextVem = await getNextVem();
                    if (nextVem) setVemNumber(nextVem);
                    setFetchingVem(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 rounded"
                  title="Generate next VEM Number"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingVem ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (Needs Fast Reply)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From (Sender) *
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Sender name or organization"
                required
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                To (Receiver) *
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Receiver name or department"
                required
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this letter about?"
              required
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Letter Date
              </label>
              <input
                type="date"
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'INCOMING' ? 'Date Received' : 'Date Sent'}
              </label>
              <input
                type="date"
                value={receivedSentDate}
                onChange={(e) => setReceivedSentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Due Date (SLA)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Auto-set by Priority"
                title="Leave empty to auto-set (+3d Urgent, +5d High, +7d Normal)"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Letter Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
              >
                <option value="RECEIVED">Received</option>
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">In Review</option>
                <option value="PROCESSED">Completed / Done</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Categories & Tags (optional, press Enter to add)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[42px] items-center">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-semibold"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "e.g. invoice, finance, meeting..." : ""}
                className="flex-1 bg-transparent border-none text-xs focus:outline-none text-slate-700 dark:text-slate-200 min-w-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Document Upload Zone */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Attach Letter Document (PDF or Photo)
            </h2>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Automatic Text Reading Enabled
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
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                : selectedFile
                ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/tiff,image/webp,image/svg+xml,.svg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="max-h-36 rounded shadow-md mb-3 object-contain border dark:border-slate-700"
                  />
                ) : (
                  <div className="p-3 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-xl mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setFilePreviewUrl(null);
                  }}
                  className="mt-3 text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Click to choose a letter file, or <span className="text-blue-600 dark:text-blue-400">drag it here</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Supports PDF, JPG, and PNG
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Letter...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Letter</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
