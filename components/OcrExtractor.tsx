import React, { useState, useCallback, useRef, useEffect } from 'react';
import { extractTextFromImage } from '../services/geminiService';
import FileDropzone from './FileDropzone';
import ResultDisplay from './ResultDisplay';
import Spinner from './Spinner';
import PreviewModal from './PreviewModal';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Component responsible for the OCR (Image to Text) functionality
const OcrExtractor: React.FC = () => {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const timerRef = useRef<number | null>(null);

  // Effect for component unmount cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);


  // Callback for handling file selection from the dropzone
  const handleFileSelect = useCallback((selectedFile: File) => {
    // Reset previous results and any running process
    setExtractedText('');
    setError('');
    setIsLoading(false);
    setProgress(0);
    setProgressMessage('');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`حجم الملف كبير جدًا. الحد الأقصى المسموح به هو ${MAX_FILE_SIZE_MB} ميجابايت.`);
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Set new file
    setFile(selectedFile);

    // Create a preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  // Callback to handle the text extraction process
  const handleExtractText = useCallback(async () => {
    if (!file) {
      setError('الرجاء تحديد ملف أولاً.');
      return;
    }

    setIsLoading(true);
    setError('');
    setExtractedText('');
    setProgress(0);
    setProgressMessage('جاري تهيئة العملية...');

    try {
        // --- Timer Simulation for UX ---
        const estimatedDurationSeconds = 15;
        let elapsedTime = 0;

        timerRef.current = window.setInterval(() => {
            elapsedTime += 1;
            const progressPercentage = Math.min(90, Math.round((elapsedTime / estimatedDurationSeconds) * 90));
            setProgress(progressPercentage);
            const remainingTime = Math.max(0, estimatedDurationSeconds - elapsedTime);
            
            if (remainingTime > 0) {
                 setProgressMessage(`جاري تحليل الصورة... الوقت المتبقي المتوقع: ~${remainingTime} ثانية`);
            } else {
                 setProgressMessage(`العملية تستغرق وقتاً أطول من المتوقع، الرجاء الانتظار...`);
                 if(timerRef.current) clearInterval(timerRef.current);
            }
        }, 1000);
      
        // --- File Reading (Promisified) ---
        const base64String = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(new Error("حدث خطأ أثناء قراءة الملف."));
        });

        if (!base64String) {
            throw new Error("لم نتمكن من تحويل الملف للمعالجة.");
        }

        // --- API Call ---
        const text = await extractTextFromImage(base64String, file.type);
        setExtractedText(text);

        // --- Success State ---
        if (timerRef.current) clearInterval(timerRef.current);
        setProgress(100);
        setProgressMessage('اكتمل الاستخراج بنجاح!');

    } catch (err) {
      // --- Error State ---
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(0);
      setProgressMessage('');
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      // --- Final Cleanup ---
      setIsLoading(false);
    }
  }, [file]);

  return (
    <div className="space-y-6">
      <FileDropzone
        onFileSelect={handleFileSelect}
        accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
        prompt="اسحب وأفلت صورة هنا، أو انقر للاختيار"
        maxSizeMb={MAX_FILE_SIZE_MB}
      />

      {/* Image Preview */}
      {preview && (
        <div className="text-center bg-slate-900/50 p-4 rounded-lg">
          <h3 className="font-bold mb-4 text-slate-300">معاينة الصورة</h3>
          <div
            className="inline-block cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
            aria-label="عرض الصورة بحجم أكبر"
          >
            <img src={preview} alt="معاينة" className="max-w-full max-h-80 mx-auto rounded-md shadow-lg" />
          </div>
        </div>
      )}

      {/* Extract Button */}
      <div className="text-center">
        <button
          onClick={handleExtractText}
          disabled={!file || isLoading}
          className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
        >
          {isLoading ? <Spinner /> : 'استخراج النص'}
        </button>
      </div>
      
       {/* Progress Bar */}
      {isLoading && (
        <div className="w-full bg-slate-700 rounded-full h-4 mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
           <p className="text-center text-sm mt-2 text-slate-300">{progressMessage}</p>
        </div>
      )}

      {/* Error Message Display */}
      {error && !isLoading && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
      
      {/* Result Display */}
      {extractedText && <ResultDisplay text={extractedText} />}

      {/* Modal for Image Preview */}
      <PreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={file?.name || 'معاينة الصورة'}
      >
        <div className="flex justify-center items-center h-full">
          <img src={preview || ''} alt="معاينة مكبرة" className="max-w-full max-h-[75vh] object-contain" />
        </div>
      </PreviewModal>
    </div>
  );
};

export default OcrExtractor;