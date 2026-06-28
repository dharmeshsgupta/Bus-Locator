import React from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useRouteWizard } from './hooks/useRouteWizard';
import { RouteStepBasicInfo } from './RouteStepBasicInfo';
import { RouteStopBuilder } from './RouteStopBuilder';
import { RouteStepPreview } from './RouteStepPreview';
import { RouteStepBus } from './RouteStepBus';
import { RouteStepDriver } from './RouteStepDriver';

const STEPS = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Stops' },
  { id: 3, name: 'Preview' },
  { id: 4, name: 'Bus' },
  { id: 5, name: 'Driver' },
];

export function RouteWizardModal({ onClose }: { onClose: () => void }) {
  const wizard = useRouteWizard(onClose);

  // Validation before proceeding
  const canProceed = () => {
    if (wizard.currentStep === 1) {
      return !!(wizard.routeInfo.route_name && wizard.routeInfo.route_code && wizard.routeInfo.start_location && wizard.routeInfo.end_location);
    }
    if (wizard.currentStep === 2) {
      return wizard.stops.length >= 2;
    }
    return true; // Preview, Bus, Driver steps are optional or display-only
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl p-6 flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header & Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Route</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-300" 
                 style={{ width: `${((wizard.currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>
            
            <div className="relative flex justify-between">
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                    wizard.currentStep > step.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : wizard.currentStep === step.id 
                        ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-600'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}>
                    {wizard.currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    wizard.currentStep >= step.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}>{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar px-2 py-4">
          {wizard.currentStep === 1 && <RouteStepBasicInfo routeInfo={wizard.routeInfo} setRouteInfo={wizard.setRouteInfo} />}
          {wizard.currentStep === 2 && <RouteStopBuilder stops={wizard.stops} setStops={wizard.setStops} />}
          {wizard.currentStep === 3 && <RouteStepPreview routeInfo={wizard.routeInfo} stops={wizard.stops} />}
          {wizard.currentStep === 4 && <RouteStepBus busId={wizard.busId} setBusId={wizard.setBusId} />}
          {wizard.currentStep === 5 && <RouteStepDriver driverId={wizard.driverId} setDriverId={wizard.setDriverId} busId={wizard.busId} />}
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
          <button 
            type="button" 
            onClick={wizard.prevStep} 
            disabled={wizard.currentStep === 1 || wizard.isSubmitting}
            className="flex items-center px-6 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back
          </button>
          
          {wizard.currentStep < STEPS.length ? (
            <button 
              type="button" 
              onClick={wizard.nextStep} 
              disabled={!canProceed()}
              className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-600/20"
            >
              Next <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={wizard.submit} 
              disabled={wizard.isSubmitting}
              className="flex items-center px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition shadow-lg shadow-green-600/20 font-bold"
            >
              {wizard.isSubmitting ? 'Saving...' : 'Finish & Save Route'} <Check className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
