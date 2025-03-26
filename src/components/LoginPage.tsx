// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center py-5 w-[450px]">
  <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
    <img src="/images/logo-transparent.png" alt="Logo" className="mr-2 w-[250px]" />
  </a>
  <div className="w-full bg-white rounded-lg sm:max-w-md xl:p-0">
    <div className="p-6 space-y-6 sm:p-8">
      <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
        Sign in to your account
      </h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-50 border border-purple-500 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-50 border border-purple-500 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
      </form>
    </div>
  </div>
</div>
  );
};

export default LoginPage;