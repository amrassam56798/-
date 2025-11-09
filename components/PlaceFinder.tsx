import React, { useState, useEffect } from 'react';
import { generateText } from '../services/gemini';
import { Loader2, MapPin, Search, Link } from 'lucide-react';
import { GroundingChunk } from '@google/genai';

const PlaceFinder: React.FC = () => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [locationError, setLocationError] = useState('');
    const [result, setResult] = useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setLocationError('');
                },
                () => {
                    setLocationError('لم نتمكن من الوصول لموقعك. سيتم البحث بشكل عام.');
                }
            );
        } else {
            setLocationError('المتصفح لا يدعم خدمة تحديد المواقع.');
        }
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) {
            setResult('الرجاء كتابة ما تبحث عنه.');
            return;
        }
        setIsLoading(true);
        setResult('');
        setSources([]);

        const fullPrompt = location 
            ? `${query} بالقرب من موقعي الحالي.`
            : query;

        const response = await generateText(
            fullPrompt, 
            "أنت مساعد متخصص في إيجاد الأماكن المناسبة للطلاب. قدم إجاباتك بشكل ودود ومنظم.", 
            'gemini-2.5-flash', 
            {
                tools: [{googleMaps: {}}],
                toolConfig: location ? {
                    retrievalConfig: {
                      latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                      }
                    }
                } : undefined
            }
        );

        setResult(response.text);
        if (response.candidates && response.candidates[0].groundingMetadata?.groundingChunks) {
            setSources(response.candidates[0].groundingMetadata.groundingChunks);
        }
        setIsLoading(false);
    };
    
    const suggestionQueries = [
        "مكتبات عامة هادئة",
        "مقاهي مناسبة للمذاكرة",
        "مراكز دروس خصوصية في الفيزياء",
        "أماكن لطباعة المستندات"
    ];

    const searchFromSuggestion = (suggestion: string) => {
        setQuery(suggestion);
        // We need to pass the suggestion to handleSearch because state update is async
        handleSearchWithQuery(suggestion);
    }
    
    const handleSearchWithQuery = async (currentQuery: string) => {
        if (!currentQuery.trim()) {
            setResult('الرجاء كتابة ما تبحث عنه.');
            return;
        }
        setIsLoading(true);
        setResult('');
        setSources([]);

        const fullPrompt = location 
            ? `${currentQuery} بالقرب من موقعي الحالي.`
            : currentQuery;

        const response = await generateText(
            fullPrompt, 
            "أنت مساعد متخصص في إيجاد الأماكن المناسبة للطلاب. قدم إجاباتك بشكل ودود ومنظم.", 
            'gemini-2.5-flash', 
            {
                tools: [{googleMaps: {}}],
                toolConfig: location ? {
                    retrievalConfig: {
                      latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                      }
                    }
                } : undefined
            }
        );

        setResult(response.text);
        if (response.candidates && response.candidates[0].groundingMetadata?.groundingChunks) {
            setSources(response.candidates[0].groundingMetadata.groundingChunks);
        }
        setIsLoading(false);
    }


    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">مستكشف الأماكن 🗺️</h1>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">ابحث عن أفضل أماكن المذاكرة والمكتبات والمراكز التعليمية القريبة منك.</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchWithQuery(query)}
                            placeholder="مثال: مكتبة هادئة للمذاكرة"
                            className="w-full p-3 ps-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-gray-50 dark:bg-gray-700"
                        />
                    </div>
                    <button
                        onClick={() => handleSearchWithQuery(query)}
                        disabled={isLoading}
                        className="bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition duration-300 flex items-center justify-center disabled:bg-primary-400"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Search className="me-2" /> ابحث</>}
                    </button>
                </div>
                {locationError && <p className="text-yellow-600 dark:text-yellow-400 mt-2 text-sm text-center">{locationError}</p>}
                
                 <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">أو جرب أحد الاقتراحات التالية:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {suggestionQueries.map(sq => (
                            <button 
                                key={sq}
                                onClick={() => searchFromSuggestion(sq)}
                                disabled={isLoading}
                                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                                {sq}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {isLoading && (
                 <div className="mt-8 flex justify-center items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                </div>
            )}

            {result && !isLoading && (
                <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">النتائج:</h2>
                    <div className="prose prose-lg dark:prose-invert max-w-none" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{__html: result.replace(/\n/g, '<br />')}}></div>

                    {sources.length > 0 && (
                        <div className="mt-6 border-t dark:border-gray-700 pt-4">
                            <h3 className="font-bold mb-2 flex items-center gap-2"><Link size={18}/> أماكن على الخريطة:</h3>
                             <div className="space-y-2">
                                {sources.map((chunk, index) => (
                                    chunk.maps && (
                                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-500 hover:underline">
                                                {chunk.maps.title}
                                            </a>
                                            {chunk.maps.placeAnswerSources?.reviewSnippets?.map((review, rIndex) => (
                                                 // FIX: The review snippet text is available under the `text` property, not `content`.
                                                 <p key={rIndex} className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">"{review.text}"</p>
                                            ))}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlaceFinder;
