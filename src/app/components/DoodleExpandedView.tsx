import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface DoodleExpandedViewProps {
  doodle: any;
  onClose: () => void;
}

export function DoodleExpandedView({ doodle, onClose }: DoodleExpandedViewProps) {
  const formatDateTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'EEEE, MMMM d, yyyy • h:mm a');
    } catch {
      return '';
    }
  };

  const handleSave = () => {
    // Create a download link
    const link = document.createElement('a');
    link.href = doodle.doodle;
    link.download = `doodle-${doodle.date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-4xl max-h-[90vh] m-4 flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 text-white">
          <div>
            <h3 className="text-lg font-semibold">
              {doodle.creatorName}'s Doodle
            </h3>
            <p className="text-sm text-white/70">
              {formatDateTime(doodle.timestamp)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Doodle Image */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div className="relative w-full h-full bg-white rounded-3xl p-4 flex items-center justify-center shadow-2xl">
            <img
              src={doodle.doodle}
              alt="Doodle"
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-4 px-6 py-6">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors backdrop-blur-sm"
          >
            Save Doodle
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-[image:var(--pulse-gradient)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}