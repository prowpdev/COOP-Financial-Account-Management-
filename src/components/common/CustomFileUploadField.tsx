import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileCheck,
  Eye,
  Trash2,
  Download,
  X,
  File
} from 'lucide-react';

export interface CustomFileValue {
  name: string;
  size?: number;
  type?: string;
  dataUrl: string;
  uploadedAt?: string;
}

interface CustomFileUploadFieldProps {
  label: string;
  fieldType?: 'File' | 'Image' | 'PDF' | 'Document' | string;
  required?: boolean;
  value?: string | CustomFileValue | null;
  onChange: (value: CustomFileValue | null) => void;
  disabled?: boolean;
  className?: string;
  helpText?: string;
}

export const CustomFileUploadField: React.FC<CustomFileUploadFieldProps> = ({
  label,
  fieldType = 'File',
  required = false,
  value,
  onChange,
  disabled = false,
  className = '',
  helpText
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize value representation
  const parsedFile: CustomFileValue | null = React.useMemo(() => {
    if (!value) return null;
    if (typeof value === 'string') {
      const isDataUrl = value.startsWith('data:');
      const isImg = isDataUrl && value.startsWith('data:image/');
      const isPdf = isDataUrl && value.includes('application/pdf');
      return {
        name: isImg ? `${label.toLowerCase().replace(/\s+/g, '_')}.jpg` : `${label.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        type: isImg ? 'image/jpeg' : isPdf ? 'application/pdf' : 'application/octet-stream',
        dataUrl: value,
        uploadedAt: new Date().toISOString()
      };
    }
    if (typeof value === 'object' && value.dataUrl) {
      return value as CustomFileValue;
    }
    return null;
  }, [value, label]);

  const normalizedType = (fieldType || '').toUpperCase();
  const isImageField = normalizedType === 'IMAGE' || (parsedFile?.type || '').startsWith('image/');
  const isPdfField = normalizedType === 'PDF' || (parsedFile?.type || '').includes('pdf') || (parsedFile?.name || '').toLowerCase().endsWith('.pdf');

  const handleProcessFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const fileData: CustomFileValue = {
        name: file.name,
        size: file.size,
        type: file.type || (isImageField ? 'image/jpeg' : isPdfField ? 'application/pdf' : 'application/octet-stream'),
        dataUrl,
        uploadedAt: new Date().toISOString()
      };
      onChange(fileData);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'File attached';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parsedFile?.dataUrl) return;
    const link = document.createElement('a');
    link.href = parsedFile.dataUrl;
    link.download = parsedFile.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          {isImageField ? (
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          ) : isPdfField ? (
            <FileText className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <File className="w-3.5 h-3.5 text-sky-400" />
          )}
          <span>{label}</span>
          {required && <span className="text-rose-400">*</span>}
        </label>
        {parsedFile && (
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <FileCheck className="w-3 h-3" />
            <span>Attached</span>
          </span>
        )}
      </div>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        disabled={disabled}
        accept={
          isImageField
            ? 'image/jpeg,image/png,image/webp,image/gif'
            : isPdfField
            ? 'application/pdf'
            : '*/*'
        }
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* If file is already uploaded */}
      {parsedFile ? (
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3 group hover:border-slate-600 transition">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Thumbnail or Icon */}
            {isImageField && parsedFile.dataUrl ? (
              <div
                onClick={() => setIsPreviewOpen(true)}
                className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700 overflow-hidden shrink-0 cursor-pointer hover:opacity-85 transition relative group/img"
              >
                <img
                  src={parsedFile.dataUrl}
                  alt={parsedFile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                {isPdfField ? (
                  <FileText className="w-5 h-5 text-rose-400" />
                ) : (
                  <File className="w-5 h-5 text-sky-400" />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate" title={parsedFile.name}>
                {parsedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                <span>{formatFileSize(parsedFile.size)}</span>
                {parsedFile.uploadedAt && (
                  <>
                    <span>•</span>
                    <span>{new Date(parsedFile.uploadedAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              title="Preview / View Document"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              title="Download File"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace File"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium rounded-lg transition cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  title="Remove File"
                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-700/80 bg-slate-950/60 hover:bg-slate-900/60 hover:border-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              Click to upload
            </span>{' '}
            <span className="text-xs text-slate-400">or drag and drop</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {isImageField
              ? 'JPG, PNG, or WebP photo up to 10MB'
              : isPdfField
              ? 'Official PDF document up to 25MB'
              : 'PDF, DOC, JPG, or Scanned Document up to 25MB'}
          </p>
        </div>
      )}

      {helpText && <p className="text-[10px] text-slate-400">{helpText}</p>}

      {/* Preview Modal / Lightbox */}
      {isPreviewOpen && parsedFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center space-x-2.5 min-w-0">
                {isImageField ? (
                  <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{parsedFile.name}</h3>
                  <p className="text-[11px] text-slate-400">{label} • {formatFileSize(parsedFile.size)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-950 min-h-[350px]">
              {isImageField ? (
                <img
                  src={parsedFile.dataUrl}
                  alt={parsedFile.name}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-lg border border-slate-800"
                />
              ) : isPdfField ? (
                <iframe
                  src={parsedFile.dataUrl}
                  title={parsedFile.name}
                  className="w-full h-[65vh] rounded-lg border border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <File className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-sm font-medium text-white">{parsedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    Preview not directly supported in browser frame. You can download the file to inspect.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Download File Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
