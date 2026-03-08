import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { processQuery, ConversationContext } from '@/lib/chatEngine';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'How many employees do we have?',
  'Average CTC of joiners this FY',
  'List employees in East zone with rating excellent',
  'Attrition rate this FY',
  'Breakdown by department',
  'Top 10 employees by salary',
  'How many female joiners this FY?',
];

export default function Chatbot() {
  const { employees, fyStart, fyEnd, loadDemo, isLoading } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // ── Speech Recognition Setup ──
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto-send after voice input
        setTimeout(() => {
          sendMessageDirect(transcript);
        }, 300);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled) return;
    // Strip markdown for cleaner speech
    const clean = text.replace(/[#*|_\-`>]/g, '').replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(clean.slice(0, 500));
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const sendMessageDirect = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date() };

    let response: string;
    let newContext: ConversationContext | null = conversationContext;

    if (employees.length === 0) {
      response = '⚠️ **No data loaded.** Please upload an employee master file on the home page, or click "Load demo data" below to try the chatbot with sample data.';
    } else {
      const result = processQuery(text, employees, fyStart, fyEnd, conversationContext);
      response = result.text;
      newContext = result.context;
    }

    const assistantMsg: Message = { role: 'assistant', content: response, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setConversationContext(newContext);
    setInput('');
    speak(response);
  }, [employees, fyStart, fyEnd, conversationContext, speak]);

  const sendMessage = useCallback((text: string) => {
    sendMessageDirect(text);
  }, [sendMessageDirect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationContext(null);
    window.speechSynthesis.cancel();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 flex flex-col container max-w-4xl py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">HR Data Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about your employee data in natural language
              {employees.length > 0 && (
                <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                  {employees.length.toLocaleString()} employees loaded
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-lg transition-colors ${ttsEnabled ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              title={ttsEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {employees.length === 0 && !isLoading && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 mb-4">
            <p className="text-sm text-destructive font-medium">No data loaded.</p>
            <button onClick={loadDemo} className="text-sm text-destructive underline mt-1 font-medium">
              Load demo data to try the chatbot →
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 mb-6 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Ask me anything about your HR data</h3>
              <p className="text-sm text-muted-foreground mb-6">I understand natural language and remember context. Try a prompt:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-card-foreground hover:bg-secondary transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-card-foreground'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-card-foreground [&_table]:w-full [&_table]:text-xs [&_th]:p-1.5 [&_td]:p-1.5 [&_th]:text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border/50 [&_h3]:text-base [&_h3]:mt-0 [&_h3]:mb-2 [&_p]:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl bg-card border border-border p-2 shadow-sm">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:bg-secondary'}`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎤 Listening...' : 'Ask about your HR data...'}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground px-2"
            disabled={isListening}
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={!input.trim() || isListening}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        {isListening && (
          <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
            🎤 Speak now... I'm listening
          </p>
        )}
      </div>
    </div>
  );
}
