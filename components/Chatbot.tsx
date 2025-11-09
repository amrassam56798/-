import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic, Paperclip, Loader2 } from 'lucide-react';
import { generateText, generateTextWithImage } from '../services/gemini';

interface Message {
    text: string;
    sender: 'user' | 'bot';
    image?: string;
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const chatBodyRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // @ts-ignore
    const recognition = useRef<any>(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    useEffect(() => {
        // @ts-ignore
        if ('webkitSpeechRecognition' in window) {
            // @ts-ignore
            recognition.current = new webkitSpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.lang = 'ar-EG';
            recognition.current.interimResults = false;
            recognition.current.maxAlternatives = 1;

            recognition.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };
            recognition.current.onerror = (event: any) => {
                console.error("Speech recognition error", event);
                setIsListening(false);
            };
            recognition.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleVoiceRecognition = () => {
        if (isListening) {
            recognition.current.stop();
        } else {
            recognition.current.start();
            setIsListening(true);
        }
    };

    const handleSend = async (prompt: string = input) => {
        if (!prompt.trim() && !uploadedImage) return;

        const userMessage: Message = { text: prompt, sender: 'user' };
        if (imagePreview) {
            userMessage.image = imagePreview;
        }

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setUploadedImage(null);
        setImagePreview(null);
        setIsLoading(true);

        try {
            let botResponse: string;
            if (uploadedImage) {
                botResponse = await generateTextWithImage(prompt || "اشرح هذه الصورة.", uploadedImage);
            } else {
                const response = await generateText(prompt, undefined, 'gemini-flash-lite-latest');
                botResponse = response.text;
            }
            setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "حدث خطأ ما. حاول مرة أخرى.", sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const suggestionPrompts = [
      "نصائح لتنظيم الوقت.",
      "إزاي أذاكر من غير ما أراكم؟",
      "طرق تحسين النفسية قبل الامتحان.",
      "أفضل طريقة للمراجعة قبل الامتحانات.",
    ];

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-transform transform hover:scale-110 z-50"
            >
                <MessageSquare size={28} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 w-[90vw] h-[80vh] md:w-96 md:h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border dark:border-gray-700">
            <header className="flex items-center justify-between p-4 bg-primary-600 text-white">
                <h3 className="font-bold text-lg">المساعد الذكي</h3>
                <button onClick={() => setIsOpen(false)}><X /></button>
            </header>
            <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                 {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <p className="mb-4">أهلاً بك! كيف يمكنني مساعدتك اليوم؟</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {suggestionPrompts.map(prompt => (
                                <button key={prompt} onClick={() => handleSend(prompt)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-primary-500 flex-shrink-0"></div>}
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                            {msg.image && <img src={msg.image} alt="user upload" className="rounded-lg mb-2 max-h-40" />}
                            <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex-shrink-0"></div>
                        <div className="max-w-[80%] p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                           <Loader2 className="animate-spin text-primary-500" />
                        </div>
                    </div>
                )}
            </div>
            {imagePreview && (
                <div className="p-2 border-t dark:border-gray-700 flex items-center justify-between">
                    <img src={imagePreview} alt="preview" className="w-16 h-16 rounded-lg object-cover" />
                    <button onClick={() => { setUploadedImage(null); setImagePreview(null); }} className="text-red-500"><X /></button>
                </div>
            )}
            <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1 bg-transparent p-2 focus:outline-none text-gray-800 dark:text-gray-200"
                    />
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-primary-500"><Paperclip /></button>
                    <button onClick={toggleVoiceRecognition} className={`p-2 hover:text-primary-500 ${isListening ? 'text-red-500' : 'text-gray-500'}`}><Mic /></button>
                    <button onClick={() => handleSend()} className="bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600 disabled:bg-primary-300" disabled={isLoading || (!input.trim() && !uploadedImage)}>
                        <Send />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;