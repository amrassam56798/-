
import React, { useState } from 'react';
import { generateText } from '../services/gemini';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface StudySession {
    id: number;
    subject: string;
    teacher: string;
    time: string;
}

const Scheduler: React.FC = () => {
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [plan, setPlan] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const addSession = () => {
        setSessions([...sessions, { id: Date.now(), subject: '', teacher: '', time: '' }]);
    };
    
    const removeSession = (id: number) => {
        setSessions(sessions.filter(s => s.id !== id));
    };

    const handleSessionChange = (id: number, field: keyof Omit<StudySession, 'id'>, value: string) => {
        setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const generatePlan = async () => {
        if (sessions.length === 0) {
            setPlan('الرجاء إضافة حصص المذاكرة أولاً.');
            return;
        }
        setIsLoading(true);
        setPlan('');

        const sessionsText = sessions.map(s => `- المادة: ${s.subject}, المدرس: ${s.teacher}, الموعد المقترح للمذاكرة: ${s.time}`).join('\n');
        const prompt = `بناءً على حصص المذاكرة التالية، قم بإنشاء خطة وجدول مذاكرة أسبوعي ذكي ومنظم لطالب ثانوية عامة. تأكد من توزيع المواد بشكل متوازن وتضمين أوقات للراحة والمراجعة.\n\nالحصص:\n${sessionsText}`;
        
        // FIX: `generateText` returns a `GenerateContentResponse` object. The text content
        // must be extracted from the `.text` property for the state update.
        const result = await generateText(prompt);
        setPlan(result.text);
        setIsLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">تنظيم الوقت ومنع التراكم 🗓️</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">أضف موادك ومواعيدك، وسأصنع لك أفضل جدول مذاكرة.</p>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
                <h2 className="text-xl font-bold">حصص المذاكرة:</h2>
                {sessions.map((session) => (
                    <div key={session.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border dark:border-gray-700 rounded-lg">
                        <input type="text" placeholder="اسم المادة" value={session.subject} onChange={e => handleSessionChange(session.id, 'subject', e.target.value)} className="p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="text" placeholder="اسم المدرس" value={session.teacher} onChange={e => handleSessionChange(session.id, 'teacher', e.target.value)} className="p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="text" placeholder="ميعاد المذاكرة" value={session.time} onChange={e => handleSessionChange(session.id, 'time', e.target.value)} className="p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                        <button onClick={() => removeSession(session.id)} className="bg-red-500 text-white rounded p-2 flex items-center justify-center hover:bg-red-600"><Trash2 size={20}/></button>
                    </div>
                ))}
                <button onClick={addSession} className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold py-2 px-4 rounded hover:bg-primary-50 dark:hover:bg-primary-900/50">
                    <Plus size={20} /> أضف حصة جديدة
                </button>
            </div>
            
            <div className="mt-6">
                 <button
                    onClick={generatePlan}
                    disabled={isLoading}
                    className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'أنشئ الخطة الذكية'}
                </button>
            </div>

            {plan && (
                <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">خطة المذاكرة المقترحة:</h2>
                    <div className="prose prose-lg dark:prose-invert max-w-none" style={{ whiteSpace: 'pre-wrap' }}>{plan}</div>
                </div>
            )}
        </div>
    );
};

export default Scheduler;
