import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';

interface EditableTextProps {
  value: string | number;
  onSave: (newValue: string) => void;
  className?: string;
  isInlineEditMode?: boolean;
  type?: 'text' | 'number' | 'currency';
  prefix?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  className = '',
  isInlineEditMode = false,
  type = 'text',
  prefix = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(value));

  const handleBlur = () => {
    setIsEditing(false);
    onSave(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onSave(tempValue);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(String(value));
    }
  };

  if (isEditing) {
    return (
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={tempValue}
        autoFocus
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-white text-neutral-900 border border-[#820AD1] rounded px-1.5 py-0.5 outline-none shadow-sm ${className}`}
      />
    );
  }

  if (isInlineEditMode) {
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          setTempValue(String(value));
          setIsEditing(true);
        }}
        title="Clique para editar este valor"
        className={`relative inline-flex items-center gap-1 cursor-pointer hover:bg-purple-100/40 rounded px-1 -mx-1 transition-colors border-b border-dashed border-purple-400 ${className}`}
      >
        <span>{prefix}{value}</span>
        <Edit2 className="w-3 h-3 text-purple-600 opacity-70 shrink-0" />
      </span>
    );
  }

  return <span className={className}>{prefix}{value}</span>;
};
