'use client';

import { useRef, useState } from 'react';

interface PhotoUploadProps {
  currentUrl?: string | null;
  onFileSelect: (file: File | null) => void;
}

export default function PhotoUpload({ currentUrl, onFileSelect }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="photo-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
        id="photo-upload-input"
      />

      {preview ? (
        <div className="photo-upload-preview">
          <img src={preview} alt="Preview" />
          <button className="photo-upload-remove" onClick={handleRemove} type="button">✕</button>
        </div>
      ) : (
        <div
          className="photo-upload-dropzone"
          onClick={() => inputRef.current?.click()}
        >
          <span style={{ fontSize: '1.5rem' }}>📷</span>
          <span style={{ fontSize: 'var(--font-size-sm)' }}>Click to add a photo (max 5MB)</span>
        </div>
      )}
    </div>
  );
}
