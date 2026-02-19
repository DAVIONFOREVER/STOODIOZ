
import React, { useState, useRef } from 'react';
import type { Artist, Engineer, Stoodio, LinkAttachment, Producer, Label } from '../types';
import { PhotoIcon, VideoCameraIcon, CloseCircleIcon, PlayIcon } from './icons';
import { getProfileImageUrl } from '../constants';

interface CreatePostProps {
    currentUser: Artist | Engineer | Stoodio | Producer | Label;
    onPost: (postData: { text: string; imageFile?: File; imageUrl?: string; videoFile?: File; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }) => Promise<void>;
}

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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<number | null>(null);

    const clearAttachments = () => {
        setImageUrl(null);
        setImageFile(null);
        setVideoUrl(null);
        setVideoFile(null);
        setVideoThumbnailUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

    const simulateProgress = () => {
        setProgress(0);
        progressIntervalRef.current = window.setInterval(() => {
            setProgress((prev) => {
                // Asymptotically approach 90%
                if (prev >= 90) return prev;
                const increment = Math.max(1, (90 - prev) / 20);
                return prev + increment;
            });
        }, 300);
    };

    const stopProgress = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setProgress(100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((text.trim() || imageFile || videoFile) && !isPosting) {
            setIsPosting(true);
            simulateProgress();
            
            try {
                await onPost({ 
                    text: text.trim(), 
                    imageFile: imageFile || undefined,
                    imageUrl: imageUrl || undefined,
                    videoFile: videoFile || undefined,
                    videoUrl: videoUrl || undefined,
                    videoThumbnailUrl: videoThumbnailUrl || undefined,
                });
                setText('');
                clearAttachments();
            } catch (e) {
                console.error("Error posting:", e);
                // Error handling is done in parent, but we ensure state resets here
            } finally {
                stopProgress();
                // Delay unsetting isPosting slightly to let user see 100%
                setTimeout(() => {
                    setIsPosting(false);
                    setProgress(0);
                }, 500);
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        clearAttachments();

        if (file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
            try {
                const thumbnailUrl = await generateVideoThumbnail(file);
                setVideoThumbnailUrl(thumbnailUrl);
            } catch (error) {
                console.error('Failed to generate video thumbnail:', error);
            }
        }
    };

    const handleAddPhoto = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = "image/*,.heic,.heif";
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
                <img
                    src={getProfileImageUrl(currentUser)}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-2xl object-cover object-top ring-2 ring-orange-500/30 shadow-lg shadow-orange-500/20"
                />
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
                            className="w-full bg-zinc-900/70 border border-zinc-700/80 text-slate-200 placeholder:text-slate-400 rounded-xl p-3 focus:ring-orange-500 focus:border-orange-500"
                            rows={3}
                        />

                        {(imageUrl || videoThumbnailUrl || videoUrl) && (
                             <div className="relative mt-2">
                                {imageUrl && (
                                    <img 
                                        src={imageUrl} 
                                        alt="Post preview" 
                                        className="rounded-lg w-full max-h-80 object-cover" 
                                    />
                                )}
                                {!imageUrl && videoThumbnailUrl && (
                                    <img 
                                        src={videoThumbnailUrl} 
                                        alt="Video thumbnail preview" 
                                        className="rounded-lg w-full max-h-80 object-cover" 
                                    />
                                )}
                                {!imageUrl && !videoThumbnailUrl && videoUrl && (
                                    <video 
                                        src={videoUrl} 
                                        className="rounded-lg w-full max-h-80 object-cover" 
                                        muted 
                                        playsInline
                                    />
                                )}
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
                                    disabled={(!text.trim() && !imageFile && !videoFile) || isPosting}
                                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:bg-zinc-600 disabled:cursor-not-allowed relative overflow-hidden"
                                >
                                    {isPosting ? (
                                        <div className="flex items-center gap-2">
                                            <span>{Math.round(progress)}%</span>
                                            {/* Minimal progress bar at the bottom of the button */}
                                            <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                                                <div 
                                                    className="h-full bg-white transition-all duration-300" 
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : 'Post'}
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
