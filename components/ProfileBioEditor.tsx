import React, { useEffect, useMemo, useState } from 'react';

type ProfileBioEditorProps = {
  value?: string | null;
  label?: string;
  placeholder?: string;
  onSave: (next: string) => Promise<void>;
  maxLength?: number;
};

const ProfileBioEditor: React.FC<ProfileBioEditorProps> = ({
  value,
  label = 'Bio',
  placeholder = 'Tell people who you are and what you do.',
  onSave,
  maxLength = 320,
}) => {
  const [draft, setDraft] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const trimmed = useMemo(() => draft.trim(), [draft]);
  const original = useMemo(() => (value || '').trim(), [value]);
  const hasChanges = trimmed !== original;

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      await onSave(trimmed);
    } catch (err) {
      console.error('Failed to save bio', err);
      alert('Bio could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cardSurface p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-zinc-100">{label}</h3>
        <span className="text-xs text-zinc-500">{trimmed.length}/{maxLength}</span>
      </div>
      <p className="text-xs text-zinc-500 mb-3">This appears on your public profile.</p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={maxLength}
        rows={4}
        className="w-full rounded-lg bg-zinc-800/70 border border-zinc-700 text-zinc-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
        placeholder={placeholder}
      />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Bio'}
        </button>
      </div>
    </div>
  );
};

export default ProfileBioEditor;
