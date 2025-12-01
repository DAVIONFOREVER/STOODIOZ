import React, { useState, useRef } from 'react';
import { AppView } from '../types';
import { PhotoIcon } from './icons';

interface LabelSetupProps {
    // Matches signature of other setup components for App.tsx integration
    onCompleteSetup: (data: any) => void;
    onNavigate: (view: AppView) => void;
}

const LabelSetup: React.FC<LabelSetupProps> = ({ onCompleteSetup, onNavigate }) => {
    const [labelName, setLabelName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    
    // Auth fields for creating the account
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!labelName || !contactEmail || !contactPhone || !email || !password || !agreedToTerms) {
            alert("Please fill in all required fields.");
            return;
        }
        
        // Construct the data object expected by apiService.createUser
        const userData = {
            name: labelName,
            email: email, // Login email
            password: password,
            image_url: imagePreview,
            imageFile: imageFile,
            // Label specific fields
            labelName,
            companyName,
            contactEmail, // Public contact email
            contactPhone,
            website,
            notes
        };

        onCompleteSetup(userData);
    };

    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">
                Set Up Your <span className="text-blue-400">Label Profile</span>
            </h1>
            <p className="text-center text-zinc-400 mb-8">
                Create your organization account to manage your roster.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Label Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <PhotoIcon className="w-10 h-10 text-zinc-500" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 text-sm font-semibold bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600"
                        >
                            Upload Logo
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    </div>
                </div>

                {/* Login Credentials */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 space-y-4">
                    <h3 className="font-bold text-zinc-200">Account Login</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Login Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-zinc-900 border-zinc-700 text-zinc-200 rounded-lg"
                                placeholder="you@label.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Password *</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-zinc-900 border-zinc-700 text-zinc-200 rounded-lg"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                {/* Label Details */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Label / Management Name *</label>
                    <input
                        type="text"
                        value={labelName}
                        onChange={(e) => setLabelName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Vertex Records"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Legal Company Name (Optional)</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg"
                        placeholder="e.g., Vertex Entertainment LLC"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Public Contact Email *</label>
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg"
                            placeholder="booking@vertexrecords.com"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Public Contact Phone *</label>
                        <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg"
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                    <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg"
                        placeholder="https://vertexrecords.com"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg"
                        placeholder="Brief description of your label..."
                    />
                </div>

                <div>
                    <label className="flex items-start cursor-pointer">
                        <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 mt-1"
                        required
                        />
                        <span className="ml-3 text-sm text-zinc-400">
                        I agree to the Terms & Conditions and verify I am authorized to create this organization account.
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    Create Label Account
                </button>
            </form>
        </div>
    );
};

export default LabelSetup;