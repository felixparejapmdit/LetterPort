'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Letter } from '@/lib/api';
import { 
  X, 
  Printer, 
  QrCode, 
  FileText, 
  Check, 
  AlertCircle, 
  Calendar, 
  Clock, 
  ShieldAlert,
  Hash
} from 'lucide-react';

interface LetterStickerModalProps {
  isOpen: boolean;
  letter: Letter | null;
  onClose: () => void;
}

export default function LetterStickerModal({ isOpen, letter, onClose }: LetterStickerModalProps) {
  const [activeTab, setActiveTab] = useState<'sticker' | 'routing'>('sticker');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && letter) {
      // In production / local network, point to tracking URL on port 8765
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8765';
      const trackingUrl = `${origin}/letters/${letter.id}?track=true`;
      
      QRCode.toDataURL(trackingUrl, {
        width: 280,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, letter]);

  if (!isOpen || !letter) return null;

  const handlePrint = () => {
    window.print();
  };

  const isUrgent = letter.priority === 'URGENT' || letter.priority === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      {/* Print styles injected for clean sticker and routing slip printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-slip-area, #printable-slip-area * {
            visibility: visible;
          }
          #printable-slip-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0 no-print">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Sticker & Routing Slip Generator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 px-5 pt-2.5 gap-2 shrink-0 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('sticker')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'sticker'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Folder / Envelope Sticker Label</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routing')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'routing'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official Routing Slip</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div id="printable-slip-area" className="flex justify-center">
            {activeTab === 'sticker' ? (
              /* FOLDER / ENVELOPE STICKER */
              <div className="w-[380px] p-4 bg-white text-slate-900 rounded-xl border-2 border-slate-800 shadow-md flex flex-col justify-between space-y-3 font-sans">
                {/* Sticker Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-slate-900 text-white rounded">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-extrabold text-xs tracking-wider uppercase">LetterPort LMS</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                    {letter.type}
                  </span>
                </div>

                {/* Sticker Main Content */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="font-mono text-base font-black tracking-tight text-slate-950 leading-tight">
                      {letter.referenceNumber}
                    </div>

                    {letter.vemNumber && (
                      <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded inline-block border border-slate-200">
                        VEM: {letter.vemNumber}
                      </div>
                    )}

                    <div className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug pt-0.5">
                      {letter.subject}
                    </div>

                    <div className="text-[11px] text-slate-600 truncate">
                      <span className="font-semibold text-slate-800">To:</span> {letter.recipient}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Date: {letter.letterDate} {letter.dueDate && `• Due: ${letter.dueDate}`}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="shrink-0 flex flex-col items-center">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code" 
                        className="w-24 h-24 border border-slate-300 rounded p-1 bg-white"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Generating...
                      </div>
                    )}
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight mt-1">
                      Scan to Track
                    </span>
                  </div>
                </div>

                {/* Priority Footer Bar */}
                <div className={`text-[10px] font-extrabold px-2 py-1 rounded text-center tracking-wider uppercase ${
                  letter.priority === 'URGENT' 
                    ? 'bg-red-600 text-white' 
                    : letter.priority === 'HIGH' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-200 text-slate-800'
                }`}>
                  Priority: {letter.priority} &bull; Official Document
                </div>
              </div>
            ) : (
              /* OFFICIAL ROUTING / TRANSMITTAL SLIP */
              <div className="w-full max-w-xl bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-sm font-sans space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <h1 className="text-base font-black tracking-tight uppercase text-slate-950">
                      Routing & Transmittal Slip
                    </h1>
                    <p className="text-[11px] text-slate-500">LetterPort Letter Management System</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-black text-slate-900">
                      {letter.referenceNumber}
                    </div>
                    {letter.vemNumber && (
                      <div className="font-mono text-xs font-semibold text-slate-600">
                        VEM: {letter.vemNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Info Grid */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Letter Date</span>
                    <span className="font-semibold">{letter.letterDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Type / Direction</span>
                    <span className="font-semibold">{letter.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Priority / Due</span>
                    <span className={`font-bold ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
                      {letter.priority} {letter.dueDate ? `(${letter.dueDate})` : ''}
                    </span>
                  </div>
                  <div className="col-span-3 border-t border-slate-200 pt-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Subject / Description</span>
                    <span className="font-bold text-slate-900">{letter.subject}</span>
                  </div>
                  <div className="col-span-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">From (Sender)</span>
                      <span className="font-medium text-slate-800">{letter.sender}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">To (Recipient)</span>
                      <span className="font-medium text-slate-800">{letter.recipient}</span>
                    </div>
                  </div>
                </div>

                {/* Instructions / Action Checklist */}
                <div>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                    Action / Disposition Required
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span>For appropriate action</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span>For information / file</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span>For signature / approval</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span>For urgent reply</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span>For investigation</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span>Please see me</span>
                    </label>
                  </div>
                </div>

                {/* Routing Table */}
                <div>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                    Routing Chain & Signatures
                  </span>
                  <table className="w-full text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-300 px-2 py-1 text-left w-12">Step</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">Recipient / Office</th>
                        <th className="border border-slate-300 px-2 py-1 text-left w-24">Date Recv</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">Action Taken</th>
                        <th className="border border-slate-300 px-2 py-1 text-left w-24">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4].map((step) => (
                        <tr key={step} className="h-9">
                          <td className="border border-slate-300 px-2 py-1 font-mono text-center">{step}</td>
                          <td className="border border-slate-300 px-2 py-1"></td>
                          <td className="border border-slate-300 px-2 py-1"></td>
                          <td className="border border-slate-300 px-2 py-1"></td>
                          <td className="border border-slate-300 px-2 py-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer QR Verification */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-[10px] text-slate-500">
                    LetterPort Document Tracking Verification &bull; Keep with physical folder
                  </div>
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt="QR" 
                      className="w-12 h-12 border border-slate-300 rounded p-0.5"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0 no-print">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'sticker' 
              ? 'Print directly on adhesive sticker paper or standard paper.' 
              : 'Print 1-page transmittal slip to attach to physical routing folder.'}
          </p>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {activeTab === 'sticker' ? 'Sticker' : 'Slip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
