import React, { useEffect, useRef, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { CloseIcon, MicrophoneIcon, VideoCameraIcon } from './icons';

interface VideoCallModalProps {
    conversationId: string;
    currentUserId: string;
    peerId: string;
    isCaller: boolean;
    onClose: () => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ conversationId, currentUserId, peerId, isCaller, onClose }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'ended' | 'error'>('connecting');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [permissionHint, setPermissionHint] = useState<string | null>(null);
    const readyIntervalRef = useRef<number | null>(null);
    const hasSentOfferRef = useRef(false);
    const isPeerReadyRef = useRef(false);
    const statusRef = useRef(status);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        const supabase = getSupabase();
        const channel = supabase.channel(`video_call:${conversationId}`);

        const setupPeer = async () => {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            peerRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { from: currentUserId, type: 'ice', candidate: event.candidate },
                    });
                }
            };

            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setStatus('connected');
            };

            if (typeof window !== 'undefined' && !window.isSecureContext) {
                throw new Error('Video chat requires HTTPS (secure context). On mobile, use the app or a browser that supports HTTPS.');
            }
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Camera or microphone access is not supported on this device.');
            }
            // On mobile: getUserMedia requires a user gesture and may prompt for camera/mic permission.
            let localStream: MediaStream;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            } catch {
                // Fallback to audio-only if camera is blocked
                localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            }
            if (peerRef.current !== pc || pc.signalingState === 'closed') {
                localStream.getTracks().forEach((t) => t.stop());
                return undefined;
            }
            localStreamRef.current = localStream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
            if (pc.signalingState !== 'closed') {
                localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
            } else {
                localStream.getTracks().forEach((t) => t.stop());
                return undefined;
            }

            const sendOffer = async () => {
                if (hasSentOfferRef.current || !peerRef.current) return;
                hasSentOfferRef.current = true;
                const offer = await peerRef.current.createOffer();
                await peerRef.current.setLocalDescription(offer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { from: currentUserId, type: 'offer', sdp: offer },
                });
            };

            if (isCaller && isPeerReadyRef.current) {
                await sendOffer();
            }

            return sendOffer;
        };

        channel
            .on('broadcast', { event: 'signal' }, async (payload) => {
                const from = payload?.payload?.from;
                if (!from || from === currentUserId || from !== peerId) return;
                const pc = peerRef.current;
                if (!pc || pc.signalingState === 'closed') return;
                const data = payload.payload;
                if (data.type === 'ready') {
                    isPeerReadyRef.current = true;
                    if (isCaller && !hasSentOfferRef.current && pc.signalingState === 'stable') {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        hasSentOfferRef.current = true;
                        channel.send({
                            type: 'broadcast',
                            event: 'signal',
                            payload: { from: currentUserId, type: 'offer', sdp: offer },
                        });
                    }
                    return;
                }
                if (data.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { from: currentUserId, type: 'answer', sdp: answer },
                    });
                } else if (data.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    setStatus('connected');
                } else if (data.type === 'ice' && data.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) {
                        console.warn('ICE candidate error', e);
                    }
                } else if (data.type === 'hangup') {
                    setStatus('ended');
                    onClose();
                }
            })
            .subscribe(async () => {
                try {
                    const sendOffer = await setupPeer();
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { from: currentUserId, type: 'ready' },
                    });
                    if (!isCaller && !readyIntervalRef.current) {
                        readyIntervalRef.current = window.setInterval(() => {
                            if (statusRef.current === 'connected' || statusRef.current === 'ended') return;
                            channel.send({
                                type: 'broadcast',
                                event: 'signal',
                                payload: { from: currentUserId, type: 'ready' },
                            });
                        }, 2000);
                    } else if (isCaller && isPeerReadyRef.current && sendOffer) {
                        await sendOffer();
                    }
                } catch (e: any) {
                    const msg = e?.message || 'Video chat failed to start.';
                    const isClosed = /signalingState.*closed|RTCPeerConnection.*closed/i.test(String(msg));
                    if (isClosed) {
                        return;
                    }
                    console.error('Video call setup failed', e);
                    setErrorMessage(msg);
                    setStatus('error');
                }
            });

        return () => {
            if (readyIntervalRef.current) {
                clearInterval(readyIntervalRef.current);
                readyIntervalRef.current = null;
            }
            try {
                supabase.removeChannel(channel);
            } catch (e) {
                console.warn('[VideoCallModal] removeChannel failed:', e);
            }
            peerRef.current?.close();
            peerRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        };
    }, [conversationId, currentUserId, isCaller, onClose, peerId]);

    const toggleMute = () => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        });
    };

    const toggleCamera = () => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
            setIsCameraOff(!track.enabled);
        });
    };

    const hangUp = () => {
        const supabase = getSupabase();
        supabase.channel(`video_call:${conversationId}`).send({
            type: 'broadcast',
            event: 'signal',
            payload: { from: currentUserId, type: 'hangup' },
        });
        setStatus('ended');
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                hangUp();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const requestPermissions = async () => {
        try {
            setPermissionHint(null);
            if (typeof window !== 'undefined' && !window.isSecureContext) {
                setPermissionHint('Video chat requires HTTPS (secure context).');
                return;
            }
            if (!navigator.mediaDevices?.getUserMedia) {
                setPermissionHint('Camera or microphone access is not supported on this device.');
                return;
            }
            const temp = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            temp.getTracks().forEach((t) => t.stop());
            setPermissionHint('Permissions granted. Try starting the call again.');
        } catch {
            setPermissionHint('Please allow camera and microphone access in your browser.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-orange-400">Video Call</p>
                        <p className="text-sm text-zinc-400">
                            {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Live' : status === 'error' ? 'Unavailable' : 'Ended'}
                        </p>
                    </div>
                    <button onClick={hangUp} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700" aria-label="End call and close">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                {(status === 'error' || permissionHint) && (
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-200">
                        {permissionHint || errorMessage || 'Video chat is unavailable right now. Please check camera/mic permissions and HTTPS.'}
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                onClick={requestPermissions}
                                className="px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600"
                            >
                                Allow Camera & Mic
                            </button>
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-full bg-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-600"
                            >
                                Leave (no camera)
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-black/80">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-video rounded-2xl overflow-hidden bg-black/80">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={toggleMute}
                        className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-2"
                    >
                        <MicrophoneIcon className="w-4 h-4" />
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                        onClick={toggleCamera}
                        className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-2"
                    >
                        <VideoCameraIcon className="w-4 h-4" />
                        {isCameraOff ? 'Camera On' : 'Camera Off'}
                    </button>
                    <button
                        onClick={hangUp}
                        className="px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                    >
                        End Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;
