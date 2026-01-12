import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Briefcase, Calendar } from 'lucide-react';
import { setCredentials, setLoading, setError, selectAuthLoading, selectAuthError } from '../store/authSlice';
import { authAPI } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import InterestsStep from '../components/onboarding/InterestsStep';
import LocationStep from '../components/onboarding/LocationStep';

const RegisterPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loading = useSelector(selectAuthLoading);
    const authError = useSelector(selectAuthError);

    const [step, setStep] = useState(1);
    const [accountType, setAccountType] = useState('user');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onBlur',
    });

    const password = watch('password');

    const toggleInterest = (interest) => {
        setSelectedInterests((prev) => {
            if (prev.includes(interest)) {
                return prev.filter((i) => i !== interest);
            }
            if (prev.length >= 5) {
                return prev;
            }
            return [...prev, interest];
        });
    };

    const handleNext = () => {
        dispatch(setError(null));

        if (step === 2 && selectedInterests.length < 1) {
            dispatch(setError('Please select at least 1 interest'));
            return;
        }
        if (step === 3 && !selectedCity) {
            dispatch(setError('Please select your city'));
            return;
        }

        setStep(step + 1);
    };

    const handleBack = () => {
        dispatch(setError(null));
        setStep(step - 1);
    };

    const onSubmit = async (data) => {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));

            const userData = {
                name: data.name,
                email: data.email,
                password: data.password,
                interests: selectedInterests,
                location: {
                    city: selectedCity,
                    neighborhood: neighborhood || '',
                },
                role: accountType,
            };

            const response = await authAPI.register(userData);

            if (response.data.success) {
                dispatch(setCredentials({
                    user: response.data.data.user,
                    token: response.data.data.token,
                }));
                navigate('/verify-email-notice');
            }
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <>
            {step === 1 && (
                <AuthLayout>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8">
                        <div className="mb-8 text-center">
                            <Link to="/" className="inline-flex items-center gap-2 mb-6">
                                <div className="w-4 h-4 bg-lime-cream rounded-full" />
                                <span className="font-logo text-2xl font-semibold tracking-tight text-ink-black">
                                    rendezvous
                                </span>
                            </Link>
                            <h1 className="font-heading text-3xl font-bold text-ink-black mb-2">
                                Create Account
                            </h1>
                            <p className="font-body text-base text-gray-600">
                                Join Rendezvous and discover amazing events
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block font-body text-sm font-medium text-ink-black mb-3">
                                I want to:
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAccountType('user')}
                                    className={`p-4 rounded-lg border-2 transition-all ${accountType === 'user'
                                            ? 'border-teal bg-teal/5'
                                            : 'border-gray-200 hover:border-teal'
                                        }`}
                                >
                                    <Calendar className={`w-6 h-6 mx-auto mb-2 ${accountType === 'user' ? 'text-teal' : 'text-gray-400'
                                        }`} />
                                    <p className={`font-body text-sm font-semibold ${accountType === 'user' ? 'text-teal' : 'text-gray-700'
                                        }`}>
                                        Discover Events
                                    </p>
                                    <p className="font-body text-xs text-gray-500 mt-1">
                                        Find and attend events
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAccountType('organizer')}
                                    className={`p-4 rounded-lg border-2 transition-all ${accountType === 'organizer'
                                            ? 'border-teal bg-teal/5'
                                            : 'border-gray-200 hover:border-teal'
                                        }`}
                                >
                                    <Briefcase className={`w-6 h-6 mx-auto mb-2 ${accountType === 'organizer' ? 'text-teal' : 'text-gray-400'
                                        }`} />
                                    <p className={`font-body text-sm font-semibold ${accountType === 'organizer' ? 'text-teal' : 'text-gray-700'
                                        }`}>
                                        Organize Events
                                    </p>
                                    <p className="font-body text-xs text-gray-500 mt-1">
                                        Create and manage events
                                    </p>
                                </button>
                            </div>
                        </div>

                        {authError && (
                            <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md">
                                <p className="font-body text-sm text-error">{authError}</p>
                            </div>
                        )}

                        <form onSubmit={(e) => {
                            e.preventDefault(); handleNext();
                        }} className="space-y-5">
                            <Input
                                label="Full Name"
                                type="text"
                                placeholder={accountType === 'organizer' ? 'Organization or Your Name' : 'Kim Army'}
                                icon={User}
                                iconPosition="left"
                                required
                                error={errors.name?.message}
                                disabled={loading}
                                {...register('name', {
                                    required: 'Name is required',
                                    minLength: {
                                        value: 2,
                                        message: 'Name must be at least 2 characters',
                                    },
                                })}
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                icon={Mail}
                                iconPosition="left"
                                required
                                error={errors.email?.message}
                                disabled={loading}
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Please enter a valid email address',
                                    },
                                })}
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                icon={Lock}
                                iconPosition="left"
                                required
                                error={errors.password?.message}
                                disabled={loading}
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                    pattern: {
                                        value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                                        message: 'Password must contain letters and numbers',
                                    },
                                })}
                            />

                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Re-enter your password"
                                icon={Lock}
                                iconPosition="left"
                                required
                                error={errors.confirmPassword?.message}
                                disabled={loading}
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) =>
                                        value === password || 'Passwords do not match',
                                })}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                disabled={loading}
                            >
                                Continue
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                            <p className="font-body text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="text-teal font-semibold hover:text-teal/80 transition-colors">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </AuthLayout>
            )}

            {step === 2 && (
                <div className="min-h-screen bg-bright-snow">
                    <InterestsStep
                        selectedInterests={selectedInterests}
                        onInterestToggle={toggleInterest}
                    />

                    {authError && (
                        <div className="max-w-3xl mx-auto px-5 mb-4">
                            <div className="p-4 bg-error/10 border-l-4 border-error rounded-md">
                                <p className="font-body text-sm text-error text-center">{authError}</p>
                            </div>
                        </div>
                    )}

                    <div className="max-w-3xl mx-auto px-5 pb-12">
                        <div className="flex items-center justify-center gap-4">
                            <Button variant="secondary" size="lg" onClick={handleBack}>
                                Back
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleNext}
                                disabled={selectedInterests.length === 0}
                            >
                                Continue
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-8">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                            <div className="w-2 h-2 rounded-full bg-teal" />
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="min-h-screen bg-bright-snow">
                    <LocationStep city={selectedCity} onCityChange={setSelectedCity} />

                    <div className="max-w-2xl mx-auto px-5 pb-6">
                        <Input
                            label="Neighborhood (Optional)"
                            type="text"
                            placeholder="e.g., Simbock, Biyem-assi"
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                        />
                    </div>

                    {authError && (
                        <div className="max-w-2xl mx-auto px-5 mb-4">
                            <div className="p-4 bg-error/10 border-l-4 border-error rounded-md">
                                <p className="font-body text-sm text-error text-center">{authError}</p>
                            </div>
                        </div>
                    )}

                    <div className="max-w-2xl mx-auto px-5 pb-12">
                        <div className="flex items-center justify-center gap-4">
                            <Button variant="secondary" size="lg" onClick={handleBack}>
                                Back
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSubmit(onSubmit)}
                                disabled={loading || !selectedCity}
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" color="white" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    'Finish'
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-8">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                            <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RegisterPage;
