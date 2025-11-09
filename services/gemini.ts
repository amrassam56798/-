import { GoogleGenAI, GenerateContentResponse, Type, Modality, GenerateContentConfig } from "@google/genai";

// FIX: Removed hardcoded API key fallback. The API key must be provided via environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelFlash = 'gemini-2.5-flash';
const modelPro = 'gemini-2.5-pro';

const defaultSystemInstruction = "أنت مساعد ذكاء اصطناعي متخصص في مساعدة طلاب الثانوية العامة في مصر. أجب بأسلوب ودود ومشجع، واستخدم الإيموجيز المناسبة مثل 🔥, 💪, 🙂, ✨, ❤️. اجعل إجاباتك واضحة ومباشرة ومفيدة للطالب.";

// Function to convert file to base64
export const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const generateText = async (
    prompt: string, 
    systemInstruction?: string,
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-flash-lite-latest' = modelFlash,
    config?: GenerateContentConfig
): Promise<GenerateContentResponse> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction || defaultSystemInstruction,
                ...config,
            },
        });
        return response;
    } catch (error) {
        console.error("Error generating text:", error);
        // A bit of a hack to make it compatible with GenerateContentResponse
        // FIX: Added missing optional properties to satisfy the full GenerateContentResponse type
        // and resolve type mismatch between try/catch blocks.
        return { 
            text: "عذراً، حدث خطأ أثناء التواصل مع الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
            candidates: [],
            usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
            functionCalls: undefined,
        };
    }
};

export const generateTextWithImage = async (prompt: string, image: File, systemInstruction?: string): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(image);
        const textPart = { text: prompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelFlash,
            contents: { parts: [textPart, imagePart] },
            config: {
                systemInstruction: systemInstruction || defaultSystemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text with image:", error);
        return "عذراً، حدث خطأ أثناء تحليل الصورة. يرجى التأكد من أن الصورة واضحة والمحاولة مرة أخرى.";
    }
};

export const generateQuiz = async (topic: string): Promise<any> => {
    try {
        const response = await ai.models.generateContent({
            model: modelFlash,
            contents: `أنشئ اختبارًا من 10 أسئلة اختيار من متعدد حول موضوع "${topic}" لطلاب الثانوية العامة في مصر. يجب أن يحتوي كل سؤال على 4 اختيارات، مع تحديد الإجابة الصحيحة.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        quiz: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING }
                                    },
                                    answer: { type: Type.STRING }
                                },
                                required: ["question", "options", "answer"]
                            }
                        }
                    },
                    required: ["quiz"]
                }
            }
        });

        const jsonString = response.text;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error generating quiz:", error);
        return null;
    }
};

export const generateMindMapMermaid = async (text: string): Promise<string> => {
    const prompt = `حوّل النص التالي إلى خريطة ذهنية بتنسيق Mermaid.
    - استخدم 'graph TD' لإنشاء رسم بياني من الأعلى إلى الأسفل.
    - يجب أن تكون العقدة الرئيسية هي الفكرة الأساسية للنص.
    - تفرع من العقدة الرئيسية الأفكار الفرعية.
    - استخدم الأسهم '-->' لربط الأفكار.
    - استخدم الأشكال المختلفة للعقد (مثل الأقواس المستديرة ()، المستطيلة []، المعين {}) لتمييز مستويات الأفكار.
    - اجعلها واضحة ومنظمة وسهلة الفهم لطالب في الثانوية العامة.
    - لا تضف أي نص توضيحي قبل أو بعد كود Mermaid. أرجع كود Mermaid فقط داخل \`\`\`mermaid ... \`\`\`.
    
    النص:
    ${text}`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelFlash,
            contents: prompt,
            config: {
                systemInstruction: "أنت خبير في إنشاء الخرائط الذهنية بتنسيق Mermaid. هدفك هو تحويل النصوص المعقدة إلى رسوم بيانية واضحة ومنظمة.",
                responseMimeType: "text/plain",
            },
        });
        
        let mermaidCode = response.text.trim();
        
        const regex = /```(?:mermaid)?([\s\S]*?)```/;
        const match = mermaidCode.match(regex);

        if (match && match[1]) {
            mermaidCode = match[1].trim();
        } else {
            mermaidCode = mermaidCode.replace(/```(?:mermaid)?/g, '').replace(/```/g, '').trim();
        }

        if (!mermaidCode.toLowerCase().startsWith('graph')) {
             console.warn("Generated text doesn't look like a valid Mermaid graph:", mermaidCode);
             return "graph TD; A[خطأ] --> B[تعذر إنشاء الخريطة الذهنية، قد يكون النص المدخل غير مناسب];";
        }
        
        return mermaidCode;
    } catch (error) {
        console.error("Error generating mind map:", error);
        return "graph TD; A[خطأ] --> B[لم نتمكن من إنشاء الخريطة الذهنية];";
    }
};

export const analyzeYouTubeVideo = async (url: string, userPrompt: string): Promise<GenerateContentResponse> => {
    const prompt = `بصفتك خبيرًا في تحليل المحتوى التعليمي، قم بتحليل الفيديو الموجود على رابط يوتيوب التالي. استخدم بحث جوجل للوصول إلى معلومات حول الفيديو مثل العنوان والوصف والنص التلقائي (transcript) إن وجد.
    
    رابط الفيديو: ${url}
    
    المطلوب منك: ${userPrompt}
    
    قم بتقديم إجابة منظمة ومفصلة ومفيدة لطالب في الثانوية العامة.`;

    const response = await generateText(
        prompt, 
        "أنت مساعد تعليمي متخصص في تلخيص وشرح محتوى يوتيوب.",
        modelPro,
        {
            tools: [{googleSearch: {}}],
        }
    );
    return response;
};


// New features
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' ): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio,
            },
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        return '';
    }
};

export const editImage = async (prompt: string, imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        return '';
    } catch (error) {
        console.error("Error editing image:", error);
        return '';
    }
};

export const generateTTSAudio = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say with a clear and helpful tone: ${text}` }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
              },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating TTS audio:", error);
        return null;
    }
};

// Audio decoding utilities
export function decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
  
export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000, // TTS model sample rate
    numChannels: number = 1,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
}