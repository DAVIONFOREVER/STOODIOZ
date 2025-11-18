import React, { useState, useRef } from 'react';
import type { Artist, Engineer, Stoodio, LinkAttachment, Producer } from '../types';
import { PhotoIcon, VideoCameraIcon, CloseCircleIcon, PlayIcon } from './icons';

interface CreatePostProps {
    currentUser: Artist | Engineer | Stoodio | Producer;
    onPost: (postData: { text: string; image_url?: string; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }) => Promise<void>;
}

// A generic video icon as a data URL to replace the picsum placeholder
const GENERIC_VIDEO_THUMBNAIL = 'data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-white/80"%3e%3cpath fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" /%3e%3c/svg%3e';

const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return reject(new Error('Canvas 2D context not available'));
        }

        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

        const cleanup = () => {
            URL.revokeObjectURL(video.src);
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
        };

        const onSeeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const thumbnailUrl = canvas.toDataURL('image/jpeg');
            cleanup();
            resolve(thumbnailUrl);
        };

        const onLoadedData = () => {
            // Seek to a frame, e.g., 1 second in, or middle if shorter
            video.currentTime = Math.min(1, video.duration / 2);
        };

        const onError = (e: Event) => {
             cleanup();
             reject(new Error('Error loading video file for thumbnail generation.'));
        };
        
        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);
    });
};


const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPost }) => {
    const [text, setText] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const clearAttachments = () => {
        setImageUrl(null);
        setVideoUrl(null);
        setVideoThumbnailUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((text.trim() || imageUrl || videoUrl) && !isPosting) {
            setIsPosting(true);
            await onPost({ 
                text: text.trim(), 
                image_url: imageUrl || undefined,
                videoUrl: videoUrl || undefined,
                videoThumbnailUrl: videoThumbnailUrl || undefined,
            });
            setText('');
            clearAttachments();
            setIsPosting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        clearAttachments();

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            setVideoUrl(URL.createObjectURL(file));
            setVideoThumbnailUrl(GENERIC_VIDEO_THUMBNAIL); // Set a placeholder immediately
            try {
                const thumbnailUrl = await generateVideoThumbnail(file);
                setVideoThumbnailUrl(thumbnailUrl);
            } catch (error) {
                console.error('Failed to generate video thumbnail:', error);
                // Fallback to the generic icon if thumbnail generation fails, which is already set.
            }
        }
    };

    const handleAddPhoto = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = "image/*";
            fileInputRef.current.click();
        }
    };

    const handleAddVideo = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = "video/*";
            fileInputRef.current.click();
        }
    };


    return (
        <div className="p-6 cardSurface">
            <div className="flex items-start gap-4">
                <img src={currentUser.image_url} alt={currentUser.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="w-full">
                    <form onSubmit={handleSubmit}>
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Share an update, a new track, or a session video..."
                            className="w-full bg-zinc-700 border-zinc-600 text-slate-200 placeholder:text-slate-400 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                            rows={3}
                        />

                        {(imageUrl || videoThumbnailUrl) && (
                             <div className="relative mt-2">
                                <img 
                                    src={imageUrl || videoThumbnailUrl!} 
                                    alt="Post preview" 
                                    className={`rounded-lg w-full max-h-80 object-cover ${videoThumbnailUrl === GENERIC_VIDEO_THUMBNAIL ? 'object-contain bg-black p-4' : ''}`} 
                                />
                                {videoUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <PlayIcon className="w-16 h-16 text-white/80" />
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