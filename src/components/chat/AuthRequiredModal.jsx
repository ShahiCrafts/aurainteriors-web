import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useShallow } from "zustand/react/shallow";
import Dialog from '../common/Dialog';

const AuthRequiredModal = ({ isOpen, onClose, message, suggestion }) => {
  const { openAuthModal } = useAuthStore(useShallow((state) => ({ openAuthModal: state.openAuthModal })));

  // The customer app has no /login or /signup route: auth is the global
  // AuthModal (magic-link email flow). Its single 'email' view serves both
  // sign-in and sign-up ("Enter your email to sign in or create an
  // account"), and authStore maps 'login'/'signup' to 'email' as well.
  const handleSignIn = () => {
    onClose();
    openAuthModal('email');
  };

  const handleSignUp = () => {
    onClose();
    openAuthModal('email');
  };

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
            <Dialog open={isOpen} onClose={onClose} labelledBy="auth-required-title" className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#F27318]/5 to-[#1A1714]/5 px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h2 id="auth-required-title" className="text-lg font-bold text-gray-900">Account Required</h2>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {message || "This feature requires you to be logged in to your account."}
                </p>

                {suggestion && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    {suggestion}
                  </div>
                )}

                <p className="text-gray-600 text-sm">
                  Create a free account or sign in to access this feature and manage your account.
                </p>
              </div>

              {/* Actions */}
              <div className="bg-gray-50/50 px-6 py-4 flex gap-3 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Browsing
                </button>

                <button
                  onClick={handleSignIn}
                  className="flex-1 px-4 py-2.5 text-center text-sm font-medium text-white bg-[#1A1714] rounded-lg hover:bg-[#0F0C0A] transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  Sign In
                </button>

                <button
                  onClick={handleSignUp}
                  className="flex-1 px-4 py-2.5 text-center text-sm font-medium text-white bg-[#F27318] rounded-lg hover:bg-[#D9620E] transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  Sign Up
                </button>
              </div>
            </Dialog>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthRequiredModal;
