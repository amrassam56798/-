import React from 'react';

const mockProgress: { exam: string; score: number; total: number; percent: number }[] = [];

const Profile: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">تقدمي الدراسي</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4">ملخص الأداء</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">0</p>
                        <p className="text-gray-500 dark:text-gray-400">اختبارات</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-500">0%</p>
                        <p className="text-gray-500 dark:text-gray-400">متوسط الدرجات</p>
                    </div>
                     <div>
                        <p className="text-2xl font-bold text-blue-500">0%</p>
                        <p className="text-gray-500 dark:text-gray-400">أعلى درجة</p>
                    </div>
                     <div>
                        <p className="text-2xl font-bold text-red-500">0%</p>
                        <p className="text-gray-500 dark:text-gray-400">أقل درجة</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4">سجل الاختبارات</h2>
                <div className="space-y-4">
                    {mockProgress.length > 0 ? (
                        mockProgress.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-bold">{item.exam}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">النتيجة: {item.score} / {item.total}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${item.percent >= 80 ? 'text-green-500' : item.percent >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {item.percent}%
                                </span>
                                <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${item.percent >= 80 ? 'bg-green-500' : item.percent >= 60 ? 'bg-yellow-500' : 'text-red-500'}`} style={{width: `${item.percent}%`}}></div>
                                </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                            لم تقم بإجراء أي اختبارات بعد. ابدأ الآن من قسم "إنشاء اختبار"!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;