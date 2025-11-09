import React, { useState, useEffect, useRef } from 'react';
// FIX: Removed `LiveSession` as it is not an exported member of '@google/genai'.
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Loader2 } from 'lucide-react';

// Base64 encoding/decoding functions
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const VoiceAssistant: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [transcripts, setTranscripts] = useState<{ user: string; model: string }[]>([]);
    const [currentInterim, setCurrentInterim] = useState({ user: '', model: '' });
    const [error, setError] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const aiRef = useRef<GoogleGenAI | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts, currentInterim]);


    const startConversation = async () => {
        setIsConnecting(true);
        setError('');
        setTranscripts([]);
        setCurrentInterim({ user: '', model: '' });

        try {
            if (!aiRef.current) {
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            }
            const ai = aiRef.current;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        audioContextRef.current = inputAudioContext;
                        
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                        setIsConnecting(false);
                        setIsActive(true);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        handleServerMessage(message);
                    },
                    onerror: (e: ErrorEvent) => {
                        setError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
                        console.error('WebSocket error:', e);
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: 'You are a friendly and helpful assistant for high school students in Egypt. Keep your answers concise and encouraging. Your name is "رفيق", Rafeeq.',
                },
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            setError('لم نتمكن من الوصول إلى الميكروفون. يرجى التأكد من منح الإذن.');
            console.error('Microphone access error:', err);
            setIsConnecting(false);
        }
    };
    
    const handleServerMessage = async (message: LiveServerMessage) => {
        let currentInput = currentInterim.user;
        let currentOutput = currentInterim.model;

        // Handle transcription
        if (message.serverContent?.inputTranscription) {
            currentInput += message.serverContent.inputTranscription.text;
        }
        if (message.serverContent?.outputTranscription) {
            currentOutput += message.serverContent.outputTranscription.text;
        }
        
        setCurrentInterim({ user: currentInput, model: currentOutput });

        if (message.serverContent?.turnComplete) {
            setTranscripts(prev => [...prev, { user: currentInput, model: currentOutput }]);
            setCurrentInterim({ user: '', model: '' });
        }
        
        // Handle audio output
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            const outputAudioContext = outputAudioContextRef.current;
            const nextStartTime = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            
            source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
            });
            
            source.start(nextStartTime);
            nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
            sourcesRef.current.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = 0;
        }
    };

    const stopConversation = () => {
        setIsConnecting(false);
        setIsActive(false);

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;

        if(outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        outputAudioContextRef.current = null;
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    };

    useEffect(() => {
        return () => stopConversation(); // Cleanup on unmount
    }, []);

    return (
        <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">المساعد الصوتي (تجريبي) 🎙️</h1>
            <p className="mb-8 text-gray-600 dark:text-gray-300">تحدث مباشرة مع الذكاء الاصطناعي. اسأل سؤالك بصوت عالٍ واستمع للإجابة.</p>

            <button
                onClick={isActive ? stopConversation : startConversation}
                disabled={isConnecting}
                className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-300
                    ${isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}
                    ${isConnecting ? 'bg-yellow-500 cursor-not-allowed' : ''}`}
            >
                {isConnecting ? (
                    <Loader2 size={48} className="animate-spin" />
                ) : isActive ? (
                    <MicOff size={48} />
                ) : (
                    <Mic size={48} />
                )}
            </button>
            <p className="mt-4 font-semibold text-lg">{isConnecting ? 'جارٍ الاتصال...' : isActive ? 'المحادثة نشطة... اضغط للإيقاف' : 'اضغط لبدء المحادثة'}</p>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            
            <div className="mt-8 text-left bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4 min-h-[200px]">
                <h2 className="text-xl font-bold border-b dark:border-gray-700 pb-2 mb-4">نص المحادثة:</h2>
                
                {transcripts.map((t, i) => (
                    <React.Fragment key={i}>
                        {t.user && (
                            <div className="flex items-end gap-2 justify-end">
                                <div className="max-w-[80%] p-3 rounded-2xl bg-primary-500 text-white rounded-br-none">
                                    <p>{t.user}</p>
                                </div>
                            </div>
                        )}
                         {t.model && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg" title="رفيق">ر</div>
                                <div className="max-w-[80%] p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                                    <p>{t.model}</p>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {isActive && (
                    <>
                        {currentInterim.user && (
                            <div className="flex items-end gap-2 justify-end opacity-70">
                                <div className="max-w-[80%] p-3 rounded-2xl bg-primary-500 text-white rounded-br-none">
                                    <p>{currentInterim.user}</p>
                                </div>
                            </div>
                        )}
                        {currentInterim.model && (
                            <div className="flex items-end gap-2 justify-start opacity-70">
                                 <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg" title="رفيق">ر</div>
                                <div className="max-w-[80%] p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                                    <p>{currentInterim.model}</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
                
                {transcripts.length === 0 && !currentInterim.user && !currentInterim.model && !isActive && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">سجل المحادثة سيظهر هنا.</p>
                )}
                 <div ref={transcriptEndRef} />
            </div>
        </div>
    );
};

export default VoiceAssistant;
