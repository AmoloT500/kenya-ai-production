
import React from 'react';

interface GroundingResultsProps {
  urls: Array<{ title: string; uri: string }>;
}

export const GroundingResults: React.FC<GroundingResultsProps> = ({ urls }) => {
  if (!urls || urls.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
      <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
        <i className="fas fa-link text-xs"></i> SOURCES & PLACES
      </p>
      <ul className="flex flex-wrap gap-2">
        {urls.map((url, idx) => (
          <li key={idx}>
            <a 
              href={url.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] bg-white border border-green-200 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors inline-block max-w-[150px] truncate"
              title={url.title}
            >
              {url.title || 'View Source'}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
