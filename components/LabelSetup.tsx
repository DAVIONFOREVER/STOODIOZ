
import React, { useState, useRef, useEffect } from 'react';
import { AppView } from '../types';
import { PhotoIcon, CloseCircleIcon } from './icons';

interface LabelSetupProps {
    onCompleteSetup: (name: string, bio: string, email: string, password: string, imageUrl: string | null, imageFile: File | null) => Promise<void>;
    onNavigate: (view: AppView) => void;
}

const LabelSetup: React.FC<LabelSetupProps> = ({ onCompleteSetup, onNavigate }) => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<number | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const isFormValid = name.trim().length > 0 && 
                        bio.trim().length > 0 && 
                        email.trim().length > 0 && 
                        password.trim().length > 0 && 
                        agreedToTerms;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || isSubmitting) return;

        console.log("Submitting Label Setup...", { name, email });
        setIsSubmitting(true);
        setError(null);

        // 1. Guardrail: Set a timeout to prevent infinite loading
        timeoutRef.current = window.setTimeout(() => {
            setIsSubmitting(false);
            setError("Request timed out. The server took too long to respond. Please check your internet connection or try again.");
            console.error("Submission timed out");
        }, 10000); // 10 seconds

        try {
            await onCompleteSetup(name, bio, email, password, imagePreview, imageFile);
            // If successful, onCompleteSetup usually navigates away.
            // We clear the timeout to be safe.
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } catch (err: any) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            console.error("Error in LabelSetup submit:", err);
            setIsSubmitting(false);
            // Display the specific error message from the backend/app
            setError(err.message || JSON.stringify(err) || "Failed to create profile. Please try again.");
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">Create Your <span className="text-blue-400">Label Profile</span></h1>
            <p className="text-center text-zinc-400 mb-8">Manage your talent and oversee projects efficiently.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Label/Management Logo</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                            ) : (
                                <PhotoIcon className="w-10 h-10 text-zinc-500" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={triggerFileInput}
                            className="px-4 py-2 text-sm font-semibold bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                            Upload Photo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Label/Management Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Summit Records"
                        required
                        autoComplete="off"
                    />
                </div>
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Tell us about your roster and what you're looking for."
                        required
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="manager@example.com"
                            required
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="••••••••"
                            required
                            autoComplete="new-password"
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="terms" className="flex items-start cursor-pointer">
                        <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 mt-1 cursor-pointer"
                        required
                        />
                        <span className="ml-3 text-sm text-zinc-400">
                        I have read and agree to the{' '}
                        <button type="button" onClick={() => onNavigate(AppView.PRIVACY_POLICY)} className="font-medium text-blue-400 hover:underline">
                            User Agreement &amp; Privacy Policy
                        </button>
                        .
                        </span>
                    </label>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                        <CloseCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-200 text-sm font-medium">Setup Failed</p>
                            <p className="text-red-300 text-xs mt-1 break-all">{error}</p>
                        </div>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                        isFormValid && !isSubmitting
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Profile...
                        </>
                    ) : 'Complete Profile'}
                </button>
            </form>
        </div>
    );
};

export default LabelSetup;
