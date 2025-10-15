import React, { useState, useCallback, useRef, useEffect } from 'react';
import { extractTextFromImages } from '../services/geminiService';
import FileDropzone from './FileDropzone';
import ResultDisplay from './ResultDisplay';
import Spinner from './Spinner';
import PreviewModal from './PreviewModal';

// Reference to the pdf.js library loaded from CDN
declare const pdfjsLib: any;

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Internal component for rendering PDF inside the modal
const PdfViewer = ({ file }: { file: File }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (event) => {
      try {
        const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
        const doc = await pdfjsLib.getDocument(pdfData).promise;
        setPdfDoc(doc);
      } catch (err) {
        setError('فشل في تحميل ملف PDF للمعاينة.');
      }
    };
    reader.onerror = () => {
      setError('فشل في قراءة ملف PDF للمعاينة.');
    };
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async (pageNum: number) => {
      setIsRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
        }
      } catch (err) {
        setError('فشل في عرض صفحة PDF.');
      }
      setIsRendering(false);
    };

    renderPage(currentPage);
  }, [pdfDoc, currentPage]);
  
  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(pdfDoc.numPages, prev + 1));
  
  if (error) return <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>;
  if (!pdfDoc) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pagination Controls */}
      <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-md">
        <button onClick={goToPrevPage} disabled={currentPage <= 1 || isRendering} className="px-4 py-2 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600">السابق</button>
        <span className="font-mono text-slate-300">صفحة {currentPage} من {pdfDoc.numPages}</span>
        <button onClick={goToNextPage} disabled={currentPage >= pdfDoc.numPages || isRendering} className="px-4 py-2 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600">التالي</button>
      </div>
      {/* Canvas for PDF Page */}
      <div className="relative w-full flex justify-center">
        {isRendering && <div className="absolute inset-0 bg-slate-800/50 flex justify-center items-center rounded-md"><Spinner /></div>}
        <canvas ref={canvasRef} className="rounded-md shadow-lg max-w-full"></canvas>
      </div>
    </div>
  );
};


// Component for extracting text from PDF files
const PdfExtractor: React.FC = () => {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Using a ref to abort ongoing processing if a new file is selected
  const abortControllerRef = useRef<AbortController | null>(null);

  // Callback for file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    // If a process is running, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Reset state for the new file
    setExtractedText('');
    setError('');

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`حجم الملف كبير جدًا. الحد الأقصى المسموح به هو ${MAX_FILE_SIZE_MB} ميجابايت.`);
        setFile(null);
        setFileName('');
        return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setProgress(0);
    setProgressMessage('');
  }, []);

  // Main function to handle the PDF text extraction process
  const handleExtractText = useCallback(async () => {
    if (!file) {
      setError('الرجاء تحديد ملف PDF أولاً.');
      return;
    }

    // Initialize state for a new extraction process
    setIsLoading(true);
    setError('');
    setExtractedText('');
    setProgress(0);
    setProgressMessage('جاري قراءة ملف PDF...');
    
    // Create a new AbortController for this operation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onload = async (event) => {
        try {
          if (controller.signal.aborted) return;
          const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(pdfData).promise;
          const numPages = pdf.numPages;
          const pageImages: { base64: string; mimeType: string }[] = [];

          // Process each page of the PDF
          for (let i = 1; i <= numPages; i++) {
            if (controller.signal.aborted) throw new Error('Operation aborted');
            
            setProgressMessage(`جاري معالجة الصفحة ${i} من ${numPages}...`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                // Convert canvas to a base64 JPEG image
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                pageImages.push({
                    base64: imageDataUrl.split(',')[1],
                    mimeType: 'image/jpeg',
                });
            }
            // Update progress bar
            setProgress(Math.round((i / numPages) * 50)); // 50% for page processing
          }
          
          if (controller.signal.aborted) return;

          setProgressMessage('جاري استخراج النص باستخدام الذكاء الاصطناعي...');
          // Send all page images to Gemini API
          const text = await extractTextFromImages(pageImages);
          if (controller.signal.aborted) return;

          setExtractedText(text);
          setProgress(100); // Done
          setProgressMessage('اكتملت المعالجة بنجاح!');

        } catch (err) {
           if (err instanceof Error && err.name !== 'AbortError') {
             setError(err.message || 'حدث خطأ أثناء معالجة PDF.');
           }
        } finally {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      };
      reader.onerror = () => {
        throw new Error("Error reading the PDF file.");
      }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
        setIsLoading(false);
        abortControllerRef.current = null;
    }
  }, [file]);

  return (
    <div className="space-y-6">
      <FileDropzone
        onFileSelect={handleFileSelect}
        accept={{ 'application/pdf': ['.pdf'] }}
        prompt="اسحب وأفلت ملف PDF هنا، أو انقر للاختيار"
        maxSizeMb={MAX_FILE_SIZE_MB}
      />
      
      {fileName && (
        <div className="text-center text-slate-400 flex justify-center items-center gap-4">
            <p>الملف المحدد: <span className="font-bold">{fileName}</span></p>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-sm bg-slate-700 hover:bg-slate-600 text-cyan-400 font-semibold py-1 px-3 rounded-lg transition-colors"
            >
                معاينة
            </button>
        </div>
      )}

      {/* Progress Bar */}
      {isLoading && (
        <div className="w-full bg-slate-700 rounded-full h-4 mt-4">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
           <p className="text-center text-sm mt-2 text-slate-300">{progressMessage}</p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleExtractText}
          disabled={!file || isLoading}
          className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
        >
          {isLoading ? <Spinner /> : 'استخراج النص من PDF'}
        </button>
      </div>

      {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
      {extractedText && <ResultDisplay text={extractedText} />}

      {/* Modal for PDF Preview */}
      {file && (
          <PreviewModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={fileName}
          >
            <PdfViewer file={file} />
          </PreviewModal>
      )}
    </div>
  );
};

export default PdfExtractor;
