
import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Mail, ChevronRight, CookingPot, Loader2, AlertCircle, X, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

/**
 * IMPORTANT: Replace this placeholder with your actual Client ID from 
 * the Google Cloud Console (https://console.cloud.google.com/)
 */
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'form' | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResetSent, setIsResetSent] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        const google = (window as any).google;
        
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleButtonRef.current && mode !== 'forgot') {
          const isDark = document.documentElement.classList.contains('dark');
          
          google.accounts.id.renderButton(
            googleButtonRef.current,
            { 
              theme: isDark ? 'filled_black' : 'outline', 
              size: 'large', 
              width: googleButtonRef.current.offsetWidth || 400,
              shape: 'pill',
              text: 'continue_with',
              logo_alignment: 'center'
            }
          );
        }
      } else {
        setTimeout(initGoogle, 300);
      }
    };

    initGoogle();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          initGoogle();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [mode]);

  const handleCredentialResponse = (response: any) => {
    setLoadingProvider('google');
    setError(null);
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const profile = JSON.parse(jsonPayload);
      onLogin({
        name: profile.name,
        email: profile.email,
        avatar: profile.picture
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      setError("Unable to complete Google Sign-In. Please check your network or try a different account.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const validateEmail = (emailStr: string): string | undefined => {
    if (!emailStr.trim()) return "Email is required";
    
    if (!emailStr.includes('@')) {
      return "Email must contain an '@' symbol";
    }
    
    const parts = emailStr.split('@');
    if (parts.length > 2) {
      return "Email cannot contain multiple '@' symbols";
    }
    
    const domain = parts[1];
    if (!domain) {
      return "Please enter a domain after the '@'";
    }
    
    if (!domain.includes('.')) {
      return "Domain must contain a dot (e.g., .com, .net)";
    }
    
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return "Invalid domain extension (must be at least 2 chars)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return "Please enter a valid email address format";
    }

    return undefined;
  };

  const validate = () => {
    const errors: { email?: string; password?: string; name?: string } = {};

    if (mode === 'signup' && !name.trim()) {
      errors.name = "Full name is required to create an account";
    }

    const emailError = validateEmail(email);
    if (emailError) {
      errors.email = emailError;
    }

    if (mode !== 'forgot') {
      if (!password) {
        errors.password = "Password is required";
      } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters long for security";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingProvider) return;
    if (!validate()) return;
    
    setLoadingProvider('form');
    setError(null);
    
    try {
      // Mocking a network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulating credential failure
      if (email === "fail@example.com") {
        throw new Error("Invalid email or password. Please try again.");
      }

      const userEmail = email;
      const userName = mode === 'login' ? (userEmail.split('@')[0]) : name;
      
      onLogin({ 
        name: userName, 
        email: userEmail,
        avatar: `https://i.pravatar.cc/150?u=${userEmail}`
      });
    } catch (err: any) {
      setError(err.message || "Login failed. Please verify your credentials.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingProvider) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setValidationErrors({ email: emailError });
      return;
    }

    setLoadingProvider('reset');
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setIsResetSent(true);
    } catch (err: any) {
      setError("Unable to send recovery link. Please try again later.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    if (loadingProvider) return;
    setMode(newMode);
    setError(null);
    setIsResetSent(false);
    setValidationErrors({});
  };

  const isLoading = loadingProvider !== null;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-[#111811] selection:bg-[#13ec13]/30 transition-colors duration-300">
      {/* Hero Content */}
      <div className="hidden md:flex md:w-[45%] bg-[#111811] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-recipe-hero bg-cover bg-center opacity-40 scale-105" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#111811] via-transparent to-[#111811]" />
        
        <div className="relative z-10 p-12 lg:p-16 w-full max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-[#13ec13] rounded-2xl flex items-center justify-center shadow-lg shadow-[#13ec13]/20">
              <CookingPot size={28} className="text-[#111811]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">RecipeGenius</h1>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Eat smarter, <span className="text-[#13ec13]">live better.</span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed font-medium">
              Join thousands of home chefs using AI to turn random ingredients into gourmet meals in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative bg-white dark:bg-[#111811] transition-colors duration-300">
        <div className="w-full max-w-[420px] space-y-8">
          
          {mode === 'forgot' ? (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="text-center md:text-left">
                <button 
                  onClick={() => switchMode('login')}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#13ec13] font-bold text-xs uppercase tracking-widest mb-6 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft size={16} /> Back to login
                </button>
                <h3 className="text-4xl font-black text-[#111811] dark:text-white tracking-tight">Recover password</h3>
              </div>

              {isResetSent ? (
                <div className="bg-[#13ec13]/10 border-2 border-[#13ec13]/20 p-8 rounded-3xl text-center space-y-4">
                  <div className="w-16 h-16 bg-[#13ec13] text-[#111811] rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-black text-[#111811] dark:text-white">Check your email</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                    We've sent a link to <span className="font-bold text-[#111811] dark:text-white">{email}</span>. Follow the steps to reset your password.
                  </p>
                  <button onClick={() => switchMode('login')} className="w-full h-14 bg-[#111811] dark:bg-[#13ec13] text-white dark:text-[#111811] rounded-2xl font-black text-sm mt-4">Return to login</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#111811] dark:text-gray-300 uppercase tracking-wide">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        value={email}
                        disabled={isLoading}
                        onChange={(e) => { 
                          setEmail(e.target.value); 
                          if(validationErrors.email) setValidationErrors({...validationErrors, email: undefined}); 
                        }}
                        placeholder="name@example.com"
                        className={`w-full h-14 pl-12 pr-4 rounded-2xl border-2 bg-gray-50 dark:bg-[#1c211c] dark:text-white focus:bg-white dark:focus:bg-[#111811] outline-none transition-all disabled:opacity-50 ${validationErrors.email ? 'border-red-400' : 'border-gray-50 dark:border-transparent focus:border-[#13ec13]'}`}
                      />
                    </div>
                    {validationErrors.email && <p className="text-xs font-bold text-red-500 ml-1">{validationErrors.email}</p>}
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full h-14 bg-[#111811] dark:bg-[#13ec13] text-white dark:text-[#111811] rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-black/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-50">
                    {loadingProvider === 'reset' ? <Loader2 className="animate-spin" size={24} /> : "Send Link"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="text-center md:text-left animate-in fade-in duration-500">
                <h3 className="text-4xl font-black text-[#111811] dark:text-white tracking-tight">
                  {mode === 'login' ? 'Welcome back' : 'Get started'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg font-medium">
                  {mode === 'login' ? 'Your kitchen is waiting for you.' : 'The smartest way to cook starts here.'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <span className="flex-1 text-sm font-semibold text-red-600 dark:text-red-400">{error}</span>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
              )}

              {/* Functional Google Integration */}
              <div className="space-y-4">
                <div 
                  ref={googleButtonRef} 
                  className={`w-full min-h-[44px] flex justify-center transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
                ></div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-gray-400 bg-white dark:bg-[#111811] px-4 transition-colors">OR EMAIL</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#111811] dark:text-gray-300 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${validationErrors.name ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                      <input 
                        type="text" 
                        value={name}
                        disabled={isLoading}
                        onChange={(e) => {
                          setName(e.target.value);
                          if(validationErrors.name) setValidationErrors({...validationErrors, name: undefined});
                        }}
                        placeholder="Chef John Doe"
                        className={`w-full h-14 pl-12 pr-4 rounded-2xl border-2 bg-gray-50 dark:bg-[#1c211c] dark:text-white focus:bg-white outline-none transition-all disabled:opacity-50 ${validationErrors.name ? 'border-red-400' : 'border-gray-50 dark:border-transparent focus:border-[#13ec13]'}`}
                      />
                    </div>
                    {validationErrors.name && <p className="text-xs font-bold text-red-500 ml-1">{validationErrors.name}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-black text-[#111811] dark:text-gray-300 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${validationErrors.email ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                    <input 
                      type="email" 
                      value={email}
                      disabled={isLoading}
                      onChange={(e) => { 
                        setEmail(e.target.value); 
                        if(validationErrors.email) setValidationErrors({...validationErrors, email: undefined}); 
                      }}
                      placeholder="name@example.com"
                      className={`w-full h-14 pl-12 pr-4 rounded-2xl border-2 bg-gray-50 dark:bg-[#1c211c] dark:text-white focus:bg-white outline-none transition-all disabled:opacity-50 ${validationErrors.email ? 'border-red-400' : 'border-gray-50 dark:border-transparent focus:border-[#13ec13]'}`}
                    />
                  </div>
                  {validationErrors.email && <p className="text-xs font-bold text-red-500 ml-1">{validationErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-black text-[#111811] dark:text-gray-300 uppercase tracking-wide">Password</label>
                    {mode === 'login' && <button type="button" disabled={isLoading} onClick={() => switchMode('forgot')} className="text-xs font-bold text-gray-400 hover:text-[#13ec13] disabled:opacity-50">Forgot?</button>}
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${validationErrors.password ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                    <input 
                      type="password" 
                      value={password}
                      disabled={isLoading}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if(validationErrors.password) setValidationErrors({...validationErrors, password: undefined});
                      }}
                      placeholder="••••••••"
                      className={`w-full h-14 pl-12 pr-4 rounded-2xl border-2 bg-gray-50 dark:bg-[#1c211c] dark:text-white focus:bg-white outline-none transition-all disabled:opacity-50 ${validationErrors.password ? 'border-red-400' : 'border-gray-50 dark:border-transparent focus:border-[#13ec13]'}`}
                    />
                  </div>
                  {validationErrors.password && <p className="text-xs font-bold text-red-500 ml-1">{validationErrors.password}</p>}
                </div>

                <button type="submit" disabled={isLoading} className="w-full h-14 bg-[#111811] dark:bg-[#13ec13] text-white dark:text-[#111811] rounded-2xl font-black text-lg flex items-center justify-center gap-2 group shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-50">
                  {loadingProvider === 'form' ? <Loader2 className="animate-spin" size={24} /> : (
                    <>
                      <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                      <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-gray-500 dark:text-gray-400 font-medium">
                {mode === 'login' ? "New here?" : "Already have an account?"}{' '}
                <button 
                  disabled={isLoading}
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} 
                  className="text-[#13ec13] font-black hover:underline disabled:opacity-50"
                >
                  {mode === 'login' ? 'Join for free' : 'Log in here'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
