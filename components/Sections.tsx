import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { UploadCloudIcon, MessageCircleQuestionIcon, BookCheckIcon, HistoryIcon, ArrowRightIcon, UserIcon, BotIcon, SendIcon, LoaderIcon } from './Icons';

// Reusable Section Title Component
const SectionTitle: React.FC<{ subtitle: string; children: React.ReactNode }> = ({ subtitle, children }) => (
    <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{children}</h2>
        <p className="mt-4 text-lg text-indigo-300">{subtitle}</p>
    </div>
);

// Hero Section
export const HeroSection: React.FC = () => (
    <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4">
            <span className="gradient-text">StudyMate</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-8">
            An AI-Powered PDF Q&A System for Students
        </p>
        <p className="max-w-3xl mx-auto text-base md:text-lg text-slate-400">
            Stop endlessly scrolling through lecture notes and textbooks. Upload your documents, ask questions, and get instant, accurate answers with cited sources.
        </p>
    </div>
);

// Problem & Solution Section
export const ProblemSolutionSection: React.FC = () => (
    <div>
        <SectionTitle subtitle="The Challenge & Our Approach">Bridging the Gap in Student Learning</SectionTitle>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold text-red-400 mb-3">The Problem</h3>
                <p className="text-slate-400">Students face information overload, spending hours searching for specific facts in dense PDFs and textbooks. This traditional method is inefficient, frustrating, and hinders deep understanding.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold text-green-400 mb-3">The Solution</h3>
                <p className="text-slate-400">StudyMate transforms static PDFs into interactive learning partners. By leveraging Google's Gemini API, it provides direct, context-aware answers, helping students learn faster and more effectively.</p>
            </div>
        </div>
    </div>
);

// Interactive Features Section
const sampleDocument = `The Water Cycle: A Journey Through Earth's Systems

The water cycle, also known as the hydrologic cycle, describes the continuous movement of water on, above, and below the surface of the Earth. This cycle is vital for all life on our planet. The amount of water on Earth remains fairly constant over time, but its distribution among the major reservoirs of ice, fresh water, saline water, and atmospheric water is variable.

The cycle involves several key processes:

1.  Evaporation: This is the process where water changes from a liquid to a gas or vapor. The sun is the primary driver of evaporation, heating water in oceans, lakes, and rivers, causing it to rise into the atmosphere as water vapor.

2.  Condensation: As the warm, moist air rises, it cools. The water vapor in the air cools down and turns back into liquid water, forming clouds. This process is called condensation.

3.  Precipitation: When so much water has condensed that the air cannot hold it anymore, the clouds get heavy and water falls back to the Earth in the form of rain, hail, sleet, or snow.

4.  Collection: When water falls back to Earth as precipitation, it may fall back in the oceans, lakes, or rivers, or it may end up on land. When it ends up on land, it will either soak into the Earth and become part of the "ground water" that plants and animals use to drink or it may run over the soil and collect in the oceans, lakes, or rivers where the cycle starts all over again.

This continuous process ensures that water is recycled and distributed across the globe, supporting ecosystems and human life.`;

type ChatMessage = {
    role: 'user' | 'model';
    text: string;
};

export const FeaturesSection: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);
    
    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        setUploadedFile(null);
        setPreview(null);
        setChatHistory([]);
        setError('');

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                setUploadedFile(file);
                setIsProcessingFile(false);
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            setPreview(sampleDocument); // Mock content
            setUploadedFile(file);
            setIsProcessingFile(false);
        } else {
            setError('Unsupported file type. Please upload an image or a PDF.');
            setIsProcessingFile(false);
        }
    };
    
    const handleRemoveFile = () => {
        setUploadedFile(null);
        setPreview(null);
        setChatHistory([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async () => {
        if (!question.trim() || isLoading) return;

        setIsLoading(true);
        setError('');
        const newHistory = [...chatHistory, { role: 'user' as const, text: question }];
        setChatHistory(newHistory);
        const userQuestion = question;
        setQuestion('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let response;
            
            if (uploadedFile?.type.startsWith('image/')) {
                const base64Data = await fileToBase64(uploadedFile);
                const imagePart = {
                    inlineData: {
                        mimeType: uploadedFile.type,
                        data: base64Data,
                    },
                };
                const textPart = { text: `Based on this image, answer the question: "${userQuestion}"` };
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [imagePart, textPart] },
                });
            } else if (uploadedFile) { // PDF (mocked)
                const prompt = `Based on the following document, please answer the user's question. If the answer cannot be found in the document, state that the information is not available in the provided text.

DOCUMENT CONTENT:
---
${sampleDocument}
---

USER QUESTION:
${userQuestion}`;
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
            } else { // No file uploaded, general chat
                 response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: userQuestion,
                });
            }

            setChatHistory([...newHistory, { role: 'model' as const, text: response.text }]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to get a response. ${errorMessage}`);
            setChatHistory([...newHistory, { role: 'model' as const, text: `Sorry, I couldn't process that. ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <SectionTitle subtitle="Try StudyMate Live">Interactive Core Features</SectionTitle>
            <div className="grid lg:grid-cols-2 gap-8 bg-slate-800/50 p-4 sm:p-6 rounded-lg border border-slate-700">
                {/* Document Viewer */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2 shrink-0">Upload Your Document (Optional)</h3>
                    <div className="bg-slate-900/70 p-4 rounded-md border border-slate-600 flex-grow h-96 lg:h-[500px]">
                        { isProcessingFile ? (
                           <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <LoaderIcon className="w-12 h-12 animate-spin mb-4" />
                                <p>Processing file...</p>
                           </div>
                        ) : !uploadedFile ? (
                            <div 
                                className="w-full h-full border-2 border-dashed border-slate-500 rounded-md flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-800/50 hover:border-indigo-500 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={(e) => { e.preventDefault(); handleFileChange({ target: { files: e.dataTransfer.files } } as any); }}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <UploadCloudIcon className="w-12 h-12 mb-4" />
                                <p className="font-semibold">Click to upload or drag and drop</p>
                                <p className="text-sm">PDF or Image (PNG, JPG)</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="application/pdf,image/png,image/jpeg"
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col">
                                <div className="mb-2 p-2 bg-slate-800 rounded-md text-sm flex justify-between items-center shrink-0">
                                    <span className="truncate" title={uploadedFile.name}>{uploadedFile.name}</span>
                                    <button onClick={handleRemoveFile} className="ml-4 text-red-400 hover:text-red-300 shrink-0">Remove</button>
                                </div>
                                <div className="flex-grow overflow-y-auto min-h-0">
                                {uploadedFile.type.startsWith('image/') && preview ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <img src={preview} alt="Uploaded content" className="max-w-full max-h-full object-contain" />
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-yellow-400 bg-yellow-900/50 p-2 rounded-md mb-2">
                                            <strong>Demo Note:</strong> PDF content extraction is simulated. This is the content that would be processed.
                                        </p>
                                        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{preview}</pre>
                                    </div>
                                )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2 shrink-0">Ask a Question</h3>
                    <div className="bg-slate-900/70 rounded-md border border-slate-600 flex flex-col h-96 lg:h-[500px]">
                        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                            {chatHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                                  <MessageCircleQuestionIcon className="w-10 h-10 mb-2" />
                                  <p>{uploadedFile ? 'Ask a question about your document.' : 'Ask me anything, or upload a document.'}</p>
                                </div>
                            )}
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'model' && <BotIcon className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />}
                                    <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                    {msg.role === 'user' && <UserIcon className="w-6 h-6 text-slate-400 shrink-0 mt-1" />}
                                </div>
                            ))}
                             <div ref={chatEndRef} />
                        </div>
                        {error && <p className="p-4 text-sm text-red-400 border-t border-slate-700">{error}</p>}
                        <div className="p-4 border-t border-slate-700 shrink-0">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={uploadedFile ? "Ask about the document..." : "Ask me anything..."}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !question.trim()}
                                    className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
                                    aria-label="Send message"
                                >
                                    {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// How It Works / Architecture Section
export const HowItWorksSection: React.FC = () => (
  <div>
    <SectionTitle subtitle="The Engine Behind StudyMate">System Architecture</SectionTitle>
    <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="text-center md:text-left">
          <div className="font-bold text-lg text-white">1. PDF Ingestion & Embedding</div>
          <p className="text-sm text-slate-400">User uploads a PDF. The backend extracts text, splits it into chunks, and creates vector embeddings for semantic search.</p>
        </div>
        <ArrowRightIcon className="w-8 h-8 text-indigo-400 shrink-0 transform md:rotate-0 rotate-90" />
        <div className="text-center">
            <div className="px-4 py-2 bg-slate-700 rounded-lg border border-slate-600">Vector Database</div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="text-center md:text-left">
          <div className="font-bold text-lg text-white">2. Query & Context Retrieval</div>
          <p className="text-sm text-slate-400">User asks a question. The query is embedded and used to find the most relevant text chunks from the Vector DB.</p>
        </div>
         <ArrowRightIcon className="w-8 h-8 text-indigo-400 shrink-0 transform md:rotate-0 rotate-90" />
        <div className="text-center">
             <div className="px-4 py-2 bg-slate-700 rounded-lg border border-slate-600">Similarity Search</div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="text-center md:text-left">
          <div className="font-bold text-lg text-white">3. Answer Generation</div>
          <p className="text-sm text-slate-400">The user's query and retrieved context are sent to the Gemini API, which generates a comprehensive and cited answer.</p>
        </div>
         <ArrowRightIcon className="w-8 h-8 text-indigo-400 shrink-0 transform md:rotate-0 rotate-90" />
        <div className="text-center">
            <div className="px-4 py-2 bg-slate-700 rounded-lg border border-slate-600">Gemini Pro API</div>
        </div>
      </div>
    </div>
  </div>
);


// Tech Stack Section
const TechCard: React.FC<{ logo: string; name: string; category: string }> = ({ logo, name, category }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
        <div className="text-4xl mb-2 flex justify-center">{logo}</div>
        <div className="font-bold text-white">{name}</div>
        <div className="text-xs text-indigo-400">{category}</div>
    </div>
);

export const TechStackSection: React.FC = () => (
    <div>
        <SectionTitle subtitle="Powered by Modern Technologies">Technology Stack</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <TechCard logo="💻" name="React & TS" category="Frontend" />
            <TechCard logo="🎨" name="Tailwind CSS" category="Styling" />
            <TechCard logo="🧠" name="Gemini API" category="AI/ML" />
            <TechCard logo="⚙️" name="Node.js" category="Backend" />
            <TechCard logo="🗄️" name="Firestore" category="Database" />
            <TechCard logo="🔎" name="Vector DB" category="Search" />
            <TechCard logo="☁️" name="Google Cloud" category="Hosting" />
            <TechCard logo="🚀" name="Vite" category="Build Tool" />
        </div>
    </div>
);

// UI/UX Section
export const UiUxSection: React.FC = () => (
    <div>
        <SectionTitle subtitle="Designed for Students">Intuitive & Clean Interface</SectionTitle>
        <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Focus on Usability</h3>
                <p className="text-slate-400">The user interface is designed to be minimal and distraction-free, allowing students to focus on what matters: learning. A familiar chat-based layout makes interaction natural and efficient.</p>
                <ul className="list-disc list-inside text-slate-400 space-y-2">
                    <li>Responsive design for all devices.</li>
                    <li>Accessible color contrasts and navigation.</li>
                    <li>Clear visual hierarchy.</li>
                </ul>
            </div>
            <div className="w-full h-80 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <img src="https://picsum.photos/seed/studymate-ui/800/600" alt="StudyMate UI Mockup" className="w-full h-full object-cover" />
            </div>
        </div>
    </div>
);


// Roadmap Section
export const RoadmapSection: React.FC = () => (
    <div>
        <SectionTitle subtitle="What's Next for StudyMate">Future Roadmap</SectionTitle>
        <div className="max-w-2xl mx-auto">
            <div className="space-y-6 border-l-2 border-slate-700 ml-3">
                <RoadmapItem title="Multi-Document Q&A" description="Ask questions across multiple uploaded documents simultaneously." status="Next Up" />
                <RoadmapItem title="Automated Flashcards" description="Generate flashcards from your documents to aid with active recall and revision." status="In Progress" />
                <RoadmapItem title="Advanced Summarization" description="Get concise summaries of entire documents or specific sections." status="Planned" />
                <RoadmapItem title="Collaborative Study Rooms" description="Invite friends to a shared session to study the same documents together." status="Planned" />
            </div>
        </div>
    </div>
);

const RoadmapItem: React.FC<{ title: string; description: string; status: 'Next Up' | 'In Progress' | 'Planned' }> = ({ title, description, status }) => {
    const statusColors = {
        'Next Up': 'bg-green-500/20 text-green-400 border-green-500/30',
        'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'Planned': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return (
        <div className="relative pl-8">
            <div className="absolute -left-[7px] top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900"></div>
            <span className={`absolute right-0 top-0 text-xs px-2 py-1 rounded-full border ${statusColors[status]}`}>{status}</span>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
    );
};