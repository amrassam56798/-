import React, { useState } from 'react';
import { generateImage } from '../services/gemini';
import { Loader2, Image as ImageIcon } from 'lucide-react';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [generatedImage, setGeneratedImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('الرجاء إدخال وصف للصورة.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedImage('');

        const result = await generateImage(prompt, aspectRatio);
        if (result) {
            setGeneratedImage(result);
        } else {
            setError('عذراً، حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى.');
        }
        setIsLoading(false);
    };

    const aspectRatios: { value: AspectRatio, label: string }[] = [
        { value: '1:1', label: 'مربع' },
        { value: '16:9', label: 'شاشة عريضة' },
        { value: '9:16', label: 'طولي' },
        { value: '4:3', label: 'أفقي' },
        { value: '3:4', label: 'رأسي' },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">مولّد الصور بالذكاء الاصطناعي 🎨</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">اكتب فكرتك، وسأحولها إلى صورة. كلما كان الوصف أدق، كانت النتيجة أفضل.</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: رائد فضاء يقرأ كتاباً على سطح القمر، بأسلوب الرسم الزيتي"
                    rows={4}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                />
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الأبعاد:</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                        >
                            {aspectRatios.map(ar => (
                                <option key={ar.value} value={ar.value}>{ar.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex-1 bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'أنشئ الصورة'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </div>

            {isLoading && (
                <div className="mt-8 flex justify-center items-center">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto" />
                        <p className="mt-2 text-gray-600 dark:text-gray-300">جارٍ إنشاء الصورة... قد يستغرق الأمر بضع لحظات.</p>
                    </div>
                </div>
            )}

            {generatedImage && (
                <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">صورتك جاهزة:</h2>
                    <img src={generatedImage} alt={prompt} className="w-full rounded-lg shadow-lg" />
                </div>
            )}
            
            {!isLoading && !generatedImage && (
                 <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                    <ImageIcon size={64} className="mx-auto opacity-30" />
                    <p className="mt-4">ستظهر صورتك التي تم إنشاؤها هنا.</p>
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;