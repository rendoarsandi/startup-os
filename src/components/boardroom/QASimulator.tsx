import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Sparkles, Send, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import { INVESTOR_PERSONAS, EvaluationResult } from '../AIBoardroom';

interface QASimulatorProps {
  metrics: any;
  evaluateResponse: (resp: string, personaId: string, qIdx: number, metrics: any) => EvaluationResult;
}

export const QASimulator: React.FC<QASimulatorProps> = ({ metrics, evaluateResponse }) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState('skeptical_vc');
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const activePersona = INVESTOR_PERSONAS.find(p => p.id === selectedPersonaId) || INVESTOR_PERSONAS[0];
  const activeQuestion = activePersona.questions[selectedQuestionIdx] || activePersona.questions[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userResponse.trim()) return;
    const result = evaluateResponse(userResponse, selectedPersonaId, selectedQuestionIdx, metrics);
    setEvaluation(result);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 border border-border/50 bg-card rounded-xl space-y-4">
          <h3 className="font-semibold text-sm text-foreground">Select Board Persona</h3>
          <div className="space-y-2">
            {INVESTOR_PERSONAS.map(p => (
              <div
                key={p.id}
                onClick={() => { setSelectedPersonaId(p.id); setSelectedQuestionIdx(0); setEvaluation(null); }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPersonaId === p.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-border/50 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {p.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{p.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 border border-border/50 bg-card rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Q&amp;A Defense Simulation</h3>
            <Select value={selectedQuestionIdx.toString()} onValueChange={v => { setSelectedQuestionIdx(parseInt(v, 10)); setEvaluation(null); }}>
              <SelectTrigger className="w-[200px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {activePersona.questions.map((q, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>Question {idx + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/30 border rounded-lg space-y-2">
            <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
              {activePersona.name} ({activePersona.focus})
            </Badge>
            <p className="text-sm font-semibold text-foreground">"{activeQuestion}"</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Type your strategic defense response..."
              value={userResponse}
              onChange={e => setUserResponse(e.target.value)}
              className="text-xs"
            />
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
              <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Response to Board
            </Button>
          </form>

          {evaluation && (
            <div className="p-4 border rounded-xl bg-card space-y-3 pt-4 border-indigo-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-500" />
                  <span className="font-bold text-sm text-foreground">Score: {evaluation.score}/100</span>
                </div>
                <Badge variant="outline" className={`text-xs ${
                  evaluation.score >= 75 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {evaluation.verdict}
                </Badge>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-emerald-500 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Critique:</p>
                <p className="text-muted-foreground">{evaluation.critique}</p>
              </div>
              {evaluation.gaps && (
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Gaps:</p>
                  <p className="text-muted-foreground">{evaluation.gaps}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
