import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Activity, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative pt-8">
        <Link 
          to="/login"
          className="absolute left-0 top-0 flex items-center text-sm font-medium text-text-muted hover:text-text-main transition-colors duration-200"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to login
        </Link>
        <Activity className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-main">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 border border-border sm:rounded-sm sm:px-10">
          {success ? (
            <div className="text-center">
              <div className="rounded-md bg-forest/50 p-4 border border-primary/20 mb-6">
                <h3 className="text-sm font-medium text-primary">Check your email</h3>
                <div className="mt-2 text-sm text-text-muted">
                  <p>We've sent a password reset link to <span className="font-semibold text-text-main">{email}</span>. Click the link to choose a new password.</p>
                </div>
              </div>
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-primary rounded-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-colors duration-200"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-main">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-border rounded-sm placeholder-text-muted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-text-main transition-colors duration-200"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-danger/10 p-4 border border-danger/20">
                  <div className="text-sm text-danger text-center">
                    {error}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-primary rounded-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? 'Processing...' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
