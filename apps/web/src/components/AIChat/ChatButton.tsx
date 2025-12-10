'use client';

import { useState } from 'react';
import { ChatBot } from './ChatBot';

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#0f118a] to-[#1e40af] text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-50 flex items-center justify-center group"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <svg
            className="w-6 h-6 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <>
            <svg
              className="w-6 h-6 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {/* Notification Badge (optional) */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          </>
        )}

        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat with AIRA
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && <ChatBot onClose={() => setIsOpen(false)} />}
    </>
  );
}
