'use client';

import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronUpDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
}

interface MultiSearchableSelectProps {
  options: (string | Option)[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  allLabel?: string; // Label for "All" option
}

export function MultiSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  label,
  allLabel = 'All'
}: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to always have value and label
  const normalizedOptions: Option[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Filter out the "All" option from regular options
  const regularOptions = normalizedOptions.filter(opt => opt.value !== '');
  const allOption = normalizedOptions.find(opt => opt.value === '');

  const filteredOptions = regularOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = value.length === 0 || value.includes('');
  const selectedLabels = value.length === 0 
    ? []
    : value.includes('')
    ? [allLabel]
    : value.map(v => regularOptions.find(opt => opt.value === v)?.label).filter(Boolean);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    if (optionValue === '') {
      // Selecting "All" clears other selections
      onChange([]);
    } else {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue && v !== '')
        : [...value.filter(v => v !== ''), optionValue];
      
      onChange(newValue.length === 0 ? [] : newValue);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (optionValue === '') {
      return; // Can't remove "All"
    }
    const newValue = value.filter(v => v !== optionValue);
    onChange(newValue);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left appearance-none border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 bg-white cursor-pointer h-[38px] flex items-center justify-between ${className}`}
      >
        <div className="flex-1 flex items-center gap-1 mr-2 overflow-hidden">
          {selectedLabels.length === 0 ? (
            <span className="text-gray-500 truncate">{placeholder}</span>
          ) : value.includes('') ? (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium whitespace-nowrap">
              {allLabel}
            </span>
          ) : (
            <>
              {selectedLabels.slice(0, 2).map((label, index) => {
                const optionValue = value[index];
                return (
                  <span
                    key={optionValue}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium whitespace-nowrap flex-shrink-0"
                  >
                    <span className="max-w-[80px] truncate">{label}</span>
                    <button
                      onClick={(e) => handleRemove(optionValue, e)}
                      className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              {selectedLabels.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-200 text-gray-700 text-sm font-medium whitespace-nowrap flex-shrink-0">
                  +{selectedLabels.length - 2}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {value.length > 0 && !value.includes('') && (
            <button
              onClick={handleClearAll}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Clear all"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* "All" option */}
            {allOption && (
              <button
                type="button"
                onClick={() => handleToggle('')}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-100 ${
                  isAllSelected ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => {}}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className={isAllSelected ? 'text-blue-700 font-medium' : 'text-gray-900'}>{allOption.label}</span>
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className={isSelected ? 'text-blue-700 font-medium' : 'text-gray-900'}>{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
