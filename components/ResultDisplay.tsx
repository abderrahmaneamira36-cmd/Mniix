
import React, { useState, useCallback } from 'react';
import { summarizeText } from '../services/geminiService';
import Spinner from './Spinner';

// Define props for the ResultDisplay component
interface ResultDisplayProps {
  text: string;
}

// Component to display the extracted text with copy and download actions
const ResultDisplay: React.FC<ResultDisplayProps> = ({ text }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [summaryCopyStatus, setSummaryCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string>('');

  // Callback to handle copying text to the clipboard
  const handleCopy = useCallback((content: string, type: 'main' | 'summary') => {
    navigator.clipboard.writeText(content).then(() => {
      if (type === 'main') {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } else {
        setSummaryCopyStatus('copied');
        setTimeout(() => setSummaryCopyStatus('idle'), 2000);
      }
    });
  }, []);

  // Callback to handle downloading the text as a .txt file
  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extracted-text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [text]);

  // Callback for downloading as a .doc file compatible with Word
  const handleDownloadWord = useCallback(() => {
    if (!text) return;

    // Convert newlines to <br /> for HTML formatting and wrap in a full HTML structure
    const contentAsHtml = text.replace(/\n/g, '<br />');
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>النص المستخرج</title>
        </head>
        <body>
          ${contentAsHtml}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extracted-text.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [text]);

  // Callback to handle text summarization
  const handleSummarize = useCallback(async () => {
    if (!text) return;
    setIsSummarizing(true);
    setSummaryError('');
    setSummary('');
    try {
        const result = await summarizeText(text);
        setSummary(result);
    } catch (err) {
        setSummaryError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء التلخيص.');
    } finally {
        setIsSummarizing(false);
    }
  }, [text]);


  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-slate-300">النص المستخرج</h3>
      
      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={handleSummarize}
          disabled={!text || isSummarizing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-cyan-700 rounded-md hover:bg-cyan-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isSummarizing ? (
            <Spinner/>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          )}
          {isSummarizing ? 'جاري التلخيص...' : 'تلخيص ذكي'}
        </button>
        <button
          onClick={() => handleCopy(text, 'main')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
        >
          {copyStatus === 'copied' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              تم النسخ!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              نسخ
            </>
          )}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          تنزيل .txt
        </button>
        <button
          onClick={handleDownloadWord}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          تنزيل .doc
        </button>
      </div>

      {/* Textarea for displaying the result */}
      <textarea
        readOnly
        value={text}
        className="w-full h-96 p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        placeholder="سيظهر النص المستخرج هنا..."
      />
      
      {/* Summary Section */}
      {summaryError && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{summaryError}</p>}
      
      {summary && (
        <div className="space-y-3 pt-4 border-t-2 border-slate-700/50">
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-cyan-400">الملخص الذكي</h4>
                 <button
                    onClick={() => handleCopy(summary, 'summary')}
                    className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
                    >
                    {summaryCopyStatus === 'copied' ? (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        تم النسخ
                        </>
                    ) : (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        نسخ الملخص
                        </>
                    )}
                </button>
            </div>
            <div className="w-full p-4 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 whitespace-pre-wrap">
                {summary}
            </div>
        </div>
      )}

    </div>
  );
};

export default ResultDisplay;
