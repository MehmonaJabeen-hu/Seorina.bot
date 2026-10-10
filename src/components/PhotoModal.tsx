import React from 'react';
import { X, MapPin, Calendar, Heart } from 'lucide-react';
import { Moment } from '../types';

interface PhotoModalProps {
  moment: Moment | null;
  onClose: () => void;
  onDiscuss: (moment: Moment) => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ moment, onClose, onDiscuss }) => {
  if (!moment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center transition-colors"
          aria-label="Close photo"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Frame */}
        <div className="relative w-full aspect-4/3 bg-stone-100 overflow-hidden">
          <img
            src={moment.image}
            alt={moment.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Info */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {moment.location}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {moment.timeAgo}
              </span>
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {moment.title}
            </h3>
            <p className="mt-2 text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
              "{moment.caption}"
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => {
                onDiscuss(moment);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition-colors text-center"
            >
              Ask Seol-In-ah about this moment
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
