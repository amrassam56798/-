
import React from 'react';
import { Sun, Moon, Bell, MessageSquareQuote } from 'lucide-react';

interface SettingsProps {
    theme: string;
    toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, toggleTheme }) => {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">الإعدادات</h1>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-6">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {theme === 'light' ? <Sun className="text-yellow-500" size={24} /> : <Moon className="text-blue-400" size={24}/>}
                        <span className="font-bold">الوضع الليلي</span>
                    </div>
                    <button onClick={toggleTheme} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Notifications Toggle */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Bell className="text-green-500" size={24} />
                        <span className="font-bold">التنبيهات الذكية</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                </div>
            </div>
            
            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquareQuote />
                    اقتراحات ودعم
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">هل لديك فكرة لتطوير التطبيق؟ شاركنا بها!</p>
                <textarea
                    placeholder="اكتب اقتراحك هنا..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700 mb-4"
                />
                 <button className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700">
                    إرسال الاقتراح
                </button>
            </div>
        </div>
    );
};

export default Settings;
