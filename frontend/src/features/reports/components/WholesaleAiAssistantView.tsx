import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Mic,
  Send,
  Trash2,
} from 'lucide-react';
import {
  AI_TOP_PILLS,
  AI_CATEGORIZED_QUESTIONS,
  AiChatMessage,
  getLocalAiResponse,
} from '../data/mockReportsData';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

export const WholesaleAiAssistantView: React.FC<Props> = ({ onBack }) => {
  const [fromDate, setFromDate] = useState('2026-11-22');
  const [toDate, setToDate] = useState('2026-11-22');
  const [searchTerm, setSearchTerm] = useState('');
  const [inputQuery, setInputQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'kn' | 'en'>('kn');
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAsk = (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: AiChatMessage = {
      role: 'user',
      content: q,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Generate local intelligence response
    setTimeout(() => {
      const answer = getLocalAiResponse(q);
      const assistantMsg: AiChatMessage = {
        role: 'assistant',
        content: answer,
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    }, 250);
  };

  const handleVoiceToggle = () => {
    // Check for native SpeechRecognition API
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage === 'kn' ? 'kn-IN' : 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        setIsListening(true);
        toast.info(
          `Listening in ${selectedLanguage === 'kn' ? 'Kannada' : 'English'}... Speak now`
        );

        recognition.onresult = (event: any) => {
          setIsListening(false);
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputQuery(transcript);
            handleAsk(transcript);
            toast.success(`Heard: "${transcript}"`);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          toast.error('Voice input error. Please type your query.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch {
        // fallback
      }
    }

    // Fallback simulation
    setIsListening(true);
    toast.info('Voice listening activated... Speak your question');
    setTimeout(() => {
      setIsListening(false);
      const sampleQuestion =
        selectedLanguage === 'kn'
          ? 'ಈ ತಿಂಗಳ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?'
          : "Today's total sales & collections summary";
      setInputQuery(sampleQuestion);
      handleAsk(sampleQuestion);
      toast.success(`Voice transcribed: "${sampleQuestion}"`);
    }, 2000);
  };

  const handleClearChat = () => {
    setChatMessages([]);
    toast.info('Conversation cleared');
  };

  // Helper to format assistant messages with bold and bullet lines
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process markdown bold **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const renderedLine = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={i} className="font-bold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-blue-600 font-bold">•</span>
                <span>{renderedLine.slice(1)}</span>
              </div>
            );
          }

          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="pl-1">
                {renderedLine}
              </div>
            );
          }

          return <div key={idx}>{renderedLine}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top action bar: Back button + Date filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600 font-medium">From</span>
          <div className="relative flex items-center">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <span className="text-slate-600 font-medium">To</span>
          <div className="relative flex items-center">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => toast.info(`Report period: ${fromDate} to ${toDate}`)}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold transition shadow-2xs"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Assistant</h2>
      </div>

      {/* Search Bar */}
      <div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main AI Assistant Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Intro prompt */}
        <p className="text-xs text-slate-600">
          Ask about your business in plain language, or tap an option below for an instant answer.
        </p>

        {/* Top suggested question pills (Matches Screenshot 2 top pills) */}
        <div className="flex flex-wrap gap-2">
          {AI_TOP_PILLS.map((pill) => (
            <button
              key={pill}
              onClick={() => handleAsk(pill)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-blue-700 bg-blue-50/60 hover:bg-blue-100/80 border border-blue-200 hover:border-blue-400 transition text-left shadow-2xs"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Categorized Question Groups (NXAQ) */}
        <div className="space-y-3 pt-2">
          {AI_CATEGORIZED_QUESTIONS.map(([category, questions]) => (
            <div key={category} className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">{category}</span>
              <div className="flex flex-wrap gap-2">
                {questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleAsk(q)}
                    className="px-3 py-1 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-blue-800 border border-slate-200 transition text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Chat History Stream */}
        {chatMessages.length > 0 && (
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 max-h-[380px] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Conversation History
              </span>
              <button
                onClick={handleClearChat}
                className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>

            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#0f2d59] text-white text-xs sm:text-sm font-medium'
                      : 'bg-white text-slate-800 border border-slate-200'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div>{msg.content}</div>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}
                </div>
                {msg.time && (
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-mono">
                    {msg.time}
                  </span>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Bottom Input Row */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Type your question... (ಪ್ರಶ್ನೆ ಕೇಳಿ)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />

          {/* Language selector toggle (Kannada / English) */}
          <button
            type="button"
            onClick={() =>
              setSelectedLanguage((prev) => (prev === 'kn' ? 'en' : 'kn'))
            }
            className="px-2.5 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition shadow-2xs shrink-0"
            title="Toggle between Kannada and English"
          >
            {selectedLanguage === 'kn' ? 'ಕನ್ನಡ' : 'English'}
          </button>

          {/* Voice input button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`px-3 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 transition shadow-2xs shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-[#0f2d59] hover:bg-slate-900 text-white'
            }`}
            title="Voice search — tap and speak"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice</span>
          </button>

          {/* Ask button */}
          <button
            type="button"
            onClick={() => handleAsk()}
            className="px-4 py-2 bg-[#0f2d59] hover:bg-slate-900 text-white rounded-md text-xs font-bold flex items-center gap-1 transition shadow-2xs shrink-0"
          >
            <Send className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
