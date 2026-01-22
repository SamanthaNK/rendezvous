import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { X, AlertCircle } from 'lucide-react';
import Container from '../layouts/Container';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ImageUpload from '../components/event/ImageUpload';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { eventsAPI, uploadAPI } from '../services/api';
import { getCategoryOptions, getCityOptions } from '../utils/constants';

const EditEventPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        mode: 'onBlur',
    });

    const titleValue = watch('title', '');
    const descriptionValue = watch('description', '');
    const isFreeValue = watch('isFree');
    const eventTypeValue = watch('eventType');
    const cityValue = watch('city');

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const response = await eventsAPI.getById(id);

            if (response.data.success) {
                const event = response.data.data.event;

                setValue('title', event.title);
                setValue('description', event.description);
                setValue('date', new Date(event.date).toISOString().split('T')[0]);
                setValue('time', event.time);
                setValue('duration', event.duration || '');
                setValue('city', event.location.city);
                setValue('venue', event.location.venue);
                setValue('neighborhood', event.location.neighborhood || '');
                setValue('eventType', event.eventType);
                setValue('onlineEventLink', event.onlineEventLink || '');
                setValue('isFree', event.isFree ? 'true' : 'false');
                setValue('price', event.price || '0');
                setValue('capacity', event.capacity || '');
                setValue('email', event.contactInfo?.email || '');
                setValue('phone', event.contactInfo?.phone || '');

                setSelectedCategories(event.categories || []);
                setExistingImages(event.images || []);
            }
        } catch (err) {
            console.error('Fetch event error:', err);
            setError('Failed to load event');
            navigate('/organizer/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setError(null);

        if (step === 1) {
            const totalImages = existingImages.length + images.length;
            if (!titleValue || !descriptionValue || selectedCategories.length === 0 || totalImages === 0) {
                setError('Please fill in all required fields before continuing');
                return;
            }
        }

        if (step === 2) {
            const dateVal = watch('date');
            const timeVal = watch('time');
            const venueVal = watch('venue');

            if (!dateVal || !timeVal || !cityValue || !venueVal) {
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

    const uploadNewImages = async () => {
        if (images.length === 0) {
            return [];
        }

        if (uploadedImageUrls.length > 0) {
            return uploadedImageUrls;
        }

        const formData = new FormData();
        images.forEach((imageObj) => {
            formData.append('images', imageObj.file);
        });

        const uploadResponse = await uploadAPI.uploadImages(formData);

        if (!uploadResponse.data.success) {
            throw new Error('Image upload failed');
        }

        const urls = uploadResponse.data.data.urls;
        setUploadedImageUrls(urls);
        return urls;
    };

    const buildEventData = async (data) => {
        const newImageUrls = await uploadNewImages();
        const allImages = [...existingImages, ...newImageUrls];

        return {
            title: data.title,
            description: data.description,
            categories: selectedCategories,
            images: allImages,
            date: data.date,
            time: data.time,
            duration: data.duration ? parseInt(data.duration) : undefined,
            location: {
                city: data.city,
                venue: data.venue,
                address: data.venue,
                neighborhood: data.neighborhood || '',
                coordinates: {
                    type: 'Point',
                    coordinates: [0, 0]
                }
            },
            price: parseFloat(data.price) || 0,
            isFree: data.isFree === 'true',
            capacity: data.capacity ? parseInt(data.capacity) : undefined,
            eventType: data.eventType,
            onlineEventLink: data.onlineEventLink || undefined,
            contactInfo: {
                phone: data.phone || '',
                email: data.email || '',
            },
        };
    };

    const onSubmit = async (data) => {
        try {
            setSubmitting(true);
            setError(null);

            const eventData = await buildEventData(data);

            const response = await eventsAPI.update(id, eventData);
            if (response.data.success) {
                navigate(`/events/${id}`);
            }
        } catch (err) {
            console.error('Update event error:', err);

            const errorMessage = err.response?.data?.message
                || err.response?.data?.error
                || err.message
                || 'Failed to update event. Please try again.';

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveExistingImage = (index) => {
        setExistingImages(existingImages.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bright-snow pt-20 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bright-snow pt-20">
            <Container className="py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="font-heading text-4xl font-bold text-ink-black mb-2">
                                Edit Event
                            </h1>
                            <p className="font-body text-base text-gray-600">
                                Step {step} of 3: {step === 1 ? 'Basic Information' : step === 2 ? 'Date & Location' : 'Pricing & Details'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCancelModal(true)}
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

                                <div>
                                    <label className="block font-body text-sm font-medium text-ink-black mb-2">
                                        Description
                                        <span className="text-error ml-1">*</span>
                                    </label>
                                    <textarea
                                        placeholder="Describe your event in detail..."
                                        rows={8}
                                        className={`w-full px-4 py-3 font-body text-base border-[1.5px] rounded-md resize-y ${errors.description ? 'border-error' : 'border-gray-200'
                                            } focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 placeholder:text-gray-400 transition-all duration-200`}
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

                                <Select
                                    label="Categories"
                                    options={getCategoryOptions()}
                                    value={selectedCategories}
                                    onChange={setSelectedCategories}
                                    placeholder="Select categories"
                                    multiple
                                    required
                                    error={selectedCategories.length === 0 ? 'Please select at least one category' : ''}
                                />

                                {existingImages.length > 0 && (
                                    <div>
                                        <label className="block font-body text-sm font-medium text-ink-black mb-2">
                                            Current Images
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                                            {existingImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                        <img
                                                            src={image}
                                                            alt={`Existing ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveExistingImage(index)}
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
                                    </div>
                                )}

                                <ImageUpload
                                    images={images}
                                    onChange={setImages}
                                    maxImages={5 - existingImages.length}
                                    error={(existingImages.length + images.length) === 0 ? 'Please keep at least one image' : ''}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
                                <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                                    Date & Location
                                </h2>

                                <Input
                                    label="Event Date"
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    error={errors.date?.message}
                                    {...register('date', {
                                        required: 'Event date is required',
                                    })}
                                />

                                <Input
                                    label="Start Time"
                                    type="time"
                                    required
                                    error={errors.time?.message}
                                    {...register('time', {
                                        required: 'Start time is required',
                                    })}
                                />

                                <Input
                                    label="Duration (minutes)"
                                    type="number"
                                    placeholder="120"
                                    error={errors.duration?.message}
                                    {...register('duration', {
                                        min: {
                                            value: 15,
                                            message: 'Duration must be at least 15 minutes',
                                        },
                                    })}
                                />

                                <Select
                                    label="City"
                                    options={getCityOptions()}
                                    value={cityValue}
                                    onChange={(value) => setValue('city', value)}
                                    required
                                    error={!cityValue ? 'City is required' : ''}
                                />

                                <Input
                                    label="Venue/Address"
                                    type="text"
                                    placeholder="e.g., Convention Center, Park Road"
                                    required
                                    error={errors.venue?.message}
                                    {...register('venue', {
                                        required: 'Venue address is required',
                                    })}
                                />

                                <Input
                                    label="Neighborhood (Optional)"
                                    type="text"
                                    placeholder="e.g., Downtown, Simbock"
                                    {...register('neighborhood')}
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
                                <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                                    Pricing & Details
                                </h2>

                                <div>
                                    <label className="block font-body text-sm font-medium text-ink-black mb-3">
                                        Event Type
                                        <span className="text-error ml-1">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="in-person"
                                                {...register('eventType')}
                                                className="w-4 h-4"
                                            />
                                            <span className="font-body text-sm text-gray-700">In-Person</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="online"
                                                {...register('eventType')}
                                                className="w-4 h-4"
                                            />
                                            <span className="font-body text-sm text-gray-700">Online</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="hybrid"
                                                {...register('eventType')}
                                                className="w-4 h-4"
                                            />
                                            <span className="font-body text-sm text-gray-700">Hybrid</span>
                                        </label>
                                    </div>
                                </div>

                                {(eventTypeValue === 'online' || eventTypeValue === 'hybrid') && (
                                    <Input
                                        label="Online Event Link"
                                        type="url"
                                        placeholder="https://zoom.us/j/..."
                                        {...register('onlineEventLink')}
                                    />
                                )}

                                <div>
                                    <label className="block font-body text-sm font-medium text-ink-black mb-3">
                                        Pricing
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="true"
                                                {...register('isFree')}
                                                className="w-4 h-4"
                                            />
                                            <span className="font-body text-sm text-gray-700">Free Event</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="false"
                                                {...register('isFree')}
                                                className="w-4 h-4"
                                            />
                                            <span className="font-body text-sm text-gray-700">Paid Event</span>
                                        </label>
                                    </div>
                                </div>

                                {isFreeValue === 'false' && (
                                    <Input
                                        label="Ticket Price (FCFA)"
                                        type="number"
                                        placeholder="5000"
                                        error={errors.price?.message}
                                        {...register('price', {
                                            min: {
                                                value: 0,
                                                message: 'Price must be 0 or greater',
                                            },
                                        })}
                                    />
                                )}

                                <Input
                                    label="Capacity (Optional)"
                                    type="number"
                                    placeholder="100"
                                    error={errors.capacity?.message}
                                    {...register('capacity', {
                                        min: {
                                            value: 1,
                                            message: 'Capacity must be at least 1',
                                        },
                                    })}
                                />

                                <Input
                                    label="Contact Email"
                                    type="email"
                                    placeholder="contact@event.com"
                                    error={errors.email?.message}
                                    {...register('email', {
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Please enter a valid email address',
                                        },
                                    })}
                                />

                                <Input
                                    label="Contact Phone"
                                    type="tel"
                                    placeholder="+237 6XX XXX XXX"
                                    {...register('phone')}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-8">
                            <div className="flex items-center gap-3">
                                {step > 1 && (
                                    <Button type="button" variant="secondary" size="lg" onClick={handleBack}>
                                        Back
                                    </Button>
                                )}
                            </div>

                            {step < 3 ? (
                                <Button type="button" variant="primary" size="lg" onClick={handleNext}>
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Spinner size="sm" color="white" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        'Update Event'
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </Container>

            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Discard Changes?"
            >
                <p className="font-body text-base text-gray-700 mb-6">
                    Are you sure you want to leave? All unsaved changes will be lost.
                </p>
                <div className="space-y-3">
                    <Button variant="danger" size="lg" fullWidth onClick={() => navigate('/organizer/dashboard')}>
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

export default EditEventPage;