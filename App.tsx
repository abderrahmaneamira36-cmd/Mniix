
import React, { useState, useCallback } from 'react';
import { Tab } from './types';
import OcrExtractor from './components/OcrExtractor';
import PdfExtractor from './components/PdfExtractor';
import TabButton from './components/TabButton';
import PreviewModal from './components/PreviewModal';

// Main App component
const App: React.FC = () => {
  // State to manage the currently active tab
  const [activeTab, setActiveTab] = useState<Tab>(Tab.OCR);
  // State to manage the install guide modal
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Memoized callback to handle tab changes
  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            المستخرج الذكي
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            استخرج النصوص من الصور وملفات PDF بدقة فائقة باستخدام الذكاء الاصطناعي
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-slate-700 mb-8">
          <TabButton
            label="استخراج النص من صورة (OCR)"
            isActive={activeTab === Tab.OCR}
            onClick={() => handleTabChange(Tab.OCR)}
          />
          <TabButton
            label="استخراج النص من PDF"
            isActive={activeTab === Tab.PDF}
            onClick={() => handleTabChange(Tab.PDF)}
          />
        </div>

        {/* Main Content Area - Renders the active tab's component */}
        <main className="bg-slate-800/50 rounded-xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm border border-slate-700">
          {activeTab === Tab.OCR ? <OcrExtractor /> : <PdfExtractor />}
        </main>
        
        {/* Footer */}
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p className="mb-2">تم التطوير بواسطة مهندس React خبير بواجهة Gemini API</p>
            <button 
              onClick={() => setIsInstallModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
            >
              كيفية تثبيت التطبيق
            </button>
        </footer>
      </div>

      {/* Installation Guide Modal */}
      <PreviewModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        title="دليل تثبيت التطبيق"
      >
        <div className="p-4 text-center">
            <p className="text-slate-300 mb-4">اتبع الخطوات في الصورة لتثبيت التطبيق على جهازك والوصول إليه بسهولة.</p>
            <img 
              src="/how-to-install.png" 
              alt="دليل تثبيت التطبيق" 
              className="rounded-lg shadow-lg mx-auto"
            />
        </div>
      </PreviewModal>
    </div>
  );
};

export default App;
