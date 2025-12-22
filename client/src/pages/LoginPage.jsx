import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { setCredentials, setLoading, setError, selectAuthLoading, selectAuthError } from '../store/authSlice';
import { authAPI } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

function LoginPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loading = useSelector(selectAuthLoading);
    const authError = useSelector(selectAuthError);

    const [rememberMe, setRememberMe] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: 'onBlur',
    });

    const onSubmit = async (data) => {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));

            const response = await authAPI.login({
                email: data.email,
                password: data.password,
                rememberMe,
            });

            if (response.data.success) {
                dispatch(setCredentials({
                    user: response.data.data.user,
                    token: response.data.data.token,
                }));
                navigate('/');
            }
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <AuthLayout>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 md:p-10">
                <Link to="/" className="inline-flex items-center gap-2 mb-8">
                    <div className="w-4 h-4 bg-lime-cream rounded-full" />
                    <span className="font-logo text-2xl font-semibold tracking-tight text-ink-black">
                        rendezvous
                    </span>
                </Link>

                <div className="mb-8">
                    <h1 className="font-heading text-3xl font-bold text-ink-black mb-2">
                        Welcome Back
                    </h1>
                    <p className="font-body text-base text-gray-600">
                        Login to discover events near you
                    </p>
                </div>

                {authError && (
                    <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md">
                        <p className="font-body text-sm text-error">{authError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        icon={Mail}
                        iconPosition="left"
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
                        placeholder="Enter your password"
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
                        })}
                    />

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={loading}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-teal focus:ring-2 focus:ring-teal/20 cursor-pointer transition-all"
                            />
                            <span className="font-body text-sm text-gray-700 select-none">
                                Remember me
                            </span>
                        </label>

                        <Link
                            to="/forgot-password"
                            className="font-body text-sm font-semibold text-teal hover:text-teal/80 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>

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
                                <span>Logging in...</span>
                            </>
                        ) : (
                            'Login'
                        )}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    <p className="font-body text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-teal font-semibold hover:text-teal/80 transition-colors">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}

export default LoginPage;