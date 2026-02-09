'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectDropdownProps<T extends string = string> {
  options: readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelectDropdown<T extends string = string>({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  label,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: T, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500 cursor-pointer flex items-center flex-wrap gap-2"
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          selected.map(option => (
            <span
              key={option}
              className="inline-flex items-center gap-1 px-2 py-1 bg-pulse-100 text-pulse-700 rounded text-sm"
            >
              {option}
              <button
                onClick={(e) => removeOption(option, e)}
                className="hover:text-pulse-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`w-5 h-5 text-slate-400 ml-auto transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {options.map(option => (
            <label
              key={option}
              className="flex items-center gap-2 p-3 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="w-4 h-4 text-pulse-600 border-slate-300 rounded focus:ring-pulse-500"
              />
              <span className="text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
