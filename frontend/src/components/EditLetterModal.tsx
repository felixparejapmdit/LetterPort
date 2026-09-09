'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Letter, 
  Attachment,
  updateLetter, 
  fetchLetter, 
  addAttachment, 
  deleteAttachment, 
  combinePdfs, 
  getAttachmentUrl,
  fetchStatuses,
  fetchPriorities,
  fetchLetterTypes,
  ClassificationItem
} from '@/lib/api';
import PeopleAutocomplete from './PeopleAutocomplete';
import { 
  X, 
  Save, 
  Tag, 
  AlertCircle, 
  RefreshCw,
  Hash, 
  Calendar, 
  FileText,
  Paperclip,
  Upload,
  Trash2,
  Eye,
  FileCheck,
  Combine,
  CheckCircle2
} from 'lucide-react';

interface EditLetterModalProps {
  isOpen: boolean;
  letter: Letter | null;
  onClose: () => void;
  onSaved: (updatedLetter: Letter) => void;
}

export default function EditLetterModal({
  isOpen,
  letter,
  onClose,
  onSaved
}: EditLetterModalProps) {
  const [formData, setFormData] = useState<{
    type: string;
    sender: string;
    recipient: string;
    subject: string;
    vemNumber: string;
    letterDate: string;
    receivedSentDate: string;
    status: string;
    priority: string;
    dueDate: string;
    tags: string[];
  }>({
    type: 'INCOMING',
    sender: '',
    recipient: '',
    subject: '',
    vemNumber: '',
    letterDate: '',
    receivedSentDate: '',
    status: 'RECEIVED',
    priority: 'MEDIUM',
    dueDate: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [mergingPdfs, setMergingPdfs] = useState(false);

  // Dynamic Classifications
  const [types, setTypes] = useState<ClassificationItem[]>([]);
  const [statuses, setStatuses] = useState<ClassificationItem[]>([]);
  const [priorities, setPriorities] = useState<ClassificationItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  const loadLetterData = async (letterId: string) => {
    try {
      setLoadingAttachments(true);
      const details = await fetchLetter(letterId);
      if (details?.attachments) {
        setAttachments(details.attachments);
      }
    } catch (err) {
      console.error('Error fetching letter details:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const loadClassifications = async () => {
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

  useEffect(() => {
    if (letter) {
      setFormData({
        type: letter.type || 'INCOMING',
        sender: letter.sender || '',
        recipient: letter.recipient || '',
        subject: letter.subject || '',
        vemNumber: letter.vemNumber || '',
        letterDate: letter.letterDate ? letter.letterDate.split('T')[0] : '',
        receivedSentDate: letter.receivedSentDate ? letter.receivedSentDate.split('T')[0] : '',
        status: letter.status || 'RECEIVED',
        priority: letter.priority || 'MEDIUM',
        dueDate: letter.dueDate ? letter.dueDate.split('T')[0] : '',
        tags: Array.isArray(letter.tags) ? [...letter.tags] : []
      });
      setError(null);
      setSuccessMsg(null);
      setTagInput('');
      loadLetterData(letter.id);
      loadClassifications();
    }
  }, [letter]);

  if (!isOpen || !letter) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,|,$/g, '');
      if (val && !formData.tags.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setError(null);
      await addAttachment(letter.id, file);
      setSuccessMsg(`File "${file.name}" uploaded successfully`);
      await loadLetterData(letter.id);
    } catch (err: any) {
      setError(err.message || 'Failed to upload attachment');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete attachment "${name}"?`)) return;

    try {
      setError(null);
      await deleteAttachment(letter.id, attachmentId);
      setSuccessMsg(`Attachment "${name}" deleted`);
      await loadLetterData(letter.id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete attachment');
    }
  };

  const handleCombinePdfs = async (additionalFile?: File) => {
    try {
      setMergingPdfs(true);
      setError(null);
      await combinePdfs(letter.id, additionalFile);
      setSuccessMsg('PDF documents combined successfully into a single consolidated file');
      await loadLetterData(letter.id);
    } catch (err: any) {
      setError(err.message || 'Failed to combine PDFs');
    } finally {
      setMergingPdfs(false);
      if (mergeFileInputRef.current) mergeFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    if (!formData.sender.trim()) {
      setError('Please enter a sender');
      return;
    }
    if (!formData.recipient.trim()) {
      setError('Please enter a recipient');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateLetter(letter.id, formData as any);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const pdfCount = attachments.filter(a => a.isPdf || a.mimeType?.includes('pdf') || a.originalName?.toLowerCase().endsWith('.pdf')).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 shrink-0">
              {letter.referenceNumber}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Edit Letter
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable & Compact */}
        <form onSubmit={handleSubmit} id="edit-letter-form" className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {error && (
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Subject *
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Letter subject or title"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Type & VEM Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Letter Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {types.length > 0 ? (
                  types.map(t => (
                    <option key={t.id || t.code} value={t.code}>{t.label}</option>
                  ))
                ) : (
                  <>
                    <option value="INCOMING">Incoming</option>
                    <option value="OUTGOING">Outgoing</option>
                    <option value="INTERNAL">Internal</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                VEM Number
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={formData.vemNumber}
                  onChange={(e) => setFormData({ ...formData, vemNumber: e.target.value })}
                  placeholder="e.g. VEM-2026-0001"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sender & Recipient with Auto-Suggest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <PeopleAutocomplete
              label="From (Sender)"
              value={formData.sender}
              onChange={(val) => setFormData(prev => ({ ...prev, sender: val }))}
              placeholder="Sender name or department..."
              required
            />
            <PeopleAutocomplete
              label="To (Recipient)"
              value={formData.recipient}
              onChange={(val) => setFormData(prev => ({ ...prev, recipient: val }))}
              placeholder="Recipient name or office..."
              required
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {priorities.length > 0 ? (
                  priorities.map(p => (
                    <option key={p.id || p.code} value={p.code}>{p.label}</option>
                  ))
                ) : (
                  <>
                    <option value="URGENT">⚠️ Urgent</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Letter Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  value={formData.letterDate}
                  onChange={(e) => setFormData({ ...formData, letterDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Date Recv/Sent
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  value={formData.receivedSentDate}
                  onChange={(e) => setFormData({ ...formData, receivedSentDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Target Due Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Tags
            </label>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1.5">
              <div className="flex flex-wrap gap-1 min-h-[22px]">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-[11px] font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Tag className="w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag and press Enter"
                  className="w-full text-xs bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Attached Files & PDF Combining Management */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Attached Files ({attachments.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Upload New Attachment Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                />
                <button
                  type="button"
                  disabled={uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-medium transition cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>{uploadingFile ? 'Uploading...' : 'Add File'}</span>
                </button>

                {/* Combine PDFs Button */}
                {pdfCount >= 2 && (
                  <button
                    type="button"
                    disabled={mergingPdfs}
                    onClick={() => handleCombinePdfs()}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded text-[11px] font-medium transition cursor-pointer"
                    title="Combine all attached PDFs into one merged document"
                  >
                    <Combine className="w-3 h-3" />
                    <span>{mergingPdfs ? 'Combining...' : 'Merge PDFs'}</span>
                  </button>
                )}
              </div>
            </div>

            {loadingAttachments ? (
              <div className="text-center py-3 text-slate-400 text-xs">Loading attachments...</div>
            ) : attachments.length === 0 ? (
              <div className="p-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-xs">
                No attachments linked yet. Click "Add File" to attach scanned documents.
              </div>
            ) : (
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <FileCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate" title={att.originalName}>
                          {att.originalName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(att.fileSize / 1024).toFixed(1)} KB • {att.mimeType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={getAttachmentUrl(letter.id, att.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                        title="View file"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id, att.originalName)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions - Compact */}
        <div className="flex items-center justify-end space-x-2 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-letter-form"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition cursor-pointer active:scale-95"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
