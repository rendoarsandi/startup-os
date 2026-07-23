import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Sliders } from 'lucide-react';

export const PRESETS = {
  steady: {
    name: 'Steady State (Stable Ops)',
    cashBalance: 450000,
    monthlyBurn: 45000,
    cac: 120,
    leads: 1200,
    conversionRate: 2.5,
    headcount: 24,
    attritionRate: 4.2,
    avgSalary: 115000,
    eNps: 78,
    projectVelocity: 85,
    milestoneCompletion: 92,
    activeProjects: 5,
    ticketsClosed: 142
  },
  growth: {
    name: 'Hyper-Growth (Surge Operations)',
    cashBalance: 950000,
    monthlyBurn: 110000,
    cac: 85,
    leads: 3500,
    conversionRate: 4.8,
    headcount: 45,
    attritionRate: 2.5,
    avgSalary: 130000,
    eNps: 92,
    projectVelocity: 96,
    milestoneCompletion: 98,
    activeProjects: 9,
    ticketsClosed: 412
  },
  crisis: {
    name: 'Runway Crisis (High-Stress)',
    cashBalance: 90000,
    monthlyBurn: 65000,
    cac: 280,
    leads: 600,
    conversionRate: 1.1,
    headcount: 18,
    attritionRate: 18.5,
    avgSalary: 105000,
    eNps: 34,
    projectVelocity: 58,
    milestoneCompletion: 64,
    activeProjects: 3,
    ticketsClosed: 78
  },
  efficient: {
    name: 'Capital Efficient Scale-up',
    cashBalance: 380000,
    monthlyBurn: 15000,
    cac: 45,
    leads: 1500,
    conversionRate: 3.2,
    headcount: 12,
    attritionRate: 0.0,
    avgSalary: 125000,
    eNps: 85,
    projectVelocity: 90,
    milestoneCompletion: 95,
    activeProjects: 4,
    ticketsClosed: 210
  }
};

interface PresetSelectorProps {
  selectedPreset: keyof typeof PRESETS;
  onSelectPreset: (key: keyof typeof PRESETS) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ selectedPreset, onSelectPreset }) => {
  return (
    <Card className="p-4 border border-border/50 bg-card rounded-xl mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <Sliders className="w-4 h-4 text-indigo-500" />
        <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Operational Simulation Scenarios</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map(key => (
          <Button
            key={key}
            variant={selectedPreset === key ? 'default' : 'outline'}
            className={`text-xs h-auto py-2.5 px-3 flex flex-col items-start text-left justify-center ${
              selectedPreset === key ? 'bg-indigo-600 text-white' : ''
            }`}
            onClick={() => onSelectPreset(key)}
          >
            <span className="font-semibold text-xs">{PRESETS[key].name}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
