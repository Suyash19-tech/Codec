import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-[#050505]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-extrabold mb-2 tracking-tight bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-transparent">
            CODEC
          </h1>
          <p className="text-gray-400 font-medium tracking-wide">
            Institutional Registration
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-4">Professor Registration</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Register with your institutional email to access the Codec repository. You'll receive a verification code to complete your setup.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all group"
          >
            Go to Login
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="mt-6 text-xs text-gray-500">
            Simply enter your institutional email and we'll send you a one-time access code.
          </p>
        </div>

        <p className="mt-10 text-center text-gray-600 text-xs tracking-widest uppercase">
          Institutional Security Protocol v2.0
        </p>
      </div>
    </div>
  );
};

export default Signup;
