import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmationDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", cancelText = "Annuler", type = "danger" }) {
  if (!isOpen) return null;

  const iconColor = type === "danger" ? "text-red-400" : "text-gold";
  const bgColor = type === "danger" ? "bg-red-400/20" : "bg-gold/20";
  const buttonColor = type === "danger" ? "bg-red-400 text-ink hover:bg-red-400/90" : "bg-gold text-ink hover:bg-gold/90";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/90 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative bg-jade/40 border border-ivory/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-ivory/50 hover:text-ivory transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
              <AlertTriangle className={iconColor} size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl text-ivory mb-2">{title}</h3>
              <p className="text-ivory/70 text-sm leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-ivory/20 text-ivory/70 hover:bg-ivory/10 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl ${buttonColor} transition-colors font-medium`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ConfirmationDialog;
