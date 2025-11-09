
import React, { useState } from 'react';
import { generateQuiz } from '../services/gemini';
import { Loader2 } from 'lucide-react';

interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

interface QuizData {
    quiz: QuizQuestion[];
}

const QuizView: React.FC<{ quizData: QuizData; onFinish: () => void }> = ({ quizData, onFinish }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizData.quiz.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setShowResults(true);
        }
    };

    if (showResults) {
        const score = quizData.quiz.reduce((acc, question, index) => {
            return acc + (question.answer === selectedAnswers[index] ? 1 : 0);
        }, 0);
        const percentage = (score / quizData.quiz.length) * 100;

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-center">النتيجة النهائية</h2>
                <div className="text-center mb-6">
                    <p className="text-lg">لقد أجبت بشكل صحيح على <span className="font-bold text-green-500">{score}</span> من <span className="font-bold">{quizData.quiz.length}</span> أسئلة.</p>
                    <p className="text-4xl font-bold my-4 text-primary-600 dark:text-primary-400">{percentage.toFixed(0)}%</p>
                </div>
                <div className="space-y-4">
                    {quizData.quiz.map((q, i) => (
                        <div key={i} className={`p-3 rounded-lg ${selectedAnswers[i] === q.answer ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                            <p className="font-bold">{i + 1}. {q.question}</p>
                            <p className="text-sm">إجابتك: <span className="font-semibold">{selectedAnswers[i] || "لم تجب"}</span></p>
                            <p className="text-sm text-green-700 dark:text-green-300">الإجابة الصحيحة: <span className="font-semibold">{q.answer}</span></p>
                        </div>
                    ))}
                </div>
                <button onClick={onFinish} className="mt-6 w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700">إنشاء اختبار جديد</button>
            </div>
        );
    }
    
    const currentQuestion = quizData.quiz[currentQuestionIndex];
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="mb-4">
                <p className="text-gray-500 dark:text-gray-400">سؤال {currentQuestionIndex + 1} من {quizData.quiz.length}</p>
                <h2 className="text-xl font-bold mt-1">{currentQuestion.question}</h2>
            </div>
            <div className="space-y-3">
                {currentQuestion.options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full text-right p-4 rounded-lg border-2 transition-colors ${selectedAnswers[currentQuestionIndex] === option ? 'bg-primary-500 border-primary-500 text-white' : 'bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className="mt-6 w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800"
            >
                {currentQuestionIndex < quizData.quiz.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
            </button>
        </div>
    );
};


const QuizGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('الرجاء إدخال اسم الدرس.');
            return;
        }
        setIsLoading(true);
        setError('');
        setQuizData(null);
        
        const result = await generateQuiz(topic);
        if (result && result.quiz) {
            setQuizData(result);
        } else {
            setError('عذراً، لم أتمكن من إنشاء الاختبار. حاول مرة أخرى بموضوع مختلف.');
        }
        setIsLoading(false);
    };

    if (quizData) {
        return <QuizView quizData={quizData} onFinish={() => setQuizData(null)} />;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">إنشاء اختبار إلكتروني 🧠</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">اكتب اسم الدرس أو الموضوع، وسأقوم بإنشاء اختبار تفاعلي لك من 10 أسئلة.</p>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                 <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="مثال: الفصل الأول في الفيزياء"
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'ابدأ الاختبار'}
                    </button>
                </div>
                 {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>
        </div>
    );
};

export default QuizGenerator;
