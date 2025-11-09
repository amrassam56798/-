import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TeacherComparator from './components/TeacherComparator';
import StudyHelper from './components/StudyHelper';
import Scheduler from './components/Scheduler';
import MentalHealth from './components/MentalHealth';
import QuizGenerator from './components/QuizGenerator';
import Profile from './components/Profile';
import Settings from './Settings';
import Chatbot from './components/Chatbot';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';
import VoiceAssistant from './components/VoiceAssistant';
import PlaceFinder from './components/PlaceFinder';
import VideoAnalyzer from './components/VideoAnalyzer';
import { Menu, X, Home, Users, BookOpen, Calendar, Heart, BrainCircuit, User, Settings as SettingsIcon, Image, Wand2, Video, MicVocal, Map, Youtube } from 'lucide-react';

type Page = 'dashboard' | 'comparator' | 'study' | 'scheduler' | 'mental' | 'quiz' | 'profile' | 'settings' | 'imageGenerator' | 'imageEditor' | 'videoGenerator' | 'voiceAssistant' | 'placeFinder' | 'videoAnalyzer';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <Dashboard />;
            case 'comparator':
                return <TeacherComparator />;
            case 'study':
                return <StudyHelper />;
            case 'scheduler':
                return <Scheduler />;
            case 'mental':
                return <MentalHealth />;
            case 'quiz':
                return <QuizGenerator />;
            case 'profile':
                return <Profile />;
            case 'imageGenerator':
                return <ImageGenerator />;
            case 'imageEditor':
                return <ImageEditor />;
            case 'videoGenerator':
                return <VideoGenerator />;
            case 'voiceAssistant':
                return <VoiceAssistant />;
            case 'placeFinder':
                return <PlaceFinder />;
            case 'videoAnalyzer':
                return <VideoAnalyzer />;
            case 'settings':
                return <Settings theme={theme} toggleTheme={toggleTheme} />;
            default:
                return <Dashboard />;
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'لوحة التحكم', icon: Home },
        { id: 'profile', label: 'تقدمي الدراسي', icon: User },
        { id: 'study', label: 'مساعد المذاكرة', icon: BookOpen },
        { id: 'quiz', label: 'إنشاء اختبار', icon: BrainCircuit },
        { id: 'scheduler', label: 'تنظيم الوقت', icon: Calendar },
        { id: 'comparator', label: 'مقارنة المدرسين', icon: Users },
        { id: 'placeFinder', label: 'مستكشف الأماكن', icon: Map },
        { id: 'voiceAssistant', label: 'المساعد الصوتي', icon: MicVocal },
        { id: 'imageGenerator', label: 'مولّد الصور', icon: Image },
        { id: 'imageEditor', label: 'محرر الصور', icon: Wand2 },
        { id: 'videoGenerator', label: 'صانع الفيديو', icon: Video },
        { id: 'videoAnalyzer', label: 'محلل اليوتيوب', icon: Youtube },
        { id: 'mental', label: 'تحسين النفسية', icon: Heart },
        { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
    ];
    
    const NavLink: React.FC<{ id: Page; label: string; icon: React.ElementType }> = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => { setPage(id); setSidebarOpen(false); }}
            className={`flex items-center w-full text-start p-3 rounded-lg transition-colors ${page === id ? 'bg-primary-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
        >
            <Icon className="me-3 h-5 w-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Sidebar for large screens */}
            <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-e dark:border-gray-700 p-4 flex-shrink-0 overflow-y-auto">
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-8 text-center">مساعدك الذكي</h1>
                <nav className="space-y-2">
                    {navItems.map(item => <NavLink key={item.id} id={item.id as Page} label={item.label} icon={item.icon} />)}
                </nav>
            </aside>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
                <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
                <aside className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 p-4 z-50 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">القائمة</h1>
                        <button onClick={() => setSidebarOpen(false)} className="text-gray-600 dark:text-gray-300">
                            <X size={24} />
                        </button>
                    </div>
                    <nav className="space-y-2">
                         {navItems.map(item => <NavLink key={item.id} id={item.id as Page} label={item.label} icon={item.icon} />)}
                    </nav>
                </aside>
            </div>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm lg:justify-end">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 dark:text-gray-300">
                        <Menu size={24} />
                    </button>
                    <h2 className="text-xl font-bold lg:hidden">{navItems.find(item => item.id === page)?.label}</h2>
                    <div className="w-8 h-8"></div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {renderPage()}
                </div>
            </main>
            <Chatbot />
        </div>
    );
};

export default App;