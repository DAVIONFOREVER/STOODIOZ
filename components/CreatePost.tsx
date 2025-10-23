import React, { useState } from 'react';
import type { Artist, Engineer, Stoodio, LinkAttachment, Producer } from '../types';
import { PhotoIcon, VideoCameraIcon, CloseCircleIcon } from './icons';

interface CreatePostProps {
    currentUser: Artist | Engineer | Stoodio | Producer;
    onPost: (postData: { text: string; imageUrl?: string; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }) => Promise<void>;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPost }) => {
    const [text, setText] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const clearAttachments = () => {
        setImageUrl(null);
        setVideoUrl(null);
        setVideoThumbnailUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((text.trim() || imageUrl || videoUrl) && !isPosting) {
            setIsPosting(true);
            await onPost({ 
                text: text.trim(), 
                imageUrl: imageUrl || undefined,
                videoUrl: videoUrl || undefined,
                videoThumbnailUrl: videoThumbnailUrl || undefined,
            });
            setText('');
            clearAttachments();
            setIsPosting(false);
        }
    };

    const handleAddPhoto = () => {
        clearAttachments();
        // Simulate adding a photo with a placeholder
        setImageUrl(`https://picsum.photos/seed/postphoto${Date.now()}/800/600`);
    };

    const handleAddVideo = () => {
        clearAttachments();
        // Simulate adding a video with a placeholder
        setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); // Placeholder video URL
        setVideoThumbnailUrl(`https://picsum.photos/seed/postvideo${Date.now()}/800/600`);
    };


    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <div className="flex items-start gap-4">
                <img src={currentUser.imageUrl} alt={currentUser.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="w-full">
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Share an update, a new track, or a session video..."
                            className="w-full bg-zinc-700 border-zinc-600 text-slate-200 placeholder:text-slate-400 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                            rows={3}
                        />

                        {(imageUrl || videoThumbnailUrl) && (
                             <div className="relative mt-2">
                                <img src={imageUrl || videoThumbnailUrl!} alt="Post preview" className="rounded-lg w-full max-h-80 object-cover" />
                                {videoUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <svg className="w-16 h-16 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                                <button type="button" onClick={clearAttachments} className="absolute top-2 right-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                                    <CloseCircleIcon className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button type="button" onClick={handleAddPhoto} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors">
                                    <PhotoIcon className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Add Photo</span>
                                </button>
                                <button type="button" onClick={handleAddVideo} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors">
                                    <VideoCameraIcon className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Add Video</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-xs text-zinc-500 hidden sm:block">Posts are subject to Community Guidelines.</p>
                                <button
                                    type="submit"
                                    disabled={(!text.trim() && !imageUrl && !videoUrl) || isPosting}
                                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                                >
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;