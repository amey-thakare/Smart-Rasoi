import { useState } from 'react';
import { fetchApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';

export default function AiAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am Smart Rasoi. How can I help you in the kitchen today? You can ask me for recipe ideas, substitutions, or cooking tips.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const result = await fetchApi('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt: userMessage }),
      });
      setMessages((prev) => [...prev, { role: 'ai', text: result.response }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, I encountered an error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex flex-col flex-1 shadow-lg">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            Chef AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted text-foreground rounded-tl-none'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-4">
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recipe ideas, substitutions..."
              className="flex-1 border-primary/20 focus-visible:ring-primary"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
