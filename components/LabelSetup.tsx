
import React, { useState } from 'react';
import { AppView } from '../types';
import { BriefcaseIcon, ChevronLeftIcon } from './icons';

interface LabelSetupProps {
    onCompleteSetup: (
        name: string, 
        companyName: string, 
        email: string, 
        contactPhone: string, 
        website: string, 
        notes: string,
        password: string
    ) => void;
    onNavigate: (view: AppView) => void;
}

const LabelSetup: React.FC<LabelSetupProps> = ({ onCompleteSetup, onNavigate }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const isFormValid = name.trim() && email.trim() && contactPhone.trim() && password.trim() && agreedToTerms;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isFormValid) {
            setIsSubmitting(true);
            try {
                // Determine if we need to wait or just fire and forget (depends on parent implementation)
                // We'll assume the parent handles navigation away on success.
                await onCompleteSetup(name, companyName, email, contactPhone, website, notes, password);
            } catch (error) {
                console.error("Submission error:", error);
                setIsSubmitting(false); // Only stop loading on error, otherwise we unmount
                alert("An error occurred during account creation. Please try again.");
            }
        } else {
            alert("Please fill in all required fields marked with * and agree to the terms.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface">
            <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back
            </button>

            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">
                Label / Management <span className="text-orange-400">Application</span>
            </h1>
            <p className="text-center text-zinc-400 mb-8">
                Join Stoodioz to manage your roster and streamline bookings.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Display / Brand Name *</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., Top Tier Management"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-zinc-300 mb-2">Legal Company Name</label>
                        <input
                            type="text"
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., Top Tier LLC"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Contact Email *</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="agent@toptier.com"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-zinc-300 mb-2">Contact Phone *</label>
                        <input
                            type="tel"
                            id="phone"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="+1 (555) 000-0000"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                    <input
                        type="url"
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="https://"
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-zinc-300 mb-2">Description / Roster Notes</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Briefly describe your agency or the artists you represent."
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-zinc-300 mb-2">Create Password *</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor="terms" className="flex items-start cursor-pointer">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500 mt-1"
                            required
                            disabled={isSubmitting}
                        />
                        <span className="ml-3 text-sm text-zinc-400">
                            I have read and agree to the{' '}
                            <button type="button" onClick={() => onNavigate(AppView.PRIVACY_POLICY)} className="font-medium text-orange-400 hover:underline">
                                User Agreement & Privacy Policy
                            </button>.
                        </span>
                    </label>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                        </>
                    ) : (
                        <>
                            <BriefcaseIcon className="w-5 h-5" />
                            Submit Application
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LabelSetup;
