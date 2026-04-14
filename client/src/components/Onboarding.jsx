import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-[#050505]">
      <div className="max-w-4xl w-full text-center">
        <div className="animate-fade-in-down mb-2">
          <h1 className="text-7xl md:text-9xl font-extrabold tracking-tight bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-transparent">
            CODEC
          </h1>
        </div>

        <div className="mb-12 animate-fade-in animation-delay-300">
          <p className="text-xl text-gray-400 font-medium tracking-wide mt-4">
            The intelligent institutional repository.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-in animation-delay-700">
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
