'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  fetchLetter, 
  updateLetter, 
  deleteLetter, 
  reprocessOCR, 
  getFileUrl, 
  getDownloadUrl, 
  LetterDetails 
} from '@/lib/api';
import PDFViewer from '@/components/PDFViewer';
import OCRTextViewer from '@/components/OCRTextViewer';
import EditLetterModal from '@/components/EditLetterModal';
import LetterTracker from '@/components/LetterTracker';
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/StatusBadge';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Calendar, 
  User, 
  Hash, 
  Clock, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  FileText,
  Pencil
} from 'lucide-react';

export default function LetterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [details, setDetails] = useState<LetterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadLetter = async () => {
    try {
      const data = await fetchLetter(id);
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Could not load letter');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadLetter();
    }
  }, [id]);

  useEffect(() => {
    if (!details?.ocrRecord) return;
    if (details.ocrRecord.status === 'PENDING' || details.ocrRecord.status === 'PROCESSING') {
      const interval = setInterval(() => {
        loadLetter();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [details?.ocrRecord?.status]);

  const handleStatusChange = async (newStatus: any) => {
    if (!details) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateLetter(details.letter.id, { status: newStatus });
      setDetails(prev => prev ? { ...prev, letter: updated } : null);
      await loadLetter();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReprocessOCR = async () => {
    if (!details) return;
    setIsReprocessing(true);
    try {
      await reprocessOCR(details.letter.id);
      await loadLetter();
    } catch (err) {
      console.error('Failed to read text:', err);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!details) return;
    try {
      await deleteLetter(details.letter.id);
      router.push('/letters');
    } catch (err) {
      console.error('Failed to delete letter:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">Opening letter...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Letter Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error || 'Could not find this letter.'}</p>
        <Link
          href="/letters"
          className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Letters</span>
        </Link>
      </div>
    );
  }

  const { letter, attachments, ocrRecord } = details;
  const primaryAttachment = attachments[0];

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-start sm:items-center space-x-3">
          <Link
            href="/letters"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Back to letters list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                {letter.referenceNumber}
              </span>
              {letter.vemNumber && (
                <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60 inline-flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-500" />
                  {letter.vemNumber}
                </span>
              )}
              <TypeBadge type={letter.type} />
              <PriorityBadge priority={letter.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 truncate max-w-2xl">
              {letter.subject}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition transform active:scale-95"
            title="Edit letter details"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Letter</span>
          </button>

          {primaryAttachment && (
            <a
              href={getDownloadUrl(letter.id)}
              download
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Download File</span>
            </a>
          )}

          {deleteConfirm ? (
            <div className="flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 p-1 rounded-xl">
              <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold px-2">Delete this letter?</span>
              <button
                onClick={handleDelete}
                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition"
              title="Delete letter"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Split-Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Viewer */}
        <div className="lg:col-span-7 h-[500px] sm:h-[680px]">
          {primaryAttachment ? (
            <PDFViewer
              fileUrl={getFileUrl(letter.id)}
              downloadUrl={getDownloadUrl(letter.id)}
              fileName={primaryAttachment.originalName}
              isPdf={primaryAttachment.isPdf}
              isImage={primaryAttachment.isImage}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 p-8">
              <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No document attached</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This letter was saved without an attached file.</p>
            </div>
          )}
        </div>

        {/* Right Column: Tracking, Metadata & Read Text Panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Urgent Alert Banner */}
          {letter.priority === 'URGENT' && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Urgent Letter: Requires prompt attention or fast reply.</span>
            </div>
          )}

          {/* Letter Tracking Pipeline */}
          <LetterTracker letter={letter} ocrRecord={ocrRecord} />

          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Letter Information
              </h3>

              {/* Status Changer */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">Status:</span>
                <select
                  value={letter.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="RECEIVED">Received</option>
                  <option value="DRAFT">Draft</option>
                  <option value="UNDER_REVIEW">In Review</option>
                  <option value="PROCESSED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {letter.vemNumber && (
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    VEM Number:
                  </span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                    {letter.vemNumber}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">From (Sender):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{letter.sender}</span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">To (Receiver):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{letter.recipient}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Letter Date:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{letter.letterDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">
                    {letter.type === 'INCOMING' ? 'Date Received:' : 'Date Sent:'}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{letter.receivedSentDate}</span>
                </div>
              </div>

              {letter.tags && letter.tags.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 dark:text-slate-500 block mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {letter.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Text Panel */}
          <div className="h-[430px]">
            <OCRTextViewer
              ocrRecord={ocrRecord}
              onReprocess={handleReprocessOCR}
              isReprocessing={isReprocessing}
            />
          </div>
        </div>
      </div>

      {/* Edit Letter Modal */}
      <EditLetterModal
        isOpen={isEditOpen}
        letter={letter}
        onClose={() => setIsEditOpen(false)}
        onSaved={async (updated) => {
          setDetails((prev) => (prev ? { ...prev, letter: updated } : null));
          await loadLetter();
        }}
      />
    </div>
  );
}
