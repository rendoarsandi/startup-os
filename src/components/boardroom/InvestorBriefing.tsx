import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Copy, Check, Download, Sparkles } from 'lucide-react';

interface InvestorBriefingProps {
  reportTone: 'bullish' | 'institutional' | 'pragmatic' | 'casual';
  setReportTone: (tone: 'bullish' | 'institutional' | 'pragmatic' | 'casual') => void;
  investorUpdateMarkdown: string;
}

export const InvestorBriefing: React.FC<InvestorBriefingProps> = ({
  reportTone, setReportTone, investorUpdateMarkdown
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(investorUpdateMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([investorUpdateMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-briefing-${reportTone}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="p-6 border border-border/50 bg-card rounded-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-foreground">AI Executive Briefing Generator</h3>
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 text-xs">Live Synthesis</Badge>
        </div>
        <div className="flex items-center space-x-2">
          {(['bullish', 'institutional', 'pragmatic', 'casual'] as const).map(tone => (
            <Button
              key={tone}
              size="sm"
              variant={reportTone === tone ? 'default' : 'outline'}
              className={`text-xs capitalize ${reportTone === tone ? 'bg-indigo-600 text-white' : ''}`}
              onClick={() => setReportTone(tone)}
            >
              {tone}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload} className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Download
          </Button>
        </div>
      </div>

      <div className="p-4 bg-muted/30 border rounded-lg max-h-[450px] overflow-y-auto font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
        {investorUpdateMarkdown}
      </div>
    </Card>
  );
};
