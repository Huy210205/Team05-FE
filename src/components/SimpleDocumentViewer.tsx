import React from 'react';
import { X, Download } from 'lucide-react';

interface SimpleDocumentViewerProps {
  documentUrl: string;
  fileName?: string;
  onClose: () => void;
}

/**
 * Simple Document Viewer using Google Docs Viewer
 * Miễn phí, không cần license key
 * Hỗ trợ: PDF, DOCX, XLSX, PPTX
 */
const SimpleDocumentViewer: React.FC<SimpleDocumentViewerProps> = ({ 
  documentUrl, 
  fileName = 'Document',
  onClose 
}) => {
  // Google Docs Viewer URL
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      {/* Modal container */}
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] m-4 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-gray-800 truncate max-w-md">
              {fileName}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download button */}
            <a
              href={documentUrl}
              download={fileName}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </a>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Viewer iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleDocumentViewer;
