
import React from 'react';
import { Step, PlanType } from '../types';
import { GET_STEPS } from '../constants';

interface StepIndicatorProps {
  currentStep: Step;
  planType: PlanType;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, planType }) => {
  const steps = GET_STEPS(planType);

  if (currentStep === Step.TYPE_SELECTION) return null;

  return (
    <nav aria-label="Progress" className="mb-10 no-print">
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, index) => {
          if (step.id === Step.TYPE_SELECTION) return null;
          
          // Trouver l'index visuel (en sautant le premier)
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <li key={step.id} className="relative flex-1 flex flex-col items-center group">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-700 ${
                  isActive || isCompleted
                    ? 'bg-red-600 scale-150 ring-4 ring-red-100'
                    : 'bg-slate-200'
                }`}
              />
              <span className={`mt-3 text-[10px] font-black uppercase tracking-tighter transition-colors ${
                isActive ? 'text-red-600' : 'text-slate-300'
              } hidden md:block`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="absolute top-1 left-1/2 w-full h-[1px] -z-10 bg-slate-100" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
