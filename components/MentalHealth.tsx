
import React, { useState } from 'react';
import { generateText } from '../services/gemini';
import { Loader2 } from 'lucide-react';

const MentalHealth: React.FC = () => {
    const [advice, setAdvice] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getAdvice = async () => {
        setIsLoading(true);
        setAdvice('');

        const prompt = "أنا طالب ثانوية عامة وأشعر بالضغط والإرهاق. قدم لي نصيحة مخصصة لتحسين حالتي النفسية، اجعلها تحفيزية ومبهجة ومليئة بالإيموجيز الإيجابية مثل ❤️✨🔥.";
        // FIX: `generateText` returns a `GenerateContentResponse` object. The text content
        // must be extracted from the `.text` property for the state update.
        const result = await generateText(prompt);
        setAdvice(result.text);
        setIsLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">تحسين النفسية 😌</h1>
            <p className="mb-8 text-gray-600 dark:text-gray-300">عندما تشعر بالضغط، اضغط على الزر للحصول على دفعة من الطاقة الإيجابية.</p>

            <button
                onClick={getAdvice}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-full hover:shadow-lg transform hover:scale-105 transition duration-300 flex items-center justify-center w-full md:w-auto mx-auto disabled:opacity-70 disabled:scale-100"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : '✨ امنحني اقتراحًا!'}
            </button>
            
            {advice && (
                <div className="mt-10 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center transform transition-all duration-500 animate-fade-in">
                    <p className="text-xl leading-relaxed text-gray-700 dark:text-gray-200" style={{ whiteSpace: 'pre-wrap' }}>{advice}</p>
                </div>
            )}
        </div>
    );
};

export default MentalHealth;
