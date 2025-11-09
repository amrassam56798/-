import React, { useState } from 'react';
import { analyzeYouTubeVideo } from '../services/gemini';
import { Loader2, Youtube, Film } from 'lucide-react';

const VideoAnalyzer: React.FC = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [prompt, setPrompt] = useState('اشرح هذا الفيديو التعليمي بالتفصيل. لخص النقاط الرئيسية واذكر المفاهيم الأساسية المشروحة.');
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const isValidHttpUrl = (string: string) => {
        let url;
        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    }

    const handleAnalyze = async () => {
        if (!videoUrl.trim() || !isValidHttpUrl(videoUrl)) {
            setError('الرجاء إدخال رابط يوتيوب صحيح.');
            return;
        }
        if (!prompt.trim()) {
            setError('الرجاء كتابة طلب التحليل.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult('');

        const response = await analyzeYouTubeVideo(videoUrl, prompt);
        setAnalysisResult(response.text);
        setIsLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">محلل فيديوهات يوتيوب 🧪</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">ألصق رابط فيديو من يوتيوب، وسيقوم الذكاء الاصطناعي بتحليله وشرحه لك بالاعتماد على المعلومات المتاحة عنه.</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
                <div>
                    <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رابط الفيديو من يوتيوب:</label>
                    <div className="relative">
                        <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            id="videoUrl"
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full p-3 ps-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ماذا تريد أن تعرف عن الفيديو؟</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                    />
                </div>
                 <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'حلل الفيديو الآن'}
                </button>
                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </div>
            
            {(isLoading || analysisResult) && (
                 <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">نتائج التحليل:</h2>
                     {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                        </div>
                     ) : (
                        <div className="prose prose-lg dark:prose-invert max-w-none" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }}></div>
                     )}
                 </div>
            )}
            
            {!isLoading && !analysisResult && (
                 <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                    <Film size={64} className="mx-auto opacity-30" />
                    <p className="mt-4">سيظهر تحليل الفيديو هنا.</p>
                </div>
            )}
        </div>
    );
};

export default VideoAnalyzer;
