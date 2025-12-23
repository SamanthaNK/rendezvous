import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';
import { authAPI } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const VerifyEmailNoticePage = () => {
  const currentUser = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleResendEmail = async () => {
    try {
      setResending(true);
      setError(null);

      const response = await authAPI.resendVerification();

      if (response.data.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const handleVerified = () => {
    window.location.reload();
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-teal" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                    Check Your Email
        </h1>

        <p className="font-body text-base text-gray-700 mb-2">
                    We've sent a verification link to:
        </p>
        <p className="font-body text-base font-semibold text-ink-black mb-6">
          {currentUser?.email}
        </p>

        <div className="bg-info/10 border border-info/20 rounded-md p-4 mb-6">
          <p className="font-body text-sm text-gray-700">
                        Please check your email and click the verification link to activate your account.
                        The link will expire in 24 hours.
          </p>
        </div>

        {resendSuccess && (
          <div className="bg-success/10 border border-success/20 rounded-md p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="font-body text-sm text-success text-left">
                            Verification email sent successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-md p-4 mb-6">
            <p className="font-body text-sm text-error">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleVerified}
          >
                        I've Verified My Email
          </Button>

          <Link to="/">
            <Button variant="ghost" size="lg" fullWidth>
                            Return to Homepage
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="font-body text-sm text-gray-600 mb-3">
                        Didn't receive the email? Check your spam folder or:
          </p>
          <button
            onClick={handleResendEmail}
            disabled={resending || resendSuccess}
            className="font-body text-sm text-teal font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {resending ? (
              <>
                <Spinner size="sm" color="teal" />
                <span>Sending...</span>
              </>
            ) : resendSuccess ? (
              'Email sent!'
            ) : (
              'Resend verification email'
            )}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailNoticePage;
