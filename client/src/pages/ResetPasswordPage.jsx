import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const token = searchParams.get('token');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onBlur',
    });

    const password = watch('password');

    const onSubmit = async (data) => {
        if (!token) {
            setError('Reset token is missing');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await authAPI.resetPassword(token, data.password);

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthLayout>
                <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
                    <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-error" />
                    </div>

                    <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                        Invalid Reset Link
                    </h1>

                    <p className="font-body text-base text-gray-700 mb-6">
                        This password reset link is invalid or has expired.
                    </p>

                    <div className="space-y-3">
                        <Link to="/forgot-password">
                            <Button variant="primary" size="lg" fullWidth>
                                Request New Link
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="ghost" size="lg" fullWidth>
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    if (success) {
        return (
            <AuthLayout>
                <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-success" />
                    </div>

                    <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                        Password Reset Successful
                    </h1>

                    <p className="font-body text-base text-gray-700 mb-6">
                        Your password has been reset successfully. You can now login with your new password.
                    </p>

                    <div className="bg-success/10 border border-success/20 rounded-md p-4 mb-6">
                        <p className="font-body text-sm text-gray-700">
                            Redirecting to login page in 3 seconds...
                        </p>
                    </div>

                    <Link to="/login">
                        <Button variant="primary" size="lg" fullWidth>
                            Go to Login
                        </Button>
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 md:p-10">
                <Link to="/login" className="inline-flex items-center gap-2 mb-8">
                    <div className="w-4 h-4 bg-lime-cream rounded-full" />
                    <span className="font-logo text-2xl font-semibold tracking-tight text-ink-black">
                        rendezvous
                    </span>
                </Link>

                <div className="mb-8">
                    <h1 className="font-heading text-3xl font-bold text-ink-black mb-2">
                        Reset Password
                    </h1>
                    <p className="font-body text-base text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md">
                        <p className="font-body text-sm text-error">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Input
                        label="New Password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        icon={Lock}
                        iconPosition="left"
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
                        label="Confirm New Password"
                        type="password"
                        placeholder="Re-enter your password"
                        icon={Lock}
                        iconPosition="left"
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
                        icon={loading ? undefined : ArrowRight}
                        iconPosition="right"
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" color="white" />
                                <span>Resetting Password...</span>
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    <p className="font-body text-sm text-gray-600">
                        Remember your password?{' '}
                        <Link to="/login" className="text-teal font-semibold hover:text-teal/80 transition-colors">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
