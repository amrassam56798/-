import React, { useState, useRef } from 'react';
import { editImage, fileToGenerativePart } from '../services/gemini';
import { Loader2, Wand2, UploadCloud, ArrowRight } from 'lucide-react';

const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImagePreview, setOriginalImagePreview] = useState('');
    const [editedImage, setEditedImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setOriginalImage(file);
            setOriginalImagePreview(URL.createObjectURL(file));
            setEditedImage('');
            setError('');
        }
    };

    const handleEdit = async () => {
        if (!prompt.trim() || !originalImage) {
            setError('الرجاء رفع صورة وكتابة وصف للتعديل.');
            return;
        }
        setIsLoading(true);
        setError('');
        setEditedImage('');

        const result = await editImage(prompt, originalImage);
        if (result) {
            setEditedImage(result);
        } else {
            setError('عذراً، حدث خطأ أثناء تعديل الصورة. حاول مرة أخرى أو استخدم صورة مختلفة.');
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">محرر الصور الذكي 🪄</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">ارفع صورة واكتب التعديل الذي تريده. دع الذكاء الاصطناعي يبدع!</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <label className="block text-lg font-bold mb-2 text-center text-gray-700 dark:text-gray-200">1. ارفع الصورة الأصلية</label>
                        <div 
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            {originalImagePreview ? (
                                <img src={originalImagePreview} alt="Original" className="max-h-64 mx-auto rounded-md" />
                            ) : (
                                <div className="text-gray-500 dark:text-gray-400">
                                    <UploadCloud className="mx-auto h-12 w-12" />
                                    <p className="mt-2">انقر هنا لرفع صورة</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block text-lg font-bold mb-2 text-center text-gray-700 dark:text-gray-200">2. اطلب التعديل</label>
                         <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="مثال: أضف نظارة شمسية على الشخص"
                            rows={4}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                        />
                    </div>
                </div>
                <div className="mt-6">
                     <button
                        onClick={handleEdit}
                        disabled={isLoading || !originalImage || !prompt}
                        className="w-full bg-primary-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <>نفّذ التعديل <Wand2 className="ms-2"/></>}
                    </button>
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">الصورة الأصلية:</h2>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md min-h-[200px] flex items-center justify-center">
                        {originalImagePreview ? (
                            <img src={originalImagePreview} alt="Original Preview" className="max-h-96 w-auto rounded-lg" />
                        ) : <p className="text-gray-400">لم يتم رفع صورة بعد</p>}
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">الصورة المعدّلة:</h2>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md min-h-[200px] flex items-center justify-center">
                        {isLoading ? (
                             <div className="text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto" />
                                <p className="mt-2 text-gray-600 dark:text-gray-300">جارٍ تطبيق التعديلات...</p>
                            </div>
                        ) : editedImage ? (
                            <img src={editedImage} alt="Edited" className="max-h-96 w-auto rounded-lg" />
                        ) : <p className="text-gray-400">ستظهر النتيجة هنا</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
