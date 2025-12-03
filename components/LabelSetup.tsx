import React, { useState, useRef } from 'react';
import { AppView } from '../types';
import { PhotoIcon } from './icons';
import { getSupabase } from '../lib/supabase';

interface LabelSetupProps {
    onNavigate: (view: AppView) => void;
    onCompleteSetup: (name: string, bio: string, email: string, password: string, imageUrl: string | null, imageFile: File | null) => Promise<void>;
}

const supabase = getSupabase();

const LabelSetup: React.FC<LabelSetupProps> = ({ onNavigate, onCompleteSetup }) => {
    const [labelName, setLabelName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [password, setPassword] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerUpload = () => fileInputRef.current?.click();

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const uploadLogo = async (userId: string) => {
        if (!imageFile || !supabase) return null;

        const fileExt = imageFile.name.split('.').pop();
        const filePath = `label-logos/${userId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('label-assets')
            .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
            console.error('Logo upload failed:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('label-assets')
            .getPublicUrl(filePath);

        return data?.publicUrl ?? null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await onCompleteSetup(
                labelName,
                notes,
                contactEmail,
                password,
                imagePreview,
                imageFile
            );

            onNavigate(AppView.LABEL_DASHBOARD);
        } catch (err: any) {
            console.error('Label setup failed:', err);
            setError(err.message || 'Failed to save label profile.');
            setSubmitting(false);
        }
    };

    const isFormValid =
        labelName.trim().length > 0 &&
        contactEmail.trim().length > 0 &&
        contactPhone.trim().length > 0 &&
        password.trim().length > 0;

    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">
                Label <span className="text-orange-400">Setup</span>
            </h1>
            <p className="text-center text-zinc-400 mb-8">
                Complete your label profile to unlock your dashboard.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo */}
                <div>
                    <label className="block text-sm text-zinc-300 mb-2">Label Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} className="w-full h-full object-cover" />
                            ) : (
                                <PhotoIcon className="w-10 h-10 text-zinc-500" />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={triggerUpload}
                            className="px-4 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition"
                        >
                            Upload Logo
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImage}
                        />
                    </div>
                </div>

                {/* Label Name */}
                <div>
                    <label className="block text-sm text-zinc-300 mb-1">
                        Label Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={labelName}
                        onChange={(e) => setLabelName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                        placeholder="e.g., Summit Records"
                        required
                    />
                </div>

                {/* Company + Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">Company Name (Optional)</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                            placeholder="Summit LLC"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">Website (Optional)</label>
                        <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                            placeholder="https://summitrecords.com"
                        />
                    </div>
                </div>

                {/* Contact Email */}
                <div>
                    <label className="block text-sm text-zinc-300 mb-1">
                        Contact Email <span className="text-orange-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                        placeholder="admin@label.com"
                        required
                    />
                </div>

                {/* Contact Phone */}
                <div>
                    <label className="block text-sm text-zinc-300 mb-1">
                        Contact Phone <span className="text-orange-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                        placeholder="(555) 123-4567"
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm text-zinc-300 mb-1">
                        Password <span className="text-orange-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm text-zinc-300 mb-1">Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                        placeholder="Tell us about your roster, vision, or genres."
                    ></textarea>
                </div>

                {/* Error */}
                {error && <p className="text-red-400 text-sm">{error}</p>}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || !isFormValid}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                        submitting || !isFormValid
                            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                >
                    {submitting ? 'Saving...' : 'Complete Setup'}
                </button>
            </form>
        </div>
    );
};

export default LabelSetup;