import React, { useState, useRef, useEffect } from 'react';
// FIX: Moved video generation logic into the component to handle API key selection correctly.
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { fileToGenerativePart } from '../services/gemini';
import { Loader2, Video, UploadCloud, AlertTriangle } from 'lucide-react';


type AspectRatio = '16:9' | '9:16';

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if(window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success to avoid race condition, the API call will fail if it's not set
            setApiKeySelected(true); 
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setGeneratedVideoUrl('');
            setError('');
        }
    };

    const pollOperation = async (operation: GenerateVideosOperation, ai: GoogleGenAI) => {
        let currentOperation = operation;
        while (!currentOperation.done) {
            setLoadingMessage('يعمل الذكاء الاصطناعي على تحليل طلبك...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            try {
                currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
            } catch (e: any) {
                if (e.message.includes("Requested entity was not found.")) {
                    setError("حدث خطأ في المصادقة. قد تحتاج إلى تحديد مفتاح API مرة أخرى.");
                    setApiKeySelected(false); // Reset key selection state
                } else {
                    setError("حدث خطأ أثناء متابعة عملية إنشاء الفيديو.");
                }
                setIsLoading(false);
                return;
            }
        }
        
        const downloadLink = currentOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink && process.env.API_KEY) {
             setLoadingMessage('جارٍ تحميل الفيديو...');
             // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setGeneratedVideoUrl(url);
        } else {
            setError('لم يتمكن من إنشاء الفيديو أو الحصول على رابط التحميل.');
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
             setError('الرجاء كتابة وصف للفيديو.');
             return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedVideoUrl('');
        setLoadingMessage('بدء عملية إنشاء الفيديو... هذه العملية قد تستغرق عدة دقائق.');

        try {
            // FIX: Create a new GoogleGenAI instance right before the API call to use the selected API key.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let operation;
            if (imageFile) {
                const image = await fileToGenerativePart(imageFile);
                operation = await ai.models.generateVideos({
                    model: 'veo-3.1-fast-generate-preview',
                    prompt: prompt,
                    image: {
                        imageBytes: image.inlineData.data,
                        mimeType: image.inlineData.mimeType,
                    },
                    config: {
                        numberOfVideos: 1,
                        resolution: '720p',
                        aspectRatio: aspectRatio
                    }
                });
            } else {
                 operation = await ai.models.generateVideos({
                    model: 'veo-3.1-fast-generate-preview',
                    prompt: prompt,
                    config: {
                        numberOfVideos: 1,
                        resolution: '720p',
                        aspectRatio: aspectRatio
                    }
                });
            }
            
            await pollOperation(operation, ai);
        } catch (e: any) {
            if (e.message.includes("API key not valid")) {
                setError("مفتاح API غير صالح. الرجاء تحديده مرة أخرى.");
                setApiKeySelected(false);
            } else if (e.message.includes("Requested entity was not found.")) {
                setError("حدث خطأ في المصادقة. قد تحتاج إلى تحديد مفتاح API مرة أخرى.");
                setApiKeySelected(false);
            }
            else {
                setError('حدث خطأ غير متوقع أثناء بدء إنشاء الفيديو.');
                console.error(e);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    if (!apiKeySelected) {
        return (
             <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                <h2 className="mt-4 text-2xl font-bold">مطلوب إذن وصول</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    تتطلب ميزة إنشاء الفيديو استخدام موارد حوسبة متقدمة. يرجى تحديد مفتاح API الخاص بك للمتابعة.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                   للمزيد من المعلومات حول الفوترة، يرجى زيارة <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">صفحة الفوترة</a>.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="mt-6 w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300"
                >
                    تحديد مفتاح API
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">صانع الفيديو بالذكاء الاصطناعي 🎥</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">حوّل أفكارك إلى فيديو! ارفع صورة بداية (اختياري)، صف الحركة، واختر الأبعاد.</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
                <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    {imagePreview ? (
                        <img src={imagePreview} alt="Original" className="max-h-48 mx-auto rounded-md" />
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                            <UploadCloud className="mx-auto h-12 w-12" />
                            <p className="mt-2">1. انقر لرفع صورة بداية (اختياري)</p>
                        </div>
                    )}
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="2. صف الفيديو الذي تريده هنا..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                />
                <div className="flex items-center gap-4">
                     <label htmlFor="aspect-ratio" className="font-medium text-gray-700 dark:text-gray-300">3. اختر الأبعاد:</label>
                    <select
                        id="aspect-ratio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                    >
                        <option value="16:9">شاشة عريضة (16:9)</option>
                        <option value="9:16">طولي (9:16)</option>
                    </select>
                </div>
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'أنشئ الفيديو'}
                </button>
                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </div>

            <div className="mt-8">
                {isLoading ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <Loader2 size={48} className="mx-auto animate-spin text-primary-500" />
                        <p className="mt-4 text-lg font-semibold">{loadingMessage}</p>
                        <p className="text-sm">هذه العملية قد تستغرق بضع دقائق، يرجى عدم إغلاق الصفحة.</p>
                    </div>
                ) : generatedVideoUrl ? (
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold mb-4">الفيديو جاهز:</h2>
                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg" />
                    </div>
                ) : (
                    <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                        <Video size={64} className="mx-auto opacity-30" />
                        <p className="mt-4">سيظهر الفيديو الذي تم إنشاؤه هنا.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default VideoGenerator;
