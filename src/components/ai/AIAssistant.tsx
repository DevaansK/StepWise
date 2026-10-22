import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  ArrowRight,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, Service } from '../../types';

export const AIAssistant: React.FC = () => {
  const { services, departments, setActiveTab } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I am your **StepWise AI Administrative Advisor**.

I can guide you through college service procedures, required documents, responsible department offices, and request tracking rules.

How can I help you today? Choose one of the suggested prompts below or ask any question!`,
      timestamp: new Date().toISOString(),
      isDemoMode: true,
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServiceContext, setSelectedServiceContext] = useState<Service | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const suggestedQuestions = [
    'How do I apply for a bonafide certificate?',
    'What documents are required for an academic transcript?',
    'How can I check my request status?',
    'Which department handles an institutional no-dues certificate?',
    'What should I do if my documents are incomplete?',
    'How do I replace a lost student ID card?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Call server backend endpoint /api/assistant
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      let data: any = null;
      if (response.ok) {
        data = await response.json();
      } else {
        const errorData = await response.json().catch(() => ({}));
        data = {
          reply: errorData.error || 'The campus advisor encountered a transient error. Here is the verified procedure from the college administrative manual:',
          source: 'college-knowledge-base',
          isDemoMode: true,
        };
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'I could not process your query.',
        timestamp: new Date().toISOString(),
        relatedServiceId: data.relatedServiceId,
        isDemoMode: data.isDemoMode,
        source: data.source,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If a service was matched, set context
      if (data.relatedServiceId) {
        const found = services.find((s) => s.id === data.relatedServiceId);
        if (found) setSelectedServiceContext(found);
      }
    } catch (err) {
      console.warn('StepWise assistant connection failed, providing grounded advice:', err);
      // Even if network fails, provide helpful guidance on campus services
      const fallbackReply = `### Campus Administrative Guidance System

I was unable to establish a live connection to the advisor backend. Here are the most frequently requested college services you can access immediately:

* **Bonafide Certificate:** Required for loans, visas, and concessions. Attach student ID & latest fee receipt. (~2-3 days, Academic Affairs)
* **Academic Transcript:** Required for higher studies and employment. Attach all completed semester mark sheets. (~5-7 days, Examination Office)
* **Fee Statement:** For taxation and bank records. Attach transaction reference. (~1-2 days, Finance)
* **Student ID Card:** Replacement for lost cards. Attach photo and loss undertaking. (~2-4 days, Security Office)

Click on **Browse Services** in the left menu to start any request immediately.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          sender: 'assistant',
          text: fallbackReply,
          timestamp: new Date().toISOString(),
          isDemoMode: true,
          source: 'college-knowledge-base',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear assistant conversation?')) {
      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: 'Conversation cleared. How can I assist you with college procedures today?',
          timestamp: new Date().toISOString(),
          isDemoMode: true,
        },
      ]);
      setSelectedServiceContext(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                StepWise AI Administrative Advisor
              </h1>
              <span className="text-[10px] font-mono font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Grounded Knowledge Base
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask about procedure checklists, department rules, required forms, or request routing.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Window (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col h-[650px] overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const relatedService = msg.relatedServiceId
                ? services.find((s) => s.id === msg.relatedServiceId)
                : null;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-indigo-900 text-white'
                        : 'bg-teal-700 text-white shadow-2xs'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-2xs ${
                      isUser
                        ? 'bg-indigo-900 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {/* Render formatted message content */}
                    <div className="whitespace-pre-line prose-xs">
                      {msg.text}
                    </div>

                    {/* Quick Action Widget if linked to a service */}
                    {relatedService && (
                      <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-900">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Identified College Service
                          </span>
                          <p className="font-bold text-xs text-indigo-950">
                            {relatedService.name} ({relatedService.code})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            ~{relatedService.estimatedProcessingDays} business days · {relatedService.requiredDocuments.length} required documents
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setActiveTab('services', relatedService.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => setActiveTab('new-request', relatedService.id)}
                            className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded transition-colors inline-flex items-center gap-1"
                          >
                            <span>Start Request</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div
                      className={`flex items-center justify-between text-[10px] pt-1 font-mono ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!isUser && (
                        msg.source && msg.source.includes('gemini') ? (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            AI Powered · Gemini 3.8 Flash
                          </span>
                        ) : (
                          <span className="text-indigo-800 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            Verified Campus Guide · Knowledge Base
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 text-xs text-slate-500 shadow-2xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce delay-200" />
                  <span className="ml-1 text-[11px]">Searching college procedures...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Shelf */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
              Suggestions:
            </span>
            {suggestedQuestions.slice(0, 3).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 text-[11px] text-slate-700 hover:text-indigo-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about required documents, procedures, office timings, or services..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="px-4 py-2.5 bg-indigo-900 hover:bg-indigo-950 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Context & FAQs Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Context Panel: Selected Service */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Active Service Context</span>
            </h3>

            {selectedServiceContext ? (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                  <span className="text-[10px] font-mono font-semibold text-indigo-800">
                    {selectedServiceContext.code}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedServiceContext.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {selectedServiceContext.description}
                  </p>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-700">Office: </span>
                    {departments.find((d) => d.id === selectedServiceContext.departmentId)?.name}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Required: </span>
                    {selectedServiceContext.requiredDocuments.length} mandatory documents
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('new-request', selectedServiceContext.id)}
                  className="w-full mt-2 py-1.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>Start This Request</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Mention or ask about any service (e.g., &ldquo;Bonafide Certificate&rdquo; or &ldquo;Transcript&rdquo;) to pin its workflow and checklist here.
              </p>
            )}
          </div>

          {/* Quick Questions Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Popular Questions
            </h3>

            <div className="space-y-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-2 rounded-lg text-xs text-slate-700 hover:text-indigo-950 hover:bg-slate-50 transition-colors line-clamp-2 leading-relaxed"
                >
                  &bull; {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
