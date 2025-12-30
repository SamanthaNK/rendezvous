import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { X, AlertCircle } from 'lucide-react';
import Container from '../layouts/Container';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ImageUpload from '../components/event/ImageUpload';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';

const CATEGORIES = [
  { label: 'Music & Concerts', value: 'Music & Concerts' },
  { label: 'Arts & Culture', value: 'Arts & Culture' },
  { label: 'Sports & Fitness', value: 'Sports & Fitness' },
  { label: 'Food & Drink', value: 'Food & Drink' },
  { label: 'Business & Networking', value: 'Business & Networking' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Health & Wellness', value: 'Health & Wellness' },
  { label: 'Community & Charity', value: 'Community & Charity' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Education & Workshops', value: 'Education & Workshops' },
  { label: 'Family & Kids', value: 'Family & Kids' },
  { label: 'Nightlife', value: 'Nightlife' },
];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
  });

  const titleValue = watch('title', '');
  const descriptionValue = watch('description', '');

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (!titleValue || !descriptionValue || selectedCategories.length === 0 || images.length === 0) {
        setError('Please fill in all required fields before continuing');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleDiscardDraft = () => {
    navigate('/organizer/dashboard');
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      console.log('Saving draft...');
      setTimeout(() => {
        navigate('/organizer/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Save draft error:', error);
    } finally {
      setSavingDraft(false);
    }
  };

  const onSubmit = async (data) => {
    console.log('Form data:', data);
    console.log('Categories:', selectedCategories);
    console.log('Images:', images);
  };

  return (
    <div className="min-h-screen bg-bright-snow pt-20">
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-4xl font-bold text-ink-black mb-2">
                Create Event
              </h1>
              <p className="font-body text-base text-gray-600">
                Step {step} of 3: Basic Information
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Cancel"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-teal' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-teal' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-teal' : 'bg-gray-300'}`} />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
                <div>
                  <Input
                    label="Event Title"
                    placeholder="e.g., Summer Music Festival 2025"
                    required
                    error={errors.title?.message}
                    {...register('title', {
                      required: 'Event title is required',
                      maxLength: {
                        value: 100,
                        message: 'Title cannot exceed 100 characters',
                      },
                    })}
                  />
                  <p className="mt-2 font-body text-sm text-gray-500 text-right">
                    {titleValue.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-ink-black mb-2">
                    Description
                    <span className="text-error ml-1">*</span>
                  </label>
                  <textarea
                    placeholder="Describe your event in detail..."
                    rows={8}
                    className={`
                      w-full px-4 py-3 font-body text-base
                      border-[1.5px] rounded-md resize-y
                      ${errors.description ? 'border-error' : 'border-gray-200'}
                      focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10
                      placeholder:text-gray-400
                      transition-all duration-200
                    `}
                    {...register('description', {
                      required: 'Event description is required',
                      maxLength: {
                        value: 2000,
                        message: 'Description cannot exceed 2000 characters',
                      },
                    })}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-error font-body">
                      {errors.description.message}
                    </p>
                  )}
                  <p className="mt-2 font-body text-sm text-gray-500 text-right">
                    {descriptionValue.length}/2000 characters
                  </p>
                </div>

                <div>
                  <Select
                    label="Categories"
                    options={CATEGORIES}
                    value={selectedCategories}
                    onChange={setSelectedCategories}
                    placeholder="Select categories"
                    multiple
                    required
                    error={selectedCategories.length === 0 ? 'Please select at least one category' : ''}
                  />
                  <p className="mt-2 font-body text-sm text-gray-500">
                    Select one or more categories that best describe your event
                  </p>
                </div>

                <ImageUpload
                  images={images}
                  onChange={setImages}
                  error={images.length === 0 ? 'Please upload at least one image' : ''}
                />
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="text-center py-16">
                  <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                    Step 2: Date & Location
                  </h2>
                  <p className="font-body text-base text-gray-600">
                    Coming in the next implementation phase
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="text-center py-16">
                  <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                    Step 3: Pricing & Details
                  </h2>
                  <p className="font-body text-base text-gray-600">
                    Coming in the next implementation phase
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <Button type="button" variant="secondary" size="lg" onClick={handleBack}>
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                >
                  {savingDraft ? (
                    <>
                      <Spinner size="sm" color="teal" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Draft'
                  )}
                </Button>
              </div>

              {step < 3 ? (
                <Button type="button" variant="primary" size="lg" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" variant="primary" size="lg">
                  Publish Event
                </Button>
              )}
            </div>
          </form>
        </div>
      </Container>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Save Your Progress?"
      >
        <p className="font-body text-base text-gray-700 mb-6">
          You have unsaved changes. Would you like to save this event as a draft before leaving?
        </p>
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSaveDraft}
            disabled={savingDraft}
          >
            {savingDraft ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Saving Draft...</span>
              </>
            ) : (
              'Save as Draft'
            )}
          </Button>
          <Button variant="danger" size="lg" fullWidth onClick={handleDiscardDraft}>
            Discard Changes
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => setShowCancelModal(false)}>
            Continue Editing
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CreateEventPage;