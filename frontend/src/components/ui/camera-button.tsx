import React, { useRef, useState } from "react";

interface CameraButtonProps {
  onImageSelect?: (file: File) => void;
}

const CameraButton: React.FC<CameraButtonProps> = ({ onImageSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onImageSelect?.(file);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleButtonClick}
        className="p-2 rounded bg-gray-200 hover:bg-gray-300 flex items-center"
        aria-label="Open camera or select photo"
      >
        {/* Camera SVG icon */}
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h2l2-3h8l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {preview && (
        <div className="mt-2">
          <img src={preview} alt="Selected preview" className="max-w-xs max-h-40 rounded shadow" />
        </div>
      )}
    </div>
  );
};

export default CameraButton; 