import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import PublicNavbar from './PublicNavbar';
import Footer from './Footer';

const Signup = () => {
  const { session, signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signUpNewUser(email, password);
    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to sign up');
      return;
    }

    
    if (session) navigate('/dashboard');
    else navigate('/signin');
  };

  return (
    <>
      <PublicNavbar />
      <main className="pt-20 px-4 text-[var(--fg)]">
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-2">
          {/* Card: Sign up form */}
          <section className="border rounded-3xl p-6">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="opacity-80 text-sm mt-1">
              A simple way to timebox your work and journal what you accomplished.
            </p>

            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm mb-1 opacity-80">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border rounded-lg p-3"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm mb-1 opacity-80">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border rounded-lg p-3"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 border rounded-lg py-2 hover:border-[var(--border)] disabled:opacity-60"
              >
                {loading ? 'Creating account…' : 'Sign up'}
              </button>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <p className="opacity-80 text-sm pt-2">
                Already have an account?{' '}
                <Link to="/signin" className="underline font-semibold">
                  Sign in
                </Link>
                .
              </p>
            </form>
          </section>

          {/* Helpful cards */}
          <section className="space-y-4">
            <div className="p-4 border rounded-2xl">
              <h3 className="font-semibold mb-1">How it works</h3>
              <p className="opacity-80 text-sm">
                Start a focus session, do the work, and jot a short note. Your
                note and duration show up in History.
              </p>
            </div>

            <div className="p-4 border rounded-2xl">
              <h3 className="font-semibold mb-1">Why journal?</h3>
              <p className="opacity-80 text-sm">
                Quick summaries make weekly reviews effortless and help you see
                progress over time.
              </p>
            </div>

            <div className="p-4 border rounded-2xl">
              <h3 className="font-semibold mb-1">Privacy</h3>
              <p className="opacity-80 text-sm">
                Your entries are visible only to you. Data is stored securely in
                your Supabase project with row-level policies.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Signup;
