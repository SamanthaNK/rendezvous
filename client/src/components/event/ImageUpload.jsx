import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({ images, onChange, maxImages = 5, error }) => {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = (files) => {
        const validFiles = files.filter(
            (file) => file.type === 'image/jpeg' || file.type === 'image/png'
        );

        if (validFiles.length === 0) {
            return;
        }

        const totalImages = images.length + validFiles.length;
        if (totalImages > maxImages) {
            return;
        }

        const newImages = validFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        onChange([...images, ...newImages]);
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
        URL.revokeObjectURL(images[index].preview);
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <label className="block font-body text-sm font-medium text-ink-black mb-2">
                Event Images
                <span className="text-error ml-1">*</span>
            </label>
            <p className="font-body text-sm text-gray-600 mb-3">
                Upload 1-5 images. Maximum 5MB each. JPG or PNG only.
            </p>

            <div
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive
                        ? 'border-teal bg-teal/5'
                        : error
                            ? 'border-error bg-error/5'
                            : 'border-gray-300 hover:border-teal hover:bg-gray-50'
                    }
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={images.length < maxImages ? openFileDialog : undefined}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleFileInput}
                    disabled={images.length >= maxImages}
                    className="hidden"
                />

                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="font-body text-base font-semibold text-ink-black mb-2">
                    {images.length >= maxImages
                        ? 'Maximum images reached'
                        : 'Drop images here or click to upload'}
                </p>
                <p className="font-body text-sm text-gray-600">
                    {maxImages - images.length} of {maxImages} images remaining
                </p>
            </div>

            {error && (
                <p className="mt-2 text-sm text-error font-body" role="alert">
                    {error}
                </p>
            )}

            {images.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img
                                    src={image.preview}
                                    alt={`Upload preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                aria-label="Remove image"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-teal text-white text-xs font-semibold rounded-md">
                                    Cover
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                        <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-body text-sm font-semibold text-gray-700 mb-1">
                                Tips for great event images:
                            </p>
                            <ul className="font-body text-sm text-gray-600 space-y-1">
                                <li>Use high-quality, well-lit photos</li>
                                <li>First image will be used as the cover</li>
                                <li>Show the venue, atmosphere, or previous events</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

ImageUpload.propTypes = {
    images: PropTypes.arrayOf(
        PropTypes.shape({
            file: PropTypes.object.isRequired,
            preview: PropTypes.string.isRequired,
        })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    maxImages: PropTypes.number,
    error: PropTypes.string,
};

export default ImageUpload;