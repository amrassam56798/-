import React, { useState, useEffect, useRef } from 'react';
import { generateText, generateMindMapMermaid, generateTTSAudio, decodeBase64, decodeAudioData } from '../services/gemini';
import { Loader2, Volume2, StopCircle, ListCollapse, BookOpenCheck, GitFork, HelpCircle, Expand, X, Save, Trash2, History, ChevronDown, Clipboard, Check, Zap, ClipboardPaste } from 'lucide-react';

// mermaid is loaded from a script tag in index.html
declare const mermaid: any;

// === START of MermaidChart component ===
const MermaidChart: React.FC<{ chart: string }> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && chart) {
            try {
                const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'default';
                
                mermaid.initialize({
                    startOnLoad: false,
                    theme: currentTheme,
                    themeVariables: {
                        primaryColor: '#3b82f6',
                        primaryTextColor: '#ffffff',
                        primaryBorderColor: '#2563eb',
                        lineColor: currentTheme === 'dark' ? '#a0a0a0' : '#333333',
                        textColor: currentTheme === 'dark' ? '#ffffff' : '#333333',
                    }
                });
                
                const uniqueId = `mermaid-svg-${Date.now()}`;
                
                mermaid.render(uniqueId, chart)
                    .then(({ svg }: { svg: string; }) => {
                        if (containerRef.current) {
                            containerRef.current.innerHTML = svg;
                            const svgEl = containerRef.current.querySelector('svg');
                            if (svgEl) {
                                svgEl.style.maxWidth = '100%';
                                svgEl.style.height = 'auto';
                            }
                        }
                    })
                    .catch((e: any) => {
                        console.error('Mermaid render error:', e);
                        if (containerRef.current) {
                            containerRef.current.innerHTML = '<p class="text-red-500 text-center">خطأ في عرض الخريطة الذهنية. قد يكون النص المدخل غير متوافق.</p>';
                        }
                    });

            } catch (e) {
                console.error('Error during mermaid setup:', e);
                if (containerRef.current) {
                    containerRef.current.innerHTML = '<p class="text-red-500 text-center">خطأ في عرض الخريطة الذهنية.</p>';
                }
            }
        }
    }, [chart]);

    return (
        <div 
            key={chart} 
            ref={containerRef} 
            className="w-full flex justify-center items-center p-4" 
        />
    );
};
// === END of MermaidChart component ===

const ActionButton: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled: boolean;
    isFeatured?: boolean;
}> = ({ icon: Icon, label, onClick, disabled, isFeatured = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isFeatured ? 'bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900' : 'bg-primary-50 dark:bg-gray-700/50 hover:bg-primary-100 dark:hover:bg-gray-700'}`}
    >
        <Icon className={`w-8 h-8 ${isFeatured ? 'text-purple-600 dark:text-purple-400' : 'text-primary-600 dark:text-primary-400'}`} />
        <span className={`font-semibold ${isFeatured ? 'text-purple-700 dark:text-purple-200' : 'text-gray-700 dark:text-gray-200'}`}>{label}</span>
    </button>
);


interface SavedItem {
    id: number;
    type: 'summarize' | 'explain' | 'mindmap' | 'qa' | 'deep_dive';
    title: string;
    sourceText: string;
    result: string;
    mindMapMermaid?: string;
    createdAt: string;
}

const StudyHelper: React.FC = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [mindMapMermaid, setMindMapMermaid] = useState('');
    const [resultTitle, setResultTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMindMapExpanded, setIsMindMapExpanded] = useState(false);
    const [currentActionType, setCurrentActionType] = useState<'summarize' | 'explain' | 'mindmap' | 'qa' | 'deep_dive' | null>(null);
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [activeSavedItemId, setActiveSavedItemId] = useState<number | null>(null);
    const [isTextCopied, setIsTextCopied] = useState(false);
    const [isMindMapCodeCopied, setIsMindMapCodeCopied] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        try {
            const storedItems = localStorage.getItem('studyHelperSavedItems');
            if (storedItems) {
                setSavedItems(JSON.parse(storedItems));
            }
        } catch (error) {
            console.error("Failed to parse saved items from localStorage", error);
        }
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
            audioContextRef.current?.close();
        };
    }, []);

    const updateLocalStorage = (items: SavedItem[]) => {
        localStorage.setItem('studyHelperSavedItems', JSON.stringify(items));
    };

    const handleAction = async (action: 'summarize' | 'explain' | 'mindmap' | 'qa' | 'deep_dive') => {
        if (!text.trim()) {
            setResult('الرجاء إدخال النص أولاً.');
            setResultTitle('⚠️ خطأ');
            setMindMapMermaid('');
            return;
        }
        setIsLoading(true);
        setResult('');
        setMindMapMermaid('');
        setResultTitle('');
        setCurrentActionType(action);
        
        if (isSpeaking) handleSpeak(); // Stop speaking

        if (action === 'mindmap') {
            const mermaidCode = await generateMindMapMermaid(text);
            setMindMapMermaid(mermaidCode);
            setResultTitle('خريطة ذهنية تفاعلية');
        } else {
            let prompt = '';
            let title = '';
            let model: 'gemini-2.5-flash' | 'gemini-2.5-pro' = 'gemini-2.5-flash';
            let config = {};

            switch (action) {
                case 'summarize':
                    prompt = `لخص الفقرة التالية في نقاط بسيطة وواضحة لطلاب الثانوية العامة:\n\n${text}`;
                    title = 'ملخص النقاط';
                    break;
                case 'explain':
                    prompt = `اشرح الفقرة التالية شرحًا مفصلًا ومبسطًا مناسبًا لطالب في الثانوية العامة، مع استخدام أمثلة لتوضيح المفاهيم الصعبة إن أمكن:\n\n${text}`;
                    title = 'شرح مفصل';
                    break;
                case 'qa':
                    prompt = `استخرج أهم الأسئلة التي يمكن أن تأتي في الامتحان من النص التالي مع إجاباتها النموذجية. اجعلها بصيغة سؤال وجواب واضحة لطالب الثانوية العامة.\n\nالنص:\n${text}`;
                    title = 'أسئلة وإجابات هامة';
                    break;
                case 'deep_dive':
                    prompt = `قم بتحليل معمق للنص التالي. حلل الأفكار الرئيسية، والعلاقات بينها، والاستنتاجات التي يمكن الخروج بها، وأي مفاهيم ضمنية. قدم تحليلك بطريقة منظمة ومفصلة.\n\nالنص:\n${text}`;
                    title = 'تحليل معمّق';
                    model = 'gemini-2.5-pro';
                    config = { thinkingConfig: { thinkingBudget: 32768 } };
                    break;
            }

            const response = await generateText(prompt, "أنت مساعد دراسي خبير، هدفك تبسيط المعلومات لطلاب الثانوية العامة في مصر. كن دقيقاً ومنظماً في إجاباتك.", model, config);
            setResult(response.text);
            setResultTitle(title);
        }
        
        setIsLoading(false);
    };


    const handleSpeak = async () => {
        if (isSpeaking) {
            audioSourceRef.current?.stop();
            setIsSpeaking(false);
            return;
        }

        if (result && audioContextRef.current) {
            setIsLoading(true);
            const base64Audio = await generateTTSAudio(result);
            setIsLoading(false);
            if (!base64Audio) return;

            const audioData = decodeBase64(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => {
                setIsSpeaking(false);
                audioSourceRef.current = null;
            };
            source.start();
            audioSourceRef.current = source;
            setIsSpeaking(true);
        }
    };
    
    const handleCopyText = () => {
        if (!result) return;
        navigator.clipboard.writeText(result).then(() => {
            setIsTextCopied(true);
            setTimeout(() => setIsTextCopied(false), 2000);
        });
    };

    const handleCopyMindMapCode = () => {
        if (!mindMapMermaid) return;
        navigator.clipboard.writeText(mindMapMermaid).then(() => {
            setIsMindMapCodeCopied(true);
            setTimeout(() => setIsMindMapCodeCopied(false), 2000);
        });
    };

    const handleSave = () => {
        if (!currentActionType || (!result && !mindMapMermaid)) return;
        
        const newItem: SavedItem = {
            id: Date.now(),
            type: currentActionType,
            title: resultTitle,
            sourceText: text,
            result: result,
            mindMapMermaid: mindMapMermaid,
            createdAt: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
        };

        const newSavedItems = [newItem, ...savedItems];
        setSavedItems(newSavedItems);
        updateLocalStorage(newSavedItems);
    };

    const handleDelete = (id: number) => {
        const newSavedItems = savedItems.filter(item => item.id !== id);
        setSavedItems(newSavedItems);
        updateLocalStorage(newSavedItems);
    };

    const handleLoad = (sourceText: string) => {
        setText(sourceText);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const toggleSavedItem = (id: number) => {
        setActiveSavedItemId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">مساعد المذاكرة الذكي 🧠</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">ألصق فقرة من الدرس، وسأحولها لك إلى ملخص، شرح، أو تحليل معمق لمساعدتك على الفهم السريع.</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="أدخل النص هنا..."
                    rows={8}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700 mb-4"
                />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <ActionButton icon={ListCollapse} label="تلخيص" onClick={() => handleAction('summarize')} disabled={isLoading} />
                    <ActionButton icon={BookOpenCheck} label="شرح" onClick={() => handleAction('explain')} disabled={isLoading} />
                    <ActionButton icon={Zap} label="تحليل معمق" onClick={() => handleAction('deep_dive')} disabled={isLoading} isFeatured={true} />
                    <ActionButton icon={GitFork} label="خريطة ذهنية" onClick={() => handleAction('mindmap')} disabled={isLoading} />
                    <ActionButton icon={HelpCircle} label="سؤال وجواب" onClick={() => handleAction('qa')} disabled={isLoading} />
                </div>
            </div>

            {isLoading && (
                 <div className="mt-8 flex justify-center items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                </div>
            )}

            {!isLoading && (result || mindMapMermaid) && (
                <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">{resultTitle}:</h2>
                        <div className="flex items-center gap-2">
                             <button onClick={handleSave} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400" aria-label="حفظ النتيجة">
                                <Save size={24} />
                            </button>
                            {result && (
                                <>
                                    <button onClick={handleSpeak} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400" disabled={!result} aria-label="استمع للنتيجة">
                                        {isSpeaking ? <StopCircle size={24} /> : <Volume2 size={24} />}
                                    </button>
                                    <button onClick={handleCopyText} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400" aria-label="نسخ النص">
                                        {isTextCopied ? <Check size={24} className="text-green-500" /> : <Clipboard size={24} />}
                                    </button>
                                </>
                            )}
                            {mindMapMermaid && (
                                <>
                                    <button onClick={() => setIsMindMapExpanded(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400" aria-label="توسيع الخريطة">
                                        <Expand size={24} />
                                    </button>
                                    <button onClick={handleCopyMindMapCode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400" aria-label="نسخ كود الخريطة">
                                       {isMindMapCodeCopied ? <Check size={24} className="text-green-500" /> : <Clipboard size={24} />}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {result && (
                        <div className="prose prose-lg dark:prose-invert max-w-none" style={{ whiteSpace: 'pre-wrap' }}>{result}</div>
                    )}
                    {mindMapMermaid && (
                        <div className="overflow-auto">
                           <MermaidChart chart={mindMapMermaid} />
                        </div>
                    )}
                </div>
            )}
            
            {isMindMapExpanded && mindMapMermaid && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setIsMindMapExpanded(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg">الخريطة الذهنية</h3>
                            <button onClick={() => setIsMindMapExpanded(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white" aria-label="إغلاق">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <MermaidChart chart={mindMapMermaid} />
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-gray-800 dark:text-gray-100">
                    <History size={28} />
                    المحفوظات
                </h2>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-3">
                    {savedItems.length > 0 ? (
                        savedItems.map(item => (
                            <div key={item.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleSavedItem(item.id)}
                                    className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <div className="text-right">
                                        <p className="font-bold">{item.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.createdAt}</p>
                                    </div>
                                    <ChevronDown className={`transform transition-transform ${activeSavedItemId === item.id ? 'rotate-180' : ''}`} />
                                </button>
                                {activeSavedItemId === item.id && (
                                    <div className="p-4">
                                        {item.result && (
                                            <div className="prose prose-lg dark:prose-invert max-w-none mb-4" style={{ whiteSpace: 'pre-wrap' }}>{item.result}</div>
                                        )}
                                        {item.mindMapMermaid && (
                                            <div className="overflow-auto mb-4">
                                                <MermaidChart chart={item.mindMapMermaid} />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 border-t dark:border-gray-700 pt-3">
                                            <button onClick={() => handleLoad(item.sourceText)} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400">
                                                <ClipboardPaste size={16} />
                                                استعادة النص الأصلي
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 ms-auto">
                                                <Trash2 size={16} />
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                            لا يوجد عناصر محفوظة بعد. قم بإنشاء ملخص أو خريطة واحفظها هنا!
                        </p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default StudyHelper;
