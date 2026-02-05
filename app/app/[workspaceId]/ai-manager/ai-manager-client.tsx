'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, Mic, MicOff, Send, Volume2, VolumeX, Sparkles, 
  TrendingUp, TrendingDown, DollarSign, Target, Clock,
  AlertTriangle, CheckCircle, Lightbulb, Calendar, Loader2
} from 'lucide-react';

interface BusinessProfile {
  targetCpaZar: number;
  breakEvenRoas: number;
  grossMarginPct: number;
  monthlySpendCapZar: number | null;
  strategicMode: string;
}

interface PerformanceSummary {
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  cpa: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIManagerClientProps {
  workspaceId: string;
  workspaceName: string;
  businessProfile: BusinessProfile | null;
  performanceSummary: PerformanceSummary;
  activeCampaigns: number;
}

export function AIManagerClient({
  workspaceId,
  workspaceName,
  businessProfile,
  performanceSummary,
  activeCampaigns,
}: AIManagerClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((result: any) => result[0].transcript)
            .join('');
          setInput(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting = generateGreeting();
    setMessages([{
      id: '1',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }]);
  }, []);

  const generateGreeting = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    
    const roasStatus = performanceSummary.roas >= (businessProfile?.breakEvenRoas || 2) 
      ? '📈 above target' 
      : performanceSummary.roas >= 1 
        ? '⚠️ near break-even' 
        : '🚨 below break-even';

    const cpaStatus = businessProfile?.targetCpaZar && performanceSummary.cpa <= businessProfile.targetCpaZar
      ? '✅ within target'
      : '⚠️ above target';

    return `${timeGreeting}! I'm your AI Marketing Manager for ${workspaceName}.

**Quick Performance Update (Last 7 Days):**
• Spend: R${performanceSummary.spend.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
• Revenue: R${performanceSummary.revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
• ROAS: ${performanceSummary.roas.toFixed(2)}x ${roasStatus}
• CPA: R${performanceSummary.cpa.toFixed(0)} ${cpaStatus}
• Active Campaigns: ${activeCampaigns}

**Mode:** ${businessProfile?.strategicMode || 'GROWTH'} 🎯

How can I help you today? You can ask me about:
- Campaign performance and recommendations
- Budget allocation suggestions
- Creative strategy ideas
- Industry trends and best practices

Feel free to type or click the microphone to talk to me!`;
  };

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Clean markdown from text
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/•/g, '')
      .replace(/📈|⚠️|🚨|✅|🎯/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to use a natural voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Performance questions
    if (lowerMessage.includes('performance') || lowerMessage.includes('how are we doing') || lowerMessage.includes('results')) {
      const trend = performanceSummary.roas >= (businessProfile?.breakEvenRoas || 2) ? 'positive' : 'concerning';
      return `Here's your performance analysis:

**Current Status: ${trend === 'positive' ? '✅ On Track' : '⚠️ Needs Attention'}**

Your ROAS of ${performanceSummary.roas.toFixed(2)}x means for every R1 spent, you're generating R${performanceSummary.roas.toFixed(2)} in revenue.

${trend === 'positive' 
  ? `This is above your break-even ROAS of ${businessProfile?.breakEvenRoas || 2}x - great work! Consider scaling your top performers.`
  : `This is ${businessProfile?.breakEvenRoas ? `below your target of ${businessProfile.breakEvenRoas}x` : 'below optimal levels'}. I recommend reviewing underperforming campaigns.`
}

**Key Metrics:**
• CTR: ${performanceSummary.ctr.toFixed(2)}% ${performanceSummary.ctr >= 1 ? '(healthy)' : '(needs improvement)'}
• CPA: R${performanceSummary.cpa.toFixed(0)} ${businessProfile?.targetCpaZar && performanceSummary.cpa <= businessProfile.targetCpaZar ? '✅' : '⚠️'}
• Purchases: ${performanceSummary.purchases}

Would you like me to identify specific campaigns to optimize?`;
    }

    // Budget questions
    if (lowerMessage.includes('budget') || lowerMessage.includes('spend') || lowerMessage.includes('allocation')) {
      const dailySpend = performanceSummary.spend / 7;
      const projectedMonthly = dailySpend * 30;
      
      return `**Budget Analysis:**

Current daily spend: ~R${dailySpend.toFixed(0)}
Projected monthly: ~R${projectedMonthly.toFixed(0)}
${businessProfile?.monthlySpendCapZar 
  ? `Budget cap: R${businessProfile.monthlySpendCapZar.toLocaleString()} (${((projectedMonthly / businessProfile.monthlySpendCapZar) * 100).toFixed(0)}% utilization)`
  : 'No monthly cap set'
}

**Recommendations:**
${performanceSummary.roas >= 2 
  ? '• Your ROAS supports scaling. Consider increasing budget on top performers by 15-20%.'
  : '• Focus on efficiency before scaling. Optimize underperformers first.'
}
• Maintain 20% of budget for testing new creatives
• Consider day-parting to optimize for peak conversion times

Want me to identify which campaigns deserve more budget?`;
    }

    // Creative questions
    if (lowerMessage.includes('creative') || lowerMessage.includes('ad') || lowerMessage.includes('content') || lowerMessage.includes('video')) {
      return `**Creative Strategy Recommendations:**

Based on your current performance, here's what I suggest:

**1. Hook Variations to Test:**
• Problem-agitation hooks ("Tired of...")
• Social proof hooks ("Join 10,000+ customers...")
• Curiosity hooks ("The secret to...")
• Transformation hooks (before/after)

**2. Format Mix:**
• Video ads (aim for 60% of creative mix)
• Carousel ads for product showcases
• UGC-style content for authenticity

**3. Quick Wins:**
• Test 3-5 new hooks weekly
• Refresh top performers every 2-3 weeks
• A/B test CTAs (Shop Now vs Learn More)

**4. Trending Formats:**
• Short-form video (15-30 seconds)
• Founder story content
• Customer testimonial compilations

Would you like me to generate specific creative briefs?`;
    }

    // Scaling questions
    if (lowerMessage.includes('scale') || lowerMessage.includes('grow') || lowerMessage.includes('increase')) {
      return `**Scaling Strategy:**

${performanceSummary.roas >= 2 
  ? `Your current ROAS of ${performanceSummary.roas.toFixed(2)}x supports aggressive scaling!`
  : `⚠️ Current ROAS of ${performanceSummary.roas.toFixed(2)}x - recommend optimizing before scaling.`
}

**Safe Scaling Rules:**
1. Never increase budget more than 20% per day
2. Wait 3-5 days after changes before evaluating
3. Scale winners, not the whole account

**Scaling Playbook:**
• **Vertical scaling:** Increase budget on winning ad sets
• **Horizontal scaling:** Duplicate winners to new audiences
• **Creative scaling:** Launch new angles on proven audiences

**When to Scale:**
✅ ROAS > ${businessProfile?.breakEvenRoas || 2}x for 3+ consecutive days
✅ 50+ conversions in the learning phase
✅ Frequency < 3

**When to Pause:**
🛑 ROAS < 1x for 3+ days
🛑 CPA > 2x target
🛑 Frequency > 4

Ready to identify scaling opportunities in your account?`;
    }

    // Trends and industry
    if (lowerMessage.includes('trend') || lowerMessage.includes('industry') || lowerMessage.includes('what\'s new') || lowerMessage.includes('update')) {
      return `**Current Digital Marketing Trends:**

**1. AI-Powered Advertising**
• Advantage+ campaigns showing strong results
• AI creative tools for rapid iteration
• Automated bidding becoming standard

**2. Privacy-First Marketing**
• First-party data is critical
• Server-side tracking (CAPI) essential
• Contextual targeting making a comeback

**3. Short-Form Video Dominance**
• Reels outperforming static on Meta
• Authentic, raw content winning
• Sound-on viewing increasing

**4. E-commerce Trends**
• Social commerce growing rapidly
• Live shopping gaining traction
• AR try-on experiences

**5. Audience Strategies**
• Broad targeting with strong creative
• Lookalike audiences still effective
• Retargeting windows shortening

**Action Items for Your Account:**
• Ensure Meta Pixel + CAPI are properly set up
• Increase video creative production
• Test Advantage+ shopping campaigns

Want me to dive deeper into any of these trends?`;
    }

    // Help or general
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm your AI Marketing Manager! Here's how I can help:

**📊 Performance Analysis**
Ask about your campaign results, ROAS, CPA, or overall performance.

**💰 Budget Management**
Get recommendations on budget allocation and scaling decisions.

**🎨 Creative Strategy**
Ideas for ad creatives, hooks, and content strategies.

**📈 Growth Planning**
Scaling strategies and when to increase/decrease spend.

**🔍 Industry Insights**
Latest trends and best practices in digital marketing.

**💡 Quick Actions**
• "How are we doing this week?"
• "Should I scale my campaigns?"
• "What creative should I test next?"
• "What's trending in digital marketing?"

Just ask naturally - I'm here to be your marketing partner!`;
    }

    // Default response
    return `That's a great question! Based on your current performance:

• ROAS: ${performanceSummary.roas.toFixed(2)}x
• CPA: R${performanceSummary.cpa.toFixed(0)}
• Active Campaigns: ${activeCampaigns}

I'd recommend focusing on ${performanceSummary.roas >= 2 ? 'scaling your winning campaigns' : 'optimizing underperformers first'}.

Could you tell me more specifically what you'd like to know? For example:
- Campaign performance details
- Budget recommendations
- Creative strategy ideas
- Industry trends

I'm here to help!`;
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateResponse(userMessage.content);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsProcessing(false);

    // Speak the response
    if (voiceEnabled) {
      speak(response);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Marketing Manager</h1>
            <p className="text-sm text-muted-foreground">
              Your intelligent marketing assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={voiceEnabled ? 'text-primary' : 'text-muted-foreground'}
          >
            {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span>7-Day ROAS</span>
            </div>
            <p className="text-lg font-bold">
              {performanceSummary.roas.toFixed(2)}x
              {performanceSummary.roas >= (businessProfile?.breakEvenRoas || 2) ? (
                <TrendingUp className="inline h-4 w-4 ml-1 text-green-400" />
              ) : (
                <TrendingDown className="inline h-4 w-4 ml-1 text-red-400" />
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              <span>CPA</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(performanceSummary.cpa)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Sparkles className="h-3 w-3" />
              <span>Purchases</span>
            </div>
            <p className="text-lg font-bold">{performanceSummary.purchases}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>Active</span>
            </div>
            <p className="text-lg font-bold">{activeCampaigns} campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Bot className="h-4 w-4" />
                    <span>AI Manager</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm">
                  {message.content.split('\n').map((line, i) => {
                    // Handle bold text
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {parts.map((part, j) => 
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </p>
                    );
                  })}
                </div>
                <div className="text-xs opacity-50 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <Button
              variant={isListening ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleListening}
              className="shrink-0"
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            {isSpeaking && (
              <Button
                variant="outline"
                size="icon"
                onClick={stopSpeaking}
                className="shrink-0"
              >
                <VolumeX className="h-5 w-5" />
              </Button>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? 'Listening...' : 'Ask me anything about your marketing...'}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isProcessing}
              className="shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Listening... Speak now
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
