import React, { useRef, useState } from 'react';
import type { Label } from '../types';
import { PhotoIcon, EditIcon, UsersIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
import { useProfile } from '../hooks/useProfile.ts';
import * as apiService from '../services/apiService';
import { getProfileImageUrl } from '../constants';

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm font-semibold text-slate-300 mb-2">{children}</div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
      props.className || ''
    }`}
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
      props.className || ''
    }`}
  />
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-14 h-8 rounded-full border transition-all relative ${
      checked ? 'bg-orange-500 border-orange-500' : 'bg-zinc-800 border-zinc-700'
    }`}
    aria-pressed={checked}
  >
    <span
      className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : ''
      }`}
    />
  </button>
);

const LabelSettings: React.FC = () => {
  const { currentUser } = useAppState();
  const { updateProfile, refreshCurrentUser, isSaved } = useProfile();

  const label = currentUser as Label | null;

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(label?.name || '');
  const [bio, setBio] = useState((label as any)?.bio || '');
  const [locationText, setLocationText] = useState((label as any)?.location_text || '');
  const [showOnMap, setShowOnMap] = useState(Boolean((label as any)?.show_on_map));
  const [isPublicProfile, setIsPublicProfile] = useState(Boolean(label?.is_public_profile_enabled));
  const [submissionFee, setSubmissionFee] = useState<number>((label as any)?.submission_fee || 0);
  const [submissionGuidelines, setSubmissionGuidelines] = useState((label as any)?.submission_guidelines || '');

  if (!label) {
    return (
      <div className="cardSurface p-8 text-center">
        <p className="text-slate-400">Loading settings…</p>
      </div>
    );
  }

  const handleAvatarClick = () => avatarInputRef.current?.click();
  const handleCoverClick = () => coverInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await apiService.uploadAvatar(label.id, file);
      await updateProfile({ image_url: url } as any);
      await refreshCurrentUser();
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      alert(err?.message || 'Profile photo could not be saved. Check storage/RLS or try again.');
    } finally {
      e.target.value = '';
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await apiService.uploadCoverImage(label.id, file);
      await updateProfile({ cover_image_url: url } as any);
      await refreshCurrentUser();
    } catch (err: any) {
      console.error('Cover upload failed:', err);
      alert(err?.message || 'Cover photo could not be saved. Check storage/RLS or try again.');
    } finally {
      e.target.value = '';
    }
  };

  const save = async () => {
    try {
      await updateProfile({
        name,
        bio,
        location_text: locationText,
        show_on_map: showOnMap,
        is_public_profile_enabled: isPublicProfile,
        submission_fee: submissionFee,
        submission_guidelines: submissionGuidelines,
      } as any);
      await refreshCurrentUser();
      alert('Settings saved successfully!');
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(`Failed to save settings: ${err?.message || 'Unknown error'}\n\nPlease check your connection and try again.`);
    }
  };

  const avatarUrl = (label as any).image_url || '';
  const coverUrl = (label as any).cover_image_url || '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/60">
        {coverUrl ? (
          <img src={coverUrl} alt="Cover" className="w-full h-44 md:h-60 object-cover" />
        ) : (
          <div className="w-full h-44 md:h-60 bg-gradient-to-br from-zinc-900 to-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <button
          type="button"
          onClick={handleCoverClick}
          className="absolute top-4 right-4 bg-black/50 text-white text-xs font-semibold py-2 px-3 rounded-full hover:bg-black/70 flex items-center gap-2"
        >
          <PhotoIcon className="w-4 h-4" />
          Edit Cover
        </button>

        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={getProfileImageUrl(label as { image_url?: string })}
                alt={label?.name}
                className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-4 border-zinc-800"
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Change avatar"
              >
                <EditIcon className="w-7 h-7 text-white" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">Label Settings</h1>
              <p className="text-slate-400 text-sm mt-1">Update your public profile and discoverability.</p>
            </div>
          </div>

          {isSaved && (
            <div className="px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-200 text-sm font-semibold">
              Saved
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cardSurface p-6">
          <FieldLabel>Label name</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your label name" />

          <div className="mt-5">
            <FieldLabel>Bio</FieldLabel>
            <TextArea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} placeholder="What’s your label about?" />
          </div>
        </div>

        <div className="cardSurface p-6 space-y-6">
          <div>
            <FieldLabel>Location</FieldLabel>
            <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="City, State" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-200">Show on map</div>
              <div className="text-xs text-slate-500 mt-1">
                Toggle discoverability on the map. If off, you won’t appear publicly.
              </div>
            </div>
            <Toggle checked={showOnMap} onChange={setShowOnMap} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-200">Make profile public</div>
              <div className="text-xs text-slate-500 mt-1">
                Allow anyone to view your label profile. If off, only roster members can view.
              </div>
            </div>
            <Toggle checked={isPublicProfile} onChange={setIsPublicProfile} />
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <FieldLabel>Paid Submission Fee (USD)</FieldLabel>
            <Input 
              type="number" 
              min="0" 
              step="0.01"
              value={submissionFee} 
              onChange={(e) => setSubmissionFee(Number(e.target.value) || 0)} 
              placeholder="0.00" 
            />
            <div className="text-xs text-slate-500 mt-2">
              Set a fee for demo submissions. Leave at $0 to accept free submissions.
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <FieldLabel>Submission Guidelines</FieldLabel>
            <TextArea 
              value={submissionGuidelines} 
              onChange={(e) => setSubmissionGuidelines(e.target.value)} 
              rows={4} 
              placeholder="Enter submission requirements, format preferences, contact info, etc." 
            />
          </div>

          <button
            type="button"
            onClick={save}
            className="w-full bg-orange-500 text-white font-extrabold py-3 rounded-xl hover:bg-orange-600 transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelSettings;
