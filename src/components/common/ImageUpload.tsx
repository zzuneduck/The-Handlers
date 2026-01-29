import { useRef, useState, useCallback } from 'react';
import { uploadImage, deleteImage } from '../../lib/storage';

interface ImageUploadProps {
  bucket: string;
  folder: string;
  value?: string;
  onUpload: (url: string) => void;
  onDelete?: () => void;
  label?: string;
}

export default function ImageUpload({
  bucket,
  folder,
  value,
  onUpload,
  onDelete,
  label,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        const url = await uploadImage(file, bucket, folder);
        onUpload(url);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, onUpload],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    if (!value) return;
    setUploading(true);
    try {
      await deleteImage(bucket, value);
    } catch {
      // 스토리지 삭제 실패해도 UI에서는 제거
    }
    onDelete?.();
    onUpload('');
    setUploading(false);
  };

  // 업로드된 이미지가 있는 경우
  if (value) {
    return (
      <div>
        {label && (
          <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
        )}
        <div className="relative inline-block">
          <img
            src={value}
            alt="업로드된 이미지"
            className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        disabled={uploading}
        className={[
          'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-[#03C75A] bg-[#03C75A]/5'
            : 'border-gray-300 hover:border-[#03C75A]/50 hover:bg-gray-50',
          uploading ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        {uploading ? (
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#03C75A] border-t-transparent" />
        ) : (
          <>
            <svg
              className="mb-1 h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16v-8m0 0l-3 3m3-3l3 3M6.75 20.25h10.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <p className="text-xs text-gray-500">
              클릭 또는 드래그하여 업로드
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              JPG, PNG, GIF, WebP (최대 5MB)
            </p>
          </>
        )}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
