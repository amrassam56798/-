import React, { useEffect, useRef, useState } from 'react';
import { BookCheck, Award, Star, Target, Sparkles, Loader2, Edit, Save } from 'lucide-react';
import Chart from 'chart.js/auto';
import { generateText } from '../services/gemini';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4 space-x-reverse">
        <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full text-primary-600 dark:text-primary-300">
            {icon}
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    const [studyGoal, setStudyGoal] = useState('');
    const [goalInput, setGoalInput] = useState('');
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [todaysFocus, setTodaysFocus] = useState('');
    const [isFocusLoading, setIsFocusLoading] = useState(false);

    useEffect(() => {
        const savedGoal = localStorage.getItem('studyGoal');
        if (savedGoal) {
            setStudyGoal(savedGoal);
            setGoalInput(savedGoal);
        } else {
            setIsEditingGoal(true);
        }
    }, []);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if(ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
                        datasets: [{
                            label: 'ساعات المذاكرة',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                            borderRadius: 8,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                   color: document.documentElement.classList.contains('dark') ? '#FFF' : '#333'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                   color: document.documentElement.classList.contains('dark') ? '#FFF' : '#333'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        }
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []);

    const handleSaveGoal = () => {
        if (goalInput.trim()) {
            setStudyGoal(goalInput);
            localStorage.setItem('studyGoal', goalInput);
            setIsEditingGoal(false);
        }
    };

    const handleGenerateFocus = async () => {
        setIsFocusLoading(true);
        setTodaysFocus('');
        const prompt = studyGoal
            ? `بناءً على هدفي الرئيسي وهو "${studyGoal}", اقترح عليّ 3 مهام دراسية محددة وواقعية يمكنني إنجازها اليوم. اجعلها في شكل قائمة مرقمة مع إيموجي لكل مهمة.`
            : `أنا طالب ثانوية عامة. اقترح عليّ 3 مهام دراسية متنوعة ومحددة يمكنني إنجازها اليوم لأبقى متقدماً في دراستي. اجعلها في شكل قائمة مرقمة مع إيموجي لكل مهمة.`;

        const response = await generateText(prompt, "أنت مرشد أكاديمي خبير ومحفز.");
        setTodaysFocus(response.text);
        setIsFocusLoading(false);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">أهلاً بعودتك يا بطل! 👋</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="الدروس المكتملة" value="0" icon={<BookCheck size={24} />} />
                <StatCard title="الاختبارات المجتازة" value="0" icon={<Award size={24} />} />
                <StatCard title="متوسط الدرجات" value="0%" icon={<Star size={24} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Goals Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="text-red-500"/> أهداف المذاكرة</h2>
                    {isEditingGoal ? (
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={goalInput}
                                onChange={(e) => setGoalInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveGoal()}
                                placeholder="مثال: إتقان الفصل الأول في الكيمياء"
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <button onClick={handleSaveGoal} className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 flex-shrink-0"><Save size={20}/></button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{studyGoal}</p>
                             <button onClick={() => setIsEditingGoal(true)} className="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 flex-shrink-0"><Edit size={18}/></button>
                        </div>
                    )}
                </div>

                {/* Today's Focus Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="text-yellow-500"/> تركيز اليوم</h2>
                    <div className="flex-grow flex items-center justify-center">
                        {isFocusLoading ? (
                            <div className="text-center">
                                <Loader2 className="animate-spin text-primary-500 h-8 w-8" />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">جارٍ التفكير...</p>
                            </div>
                        ) : todaysFocus ? (
                            <div className="prose dark:prose-invert max-w-none w-full" style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: todaysFocus.replace(/\n/g, '<br />') }} />
                        ) : (
                            <button onClick={handleGenerateFocus} className="w-full bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-600 transition-transform transform hover:scale-105">
                                ✨ اقترح لي خطة اليوم!
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4">تقدمك هذا الأسبوع</h2>
                <div className="h-72">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4">نسبة الإنجاز الكلية</h2>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                    <div 
                        className="bg-primary-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold" 
                        style={{ width: '0%' }}
                    >
                        0%
                    </div>
                </div>
                <p className="text-center mt-2 text-gray-600 dark:text-gray-300">ابدأ رحلتك نحو التفوق اليوم! ✨</p>
            </div>
        </div>
    );
};

export default Dashboard;
