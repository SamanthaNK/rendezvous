import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/common/Button';

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');
    const hasVerified = useRef(false);

    useEffect(() => {
        const verifyEmail = async () => {
            if (hasVerified.current) {
                return;
            }

            if (!token) {
                setStatus('error');
                setMessage('Verification token is missing');
                return;
            }

            hasVerified.current = true;

            try {
                const response = await authAPI.verifyEmail(token);

                if (response.data.success) {
                    setStatus('success');
                    setMessage('Your email has been verified successfully!');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.message || 'Verification failed. The link may have expired.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <AuthLayout>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-8 h-8 text-teal animate-spin" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                            Verifying Your Email
                        </h1>
                        <p className="font-body text-base text-gray-700">
                            Please wait while we verify your email address...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-success" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                            Email Verified
                        </h1>
                        <p className="font-body text-base text-gray-700 mb-6">
                            {message}
                        </p>
                        <div className="bg-success/10 border border-success/20 rounded-md p-4 mb-6">
                            <p className="font-body text-sm text-gray-700">
                                Your account is now active. You can start exploring events!
                            </p>
                        </div>
                        <Link to="/">
                            <Button variant="primary" size="lg" fullWidth>
                                Go to Homepage
                            </Button>
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-error" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                            Verification Failed
                        </h1>
                        <p className="font-body text-base text-gray-700 mb-6">
                            {message}
                        </p>
                        <div className="bg-error/10 border border-error/20 rounded-md p-4 mb-6">
                            <p className="font-body text-sm text-gray-700">
                                The verification link may have expired or is invalid.
                                Please request a new verification email.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Link to="/verify-email-notice">
                                <Button variant="primary" size="lg" fullWidth>
                                    Resend Verification Email
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="ghost" size="lg" fullWidth>
                                    Go to Homepage
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}

export default VerifyEmailPage;