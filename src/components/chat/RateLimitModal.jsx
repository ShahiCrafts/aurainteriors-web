import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const RateLimitModal = ({ isOpen, onClose, retryAfter = 900 }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(retryAfter);

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 flex items-center justify-between border-b border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle size={20} className="text-amber-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Slow Down!</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-4 text-center">
                <p className="text-gray-700 text-base font-medium">
                  You've sent too many messages. Please wait a moment before trying again.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Time remaining:</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  This helps us maintain great service for everyone. We'll be back to normal in just a moment.
                </p>
              </div>

              {/* Actions */}
              <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 text-center text-sm font-medium text-white bg-[#1A1714] rounded-lg hover:bg-[#0F0C0A] transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RateLimitModal;
