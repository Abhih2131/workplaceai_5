import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Mic, Globe, Bot, User } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { processQuery } from '@/lib/chatEngine';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'How many employees are there?',
  'Show salary of Rahul Sharma',
  'List employees in East zone with rating excellent',
  'How many female joiners this FY?',
  'Average CTC of joiners from LinkedIn this FY?',
];

export default function Chatbot() {
  const { employees, fyStart, fyEnd, loadDemo } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date() };

    let response: string;
    if (employees.length === 0) {
      response = 'No data loaded. Please upload an employee master file or load demo data first.';
    } else {
      const result = processQuery(text, employees, fyStart, fyEnd);
      response = result.text;
    }

    const assistantMsg: Message = { role: 'assistant', content: response, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
  }, [employees, fyStart, fyEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 flex flex-col container max-w-3xl py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">HR Data Chatbot</h1>
          <p className="text-sm text-muted-foreground">Ask questions about your employee data in natural language</p>
        </div>

        {employees.length === 0 && !isLoading && (
          <div className="rounded-xl bg-attrition-muted border border-attrition/20 p-4 mb-4">
            <p className="text-sm text-attrition font-medium">No data loaded.</p>
            <button onClick={loadDemo} className="text-sm text-attrition underline mt-1">Load demo data</button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="w-16 h-16 rounded-2xl bg-people-muted mb-6 flex items-center justify-center">
                <Bot className="w-8 h-8 text-people" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Ask me anything about your HR data</h3>
              <p className="text-sm text-muted-foreground mb-6">Try one of these prompts:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
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
                <div className="w-8 h-8 rounded-lg bg-people-muted flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-people" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-card-foreground'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-card-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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
          <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors" title="Voice input (coming soon)">
            <Mic className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors" title="Language (coming soon)">
            <Globe className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your HR data..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground px-2"
          />
          <button type="submit" className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={!input.trim()}>
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
