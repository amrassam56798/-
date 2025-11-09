import React, { useState } from 'react';
import { generateText } from '../services/gemini';
import { Loader2, Link } from 'lucide-react';
import { GroundingChunk } from '@google/genai';

const TeacherComparator: React.FC = () => {
    const [teachers, setTeachers] = useState('');
    const [comparison, setComparison] = useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCompare = async () => {
        if (!teachers.trim()) {
            setComparison('الرجاء إدخال أسماء المدرسين للمقارنة.');
            return;
        }
        setIsLoading(true);
        setComparison('');
        setSources([]);

        const prompt = `بصفتك خبيرًا في تقييم المعلمين لطلاب الثانوية العامة في مصر، قارن بين المدرسين التاليين: ${teachers}.
        استخدم بحث جوجل للعثور على أحدث المعلومات المتاحة.
        وضح نقاط القوة والضعف لكل مدرس في أسلوب الشرح، المحتوى المقدم (مذكرات، مراجعات)، التفاعل مع الطلاب، والآراء الشائعة حولهم.
        قدم المقارنة في شكل جدول أو نقاط منظمة وواضحة.`;

        const response = await generateText(prompt, "أنت خبير تقييم محايد وموضوعي.", 'gemini-2.5-flash', {
            tools: [{googleSearch: {}}],
        });
        
        setComparison(response.text);
        if (response.candidates && response.candidates[0].groundingMetadata?.groundingChunks) {
            setSources(response.candidates[0].groundingMetadata.groundingChunks);
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">مقارنة المدرسين 🧑‍🏫</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">أدخل أسماء المدرسين للحصول على مقارنة موضوعية مدعومة بأحدث المعلومات من بحث جوجل.</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={teachers}
                        onChange={(e) => setTeachers(e.target.value)}
                        placeholder="مثال: أ. محمد صالح، أ. أحمد علي"
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                    />
                    <button
                        onClick={handleCompare}
                        disabled={isLoading}
                        className="bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'قارن الآن'}
                    </button>
                </div>
            </div>

            {comparison && (
                <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">نتائج المقارنة:</h2>
                    <div className="prose prose-lg dark:prose-invert max-w-none" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: comparison.replace(/\n/g, '<br />') }}></div>
                    
                    {sources.length > 0 && (
                        <div className="mt-6 border-t dark:border-gray-700 pt-4">
                            <h3 className="font-bold mb-2 flex items-center gap-2"><Link size={18}/> المصادر:</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {sources.map((chunk, index) => (
                                    chunk.web && (
                                        <li key={index}>
                                            <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                {chunk.web.title || chunk.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherComparator;
