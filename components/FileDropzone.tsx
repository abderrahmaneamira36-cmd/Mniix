import React, { useCallback, useState } from 'react';

// Define the props for the FileDropzone component
interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept: { [key: string]: string[] };
  prompt: string;
  maxSizeMb?: number;
}

// Reusable component for file input (drag-and-drop or click)
const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileSelect, accept, prompt, maxSizeMb }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  // Memoized callback for handling the drop event
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  // Memoized callback for handling drag-over event to provide visual feedback
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  }, [isDragActive]);

  // Memoized callback for handling drag-leave event
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  // Memoized callback for handling file selection via the file input dialog
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  }, [onFileSelect]);
  
  const acceptString = Object.keys(accept).join(',');

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 ${isDragActive ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-700/30'}`}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept={acceptString}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="font-semibold">{prompt}</p>
        <p className="text-sm">
          الأنواع المدعومة: {Object.values(accept).flat().join(', ')}
          {maxSizeMb && ` | الحجم الأقصى: ${maxSizeMb} ميجابايت`}
        </p>
      </div>
    </div>
  );
};

export default FileDropzone;
