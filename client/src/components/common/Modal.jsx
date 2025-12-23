import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="absolute inset-0 bg-ink-black/70 animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={`
          relative bg-white rounded-xl shadow-modal
          ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden
          animate-fade-in
        `}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2
                        id="modal-title"
                        className="font-heading text-2xl font-bold text-ink-black"
                    >
                        {title}
                    </h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            aria-label="Close modal"
                            className="
                w-8 h-8 flex items-center justify-center
                rounded-md hover:bg-gray-100
                transition-colors duration-200
              "
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    showCloseButton: PropTypes.bool,
};

export default Modal;
