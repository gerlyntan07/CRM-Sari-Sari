import React from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="absolute inset-0 bg-primary/90 flex items-center justify-center z-40 lg:flex hidden">
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }}></div>
      </div>
    </div>
  );
}

