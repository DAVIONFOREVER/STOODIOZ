import React, { useState, useRef } from 'react';
import { AppView } from '../types';
import { PhotoIcon, CloseCircleIcon } from './icons';

interface LabelSetupProps {
    onCompleteSetup: (name: string, bio: string, email: string, password: string, imageUrl: string | null, imageFile: File | null) => Promise<void>;
    onNavigate: (view: AppView) => void;
}

const LabelSetup: React.FC<LabelSetupProps> = ({ onCompleteSetup, onNavigate }) => {
    const [labelName, setLabelName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [password, setPassword] = useState('');
    
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const isFormValid = labelName.trim().length > 0 && 
                        contactEmail.trim().length > 0 && 
                        contactPhone.trim().length > 0 && 
                        password.trim().length > 0 && 
                        agreedToTerms;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Combine extra fields into bio since the current API signature is fixed.
            // This ensures all data is captured until the backend schema is formally expanded.
            const combinedBio = `
${notes || ''}

---
Company: ${companyName}
Phone: ${contactPhone}
Website: ${website}
`.trim();

            await onCompleteSetup(
                labelName, 
                combinedBio, 
                contactEmail, 
                password, 
                imagePreview, 
                imageFile
            );
        } catch (err: any) {
            console.error("Error in LabelSetup submit:", err);
            setIsSubmitting(false);
            setError(err.message || "Failed to create profile. Please try again.");
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">
                Label <span className="text-orange-400">Registration</span>
            </h1>
            <p className="text-center text-zinc-400 mb-8">
                Register your label or management company to oversee your roster.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Label Logo</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Logo preview" className="w-full h-full object-cover" />
                            ) : (
                                <PhotoIcon className="w-10 h-10 text-zinc-500" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={triggerFileInput}
                            className="px-4 py-2 text-sm font-semibold bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                            Upload Logo
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

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="labelName" className="block text-sm font-medium text-zinc-300 mb-2">Label Name <span className="text-orange-500">*</span></label>
                        <input
                            type="text"
                            id="labelName"
                            value={labelName}
                            onChange={(e) => setLabelName(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="e.g. Summit Records"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-zinc-300 mb-2">Company Name (Optional)</label>
                        <input
                            type="text"
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="e.g. Summit LLC"
                        />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-zinc-300 mb-2">Contact Email <span className="text-orange-500">*</span></label>
                        <input
                            type="email"
                            id="contactEmail"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="admin@label.com"
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-zinc-300 mb-2">Contact Phone <span className="text-orange-500">*</span></label>
                        <input
                            type="tel"
                            id="contactPhone"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="(555) 123-4567"
                            required
                        />
                    </div>
                </div>

                {/* Website */}
                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-zinc-300 mb-2">Website (Optional)</label>
                    <input
                        type="url"
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="https://www.summitrecords.com"
                    />
                </div>

                {/* Notes/Bio */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-zinc-300 mb-2">Notes / Description (Optional)</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="Tell us about your roster, genres, or what you're looking for."
                    />
                </div>

                {/* Password (Required for Auth) */}
                <div>
                    <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-zinc-300 mb-2">Password <span className="text-orange-500">*</span></label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                    />
                </div>

                {/* Terms */}
                <div>
                    <label htmlFor="terms" className="flex items-start cursor-pointer">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500 mt-1 cursor-pointer"
                            required
                        />
                        <span className="ml-3 text-sm text-zinc-400">
                            I have read and agree to the{' '}
                            <button type="button" onClick={() => onNavigate(AppView.PRIVACY_POLICY)} className="font-medium text-orange-400 hover:underline">
                                User Agreement &amp; Privacy Policy
                            </button>
                            .
                        </span>
                    </label>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                        <CloseCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-200 text-sm font-medium">Setup Failed</p>
                            <p className="text-red-300 text-xs mt-1 break-all">{error}</p>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                        isFormValid && !isSubmitting
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20' 
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                        </>
                    ) : 'Complete Registration'}
                </button>
            </form>
        </div>
    );
};

export default LabelSetup;