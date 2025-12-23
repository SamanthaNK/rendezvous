import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Upload,
  Trash2,
} from 'lucide-react';
import { selectIsAuthenticated } from '../store/authSlice';
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // We'll implement more steps later

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: [],
    images: [],
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Available categories
  const categories = [
    'Music', 'Technology', 'Sports', 'Arts', 'Food & Drink',
    'Business', 'Education', 'Health', 'Community', 'Entertainment',
  ];

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  }, [errors]);

  // Handle category selection
  const handleCategoryToggle = useCallback((category) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category],
    }));
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: null,
      }));
    }
  }, [errors.category]);

  // Image upload component
  const ImageUpload = ({ images, onImagesChange, error }) => {
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = useCallback((files) => {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        return;
      }

      // Create preview URLs
      const newImages = imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Date.now() + Math.random(),
      }));

      onImagesChange([...images, ...newImages]);
    }, [images, onImagesChange]);

    const handleDragOver = useCallback((e) => {
      e.preventDefault();
      setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
      e.preventDefault();
      setDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
      e.preventDefault();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        handleFiles(imageFiles);
      }
    }, [handleFiles]);

    const handleFileSelect = useCallback((e) => {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }, [handleFiles]);

    const removeImage = useCallback((imageId) => {
      const updatedImages = images.filter(img => img.id !== imageId);
      // Revoke object URL to prevent memory leaks
      const removedImage = images.find(img => img.id === imageId);
      if (removedImage?.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }
      onImagesChange(updatedImages);
    }, [images, onImagesChange]);

    return (
      <div className="space-y-4">
        <label className="block font-body text-sm font-medium text-ink-black">
          Event Images
          <span className="text-error ml-1">*</span>
        </label>

        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${dragOver ? 'border-teal bg-teal/5' : 'border-gray-300 hover:border-teal'}
            ${error ? 'border-error' : ''}
          `}
          onClick={() => document.getElementById('image-upload').click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="font-body text-gray-600 mb-2">
            Drag and drop images here, or click to select
          </p>
          <p className="font-body text-sm text-gray-500">
            PNG, JPG, GIF up to 10MB each
          </p>
          <input
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {error && (
          <p className="font-body text-sm text-error">{error}</p>
        )}

        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Form validation
  const validateStep1 = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }

    if (formData.category.length === 0) {
      newErrors.category = 'At least one category is required';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle save draft
  const handleSaveDraft = useCallback(() => {
    try {
      setLoading(true);
      // Save to localStorage for now (could be API call later)
      const draftData = {
        ...formData,
        step: currentStep,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('eventDraft', JSON.stringify(draftData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (error) {
      // Error saving draft - could show user feedback here
    } finally {
      setLoading(false);
    }
  }, [formData, currentStep]);

  // Handle next step
  const handleNext = useCallback(async () => {
    if (validateStep1()) {
      // Auto-save draft before proceeding
      await handleSaveDraft();
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  }, [validateStep1, handleSaveDraft, totalSteps]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (formData.title || formData.description || formData.category.length > 0 || formData.images.length > 0) {
      setShowCancelModal(true);
    } else {
      navigate('/');
    }
  }, [formData, navigate]);

  // Handle cancel confirmation
  const handleCancelConfirm = useCallback((action) => {
    setShowCancelModal(false);
    if (action === 'save') {
      handleSaveDraft().then(() => navigate('/'));
    } else if (action === 'delete') {
      // Clear any saved draft
      localStorage.removeItem('eventDraft');
      navigate('/');
    }
  }, [handleSaveDraft, navigate]);

  // Character counters
  const titleChars = formData.title.length;
  const descriptionChars = formData.description.length;

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen pt-20">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-ink-black transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-body">Cancel</span>
            </button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-ink-black">
                Create New Event
              </h1>
              <p className="font-body text-gray-600">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>

          {draftSaved && (
            <div className="flex items-center gap-2 text-green-600">
              <Save size={16} />
              <span className="font-body text-sm">Draft saved</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-teal h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h2 className="font-heading text-xl font-bold text-ink-black mb-6">
                Basic Information
              </h2>

              {/* Title */}
              <div className="mb-6">
                <Input
                  label="Event Title"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={errors.title}
                  required
                  maxLength={100}
                />
                <div className="flex justify-end mt-1">
                  <span className={`font-body text-sm ${titleChars > 100 ? 'text-error' : 'text-gray-500'}`}>
                    {titleChars}/100
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block font-body text-sm font-medium text-ink-black mb-2">
                  Description
                  <span className="text-error ml-1">*</span>
                </label>
                <textarea
                  placeholder="Describe your event..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  maxLength={2000}
                  rows={6}
                  className={`
                    w-full px-4 py-3 border rounded-md font-body text-base transition-colors
                    focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal
                    ${errors.description ? 'border-error focus:border-error focus:ring-error/20' : 'border-gray-300'}
                  `}
                />
                {errors.description && (
                  <p className="font-body text-sm text-error mt-1">{errors.description}</p>
                )}
                <div className="flex justify-end mt-1">
                  <span className={`font-body text-sm ${descriptionChars > 2000 ? 'text-error' : 'text-gray-500'}`}>
                    {descriptionChars}/2000
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block font-body text-sm font-medium text-ink-black mb-3">
                  Category
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`
                        px-4 py-2 rounded-md font-body text-sm border transition-colors text-left
                        ${formData.category.includes(category)
                      ? 'bg-teal text-white border-teal'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-teal'
                    }
                      `}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {errors.category && (
                  <p className="font-body text-sm text-error mt-2">{errors.category}</p>
                )}
              </div>

              {/* Images */}
              <div className="mb-8">
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => handleInputChange('images', images)}
                  error={errors.images}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button
                onClick={handleSaveDraft}
                variant="secondary"
                disabled={loading}
                icon={Save}
                iconPosition="left"
              >
                Save Draft
              </Button>

              <Button
                onClick={handleNext}
                variant="primary"
                disabled={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Cancel confirmation modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Unsaved Changes"
          size="sm"
        >
          <div className="space-y-4">
            <p className="font-body text-gray-700">
              You have unsaved changes. What would you like to do?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => handleCancelConfirm('save')}
                variant="secondary"
                className="flex-1"
              >
                Save Draft & Exit
              </Button>
              <Button
                onClick={() => handleCancelConfirm('delete')}
                variant="danger"
                className="flex-1"
              >
                Delete & Exit
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
};

export default CreateEventPage;
