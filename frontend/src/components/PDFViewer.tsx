'use client';

import { useState } from 'react';
import { FileText, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  downloadUrl: string;
  fileName: string;
  isPdf: boolean;
  isImage: boolean;
}

export default function PDFViewer({
  fileUrl,
  downloadUrl,
  fileName,
  isPdf,
  isImage,
}: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700/60 shadow-lg">
      {/* Viewer Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 text-slate-200 text-xs">
        <div className="flex items-center space-x-2 truncate max-w-xs sm:max-w-md">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-medium truncate" title={fileName}>
            {fileName}
          </span>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono w-10 text-center text-slate-400">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1"></div>
            </>
          )}

          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={downloadUrl}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition text-xs shadow-sm"
            download
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Viewer Content Area */}
      <div className="flex-1 w-full h-full min-h-[500px] flex items-center justify-center bg-slate-950/60 overflow-auto p-2">
        {isPdf ? (
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full min-h-[600px] rounded border-0 bg-white"
            title={fileName}
          />
        ) : isImage ? (
          <div className="overflow-auto max-h-[700px] flex items-center justify-center p-4">
            <img
              src={fileUrl}
              alt={fileName}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
              className="max-h-[650px] object-contain rounded shadow-2xl origin-center"
            />
          </div>
        ) : (
          <div className="text-center p-8 text-slate-400">
            <FileText className="w-16 h-16 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-medium text-slate-300">Preview not supported for this file type</p>
            <p className="text-sm mt-1 text-slate-500">Please download the file to inspect its contents.</p>
            <a
              href={downloadUrl}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
