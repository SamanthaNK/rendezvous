import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.forgotPassword(data.email);

      if (response.data.success) {
        setSuccess(true);
        setSubmittedEmail(data.email);
      }
    } catch (err) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>

          <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                        Check Your Email
          </h1>

          <p className="font-body text-base text-gray-700 mb-2">
                        We've sent password reset instructions to:
          </p>
          <p className="font-body text-base font-semibold text-ink-black mb-6">
            {submittedEmail}
          </p>

          <div className="bg-info/10 border border-info/20 rounded-md p-4 mb-6">
            <p className="font-body text-sm text-gray-700">
                            Please check your email and click the reset link. The link will expire in 1 hour.
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/login">
              <Button variant="primary" size="lg" fullWidth>
                                Back to Login
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="font-body text-sm text-gray-600">
                            Didn't receive the email?{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-teal font-semibold hover:underline"
              >
                                Try again
              </button>
            </p>
          </div>
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
                        Forgot Password
          </h1>
          <p className="font-body text-base text-gray-600">
                        Enter your email and we'll send you reset instructions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md">
            <p className="font-body text-sm text-error">{error}</p>
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
                <span>Sending...</span>
              </>
            ) : (
              'Send Reset Link'
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

export default ForgotPasswordPage;
