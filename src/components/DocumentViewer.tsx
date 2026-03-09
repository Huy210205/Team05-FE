import React, { useEffect, useRef, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { X, Download, Loader2 } from 'lucide-react';

interface DocumentViewerProps {
  documentUrl: string;
  fileName?: string;
  onClose: () => void;
}

/**
 * Component để preview document (PDF, DOCX, XLSX, PPTX) bằng Apryse WebViewer
 */
const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documentUrl, 
  fileName = 'Document',
  onClose 
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    setIsLoading(true);
    setError(null);

    // Initialize WebViewer
    WebViewer(
      {
        path: '/webviewer-lib',
        initialDoc: documentUrl,
        licenseKey: 'demo:1762935254371:6018116b0300000000d9cdfc8ea0f72fd89a910e02e08d59b7d7201aaa',
      },
      viewerRef.current
    ).then((instance) => {
      const { documentViewer } = instance.Core;
      const { UI } = instance;

      // Tùy chỉnh UI
      UI.setHeaderItems((header) => {
        // Thêm nút download
        header.push({
          type: 'actionButton',
          img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
          onClick: () => {
            window.open(documentUrl, '_blank');
          },
          title: 'Download',
        });
      });

      // Event: Document loaded
      documentViewer.addEventListener('documentLoaded', () => {
        setIsLoading(false);
      });

      // Event: Document load error
      documentViewer.addEventListener('documentLoadError', (error) => {
        setIsLoading(false);
        setError('Không thể tải tài liệu. Vui lòng thử lại sau.');
      });

    }).catch((err) => {
      setIsLoading(false);
      setError('Không thể khởi tạo document viewer.');
    });

  }, [documentUrl, fileName]);

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

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Đang tải tài liệu...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center max-w-md px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Lỗi tải tài liệu</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Đóng
                </button>
                <a
                  href={documentUrl}
                  download={fileName}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Tải xuống
                </a>
              </div>
            </div>
          </div>
        )}

        {/* WebViewer container */}
        <div className="flex-1 overflow-hidden">
          <div ref={viewerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
