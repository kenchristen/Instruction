
import React, { useState, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { LessonPlan, Step, PlanType, TacticalSymbol, PhaseType } from './types';
import { INITIAL_LESSON_STATE, INITIAL_INSTRUCTION_STATE, GET_STEPS, EQUIPMENT_LIST, VEHICLES_LIST, TACTICAL_SYMBOLS, INSTRUCTION_PHASES, PITT_PHASES, PEDAGOGICAL_LEVELS } from './constants';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.TYPE_SELECTION);
  const [lesson, setLesson] = useState<LessonPlan>(INITIAL_LESSON_STATE);
  const [selectedSymbolType, setSelectedSymbolType] = useState<string | null>(TACTICAL_SYMBOLS[0].type);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [draggingSymbolId, setDraggingSymbolId] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const steps = useMemo(() => GET_STEPS(lesson.type), [lesson.type]);

  const next = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prev = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    } else {
      setCurrentStep(Step.TYPE_SELECTION);
    }
  };

  const updateLesson = (updates: Partial<LessonPlan>) => {
    setLesson((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectType = (type: PlanType) => {
    setLesson(type === PlanType.LESSON ? INITIAL_LESSON_STATE : INITIAL_INSTRUCTION_STATE);
    setCurrentStep(Step.CONTEXT);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateLesson({ mapImage: event.target?.result as string });
        setIsMapLocked(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const lockViewAction = () => {
    if (!lesson.mapImage) {
      fileInputRef.current?.click();
    } else {
      setIsMapLocked(true);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingSymbolId || !selectedSymbolType || !isMapLocked || !lesson.mapImage) return;
    
    if ((e.target as HTMLElement).classList.contains('map-background')) {
      setSelectedSymbolId(null);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const config = TACTICAL_SYMBOLS.find(s => s.type === selectedSymbolType);
    updateLesson({ 
      tacticalSymbols: [...lesson.tacticalSymbols, { 
        id: Math.random().toString(36).substr(2, 9),
        type: selectedSymbolType,
        x,
        y,
        color: config?.color,
        label: config?.text,
        size: 32,
      }] 
    });
  };

  const handleSymbolMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingSymbolId(id);
    setSelectedSymbolId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingSymbolId || !mapContainerRef.current) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const updatedSymbols = lesson.tacticalSymbols.map(sym => 
      sym.id === draggingSymbolId ? { ...sym, x, y } : sym
    );
    setLesson(prev => ({ ...prev, tacticalSymbols: updatedSymbols }));
  };

  const handleMouseUp = () => {
    setDraggingSymbolId(null);
  };

  const handleUpdateSymbolSize = (id: string, size: number) => {
    const updatedSymbols = lesson.tacticalSymbols.map(sym => 
      sym.id === id ? { ...sym, size } : sym
    );
    updateLesson({ tacticalSymbols: updatedSymbols });
  };

  const calculateStartTimeForPhase = (index: number) => {
    let current = lesson.timeStart || "08:00";
    const addMins = (time: string, minutes: number) => {
      const [h, m] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0);
      date.setMinutes(date.getMinutes() + (minutes || 0));
      return date.toTimeString().slice(0, 5);
    };
    for (let i = 0; i < index; i++) {
      current = addMins(current, lesson.phases[i].duration);
    }
    return current;
  };

  const exportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lesson, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Plan_${lesson.type === PlanType.LESSON ? 'Lecon' : 'Instruction'}_${lesson.title || 'SansTitre'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowShareMenu(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setLesson(imported);
          setCurrentStep(Step.REVIEW);
          if (imported.mapImage) setIsMapLocked(true);
        } catch (err) {
          alert("Fichier invalide.");
        }
      };
      reader.readAsText(file);
    }
  };

  const saveToCloud = async () => {
    setIsSaving(true);
    try {
      const result = await dbService.savePlan(lesson);
      if (result.success) {
        updateLesson({ uuid: result.uuid });
        alert("Plan sauvegardé avec succès sur le serveur !");
      }
    } catch (err) {
      alert("Erreur lors de la sauvegarde sur le serveur. Vérifiez la configuration PHP/MariaDB.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadPlansList = async () => {
    setIsLoadingPlans(true);
    try {
      const plans = await dbService.getPlans();
      setSavedPlans(plans);
    } catch (err) {
      console.error("Erreur chargement liste:", err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const loadPlan = async (uuid: string) => {
    try {
      const plan = await dbService.getPlanByUuid(uuid);
      setLesson(plan);
      setCurrentStep(Step.REVIEW);
      if (plan.mapImage) setIsMapLocked(true);
    } catch (err) {
      alert("Erreur lors du chargement du plan.");
    }
  };

  const renderSymbol = (symbol: TacticalSymbol, isPreview = false) => {
    const size = symbol.size || 32;
    const isSelected = selectedSymbolId === symbol.id;

    const baseStyle = { 
      backgroundColor: symbol.color,
      left: isPreview ? undefined : `${symbol.x}%`,
      top: isPreview ? undefined : `${symbol.y}%`,
      transform: isPreview ? undefined : 'translate(-50%, -50%)',
      position: isPreview ? 'relative' : 'absolute' as any,
      width: `${size}px`,
      height: `${size}px`,
      color: 'white',
      cursor: isPreview ? 'pointer' : draggingSymbolId === symbol.id ? 'grabbing' : 'grab',
      zIndex: isSelected ? 50 : 40,
      fontSize: `${size / 2.5}px`,
      boxShadow: isSelected ? '0 0 0 4px rgba(239, 68, 68, 0.4), 0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    };

    return (
      <div 
        key={symbol.id} 
        style={baseStyle} 
        onMouseDown={(e) => !isPreview && handleSymbolMouseDown(e, symbol.id)}
        className={`flex items-center justify-center text-white font-black transition-all border-2 border-white/20 rounded-full symbol-item`}
      >
        {symbol.label || 'L'}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.TYPE_SELECTION:
        return (
          <div className="flex flex-col gap-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button onClick={() => handleSelectType(PlanType.LESSON)} className="group p-8 bg-white border-2 border-slate-200 rounded-3xl hover:border-red-500 hover:shadow-xl transition-all text-left">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Plan de Leçon</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Conception pédagogique basée sur le modèle PITT.</p>
              </button>
              <button onClick={() => handleSelectType(PlanType.INSTRUCTION)} className="group p-8 bg-white border-2 border-slate-200 rounded-3xl hover:border-red-600 hover:shadow-xl transition-all text-left">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-700 transition-colors">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Plan d'Instruction</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Format opérationnel (Ateliers et Tactique).</p>
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="h-[1px] w-full bg-slate-200 relative"><span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">OU</span></div>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => importInputRef.current?.click()} className="px-10 py-4 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3">Importer .json</button>
                <button onClick={loadPlansList} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3">Charger du serveur</button>
              </div>
              <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
              
              {savedPlans.length > 0 && (
                <div className="w-full mt-8 bg-white p-6 rounded-3xl border border-slate-200 animate-in">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Plans sauvegardés sur le serveur</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                    {savedPlans.map((p) => (
                      <button key={p.uuid} onClick={() => loadPlan(p.uuid)} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors text-left">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{p.title || 'Sans titre'}</div>
                          <div className="text-[9px] text-slate-400 uppercase font-black">{p.plan_type} • {new Date(p.updated_at).toLocaleDateString()}</div>
                        </div>
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isLoadingPlans && <div className="text-[10px] font-black text-slate-400 animate-pulse">Chargement...</div>}
            </div>
          </div>
        );

      case Step.CONTEXT: {
        const isLesson = lesson.type === PlanType.LESSON;
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isLesson ? 'Contexte de la Leçon' : "Contexte de l'Instruction"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="col-span-full space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{isLesson ? 'Titre de la leçon' : "Titre de l'instruction"}</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={lesson.title || ''} onChange={e => updateLesson({ title: e.target.value })} placeholder={isLesson ? "Ex: S'orienter en pleine nature" : "Ex: Manœuvre motopompe et aspiration"} />
              </div>
              
              {!isLesson && (
                <div className="col-span-full space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Objectif global de l'instruction</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold min-h-[100px]" value={lesson.mainObjective || ''} onChange={e => updateLesson({ mainObjective: e.target.value })} placeholder="Détaillez ici la finalité globale de cette instruction..." />
                </div>
              )}

              <div className="col-span-full space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Public cible</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={lesson.targetAudience || ''} onChange={e => updateLesson({ targetAudience: e.target.value })} placeholder="Ex: Sapeurs de 1ère année" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Lieu</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={lesson.location || ''} onChange={e => updateLesson({ location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{isLesson ? 'Instructeur' : 'Responsable / DIREX'}</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={lesson.direx || ''} onChange={e => updateLesson({ direx: e.target.value })} />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Heure de début</label>
                <input type="time" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={lesson.timeStart || ''} onChange={e => updateLesson({ timeStart: e.target.value })} />
              </div>

              {isLesson ? (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Durée totale (min)</label>
                  <input type="number" min="1" max="480" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={lesson.duration || ''} onChange={e => updateLesson({ duration: e.target.value })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Heure de fin</label>
                  <input type="time" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={lesson.timeEnd || ''} onChange={e => updateLesson({ timeEnd: e.target.value })} />
                </div>
              )}

              {isLesson && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Niveau pédagogique</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold" value={lesson.level || ''} onChange={e => updateLesson({ level: e.target.value })}>
                    {PEDAGOGICAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      }

      case Step.OBJECTIVES: {
        const isInstruction = lesson.type === PlanType.INSTRUCTION;
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Instruction</h3>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
               <div className="space-y-6">
                 {lesson.objectives.map((obj, i) => (
                   <div key={i} className="flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex gap-4 items-center">
                       <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">{i + 1}</span>
                       <input className="flex-grow px-4 py-2 rounded-xl border border-slate-200 font-bold" placeholder="Titre de la leçon..." value={obj || ''} onChange={e => {
                         const n = [...lesson.objectives]; n[i] = e.target.value; updateLesson({ objectives: n });
                       }} />
                       <button onClick={() => updateLesson({ objectives: lesson.objectives.filter((_, idx) => idx !== i) })} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">×</button>
                     </div>
                     {isInstruction && (
                        <div className="flex items-center gap-4 ml-12">
                           <label className="text-[10px] font-black uppercase text-slate-400">Niveau :</label>
                           <select className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs" value={lesson.themeLevels[i] || 'Apprentissage'} onChange={e => {
                             updateLesson({ themeLevels: { ...lesson.themeLevels, [i]: e.target.value } });
                           }}>
                             {PEDAGOGICAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                           </select>
                        </div>
                     )}
                   </div>
                 ))}
                 <button onClick={() => updateLesson({ objectives: [...lesson.objectives, ''] })} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">+ Ajouter une leçon</button>
               </div>
            </div>
          </div>
        );
      }

      case Step.CONTENT:
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Objectifs spécifiques</h3>
            
            {lesson.type === PlanType.INSTRUCTION && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl animate-in">
                <p className="text-sm text-blue-800">
                  <span className="font-black uppercase mr-2 text-blue-900">💡 Rappel SMART :</span>
                  Pour être efficace, un objectif doit être <strong>S</strong>pécifique, <strong>M</strong>esurable, <strong>A</strong>tteignable, <strong>R</strong>éaliste et <strong>T</strong>emporel.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {(lesson.type === PlanType.LESSON ? ['Objectifs pédagogiques'] : lesson.objectives).map((theme, themeIdx) => (
                <div key={themeIdx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-900 uppercase tracking-tight text-xs text-slate-400">{theme || `Leçon ${themeIdx + 1}`}</h4>
                  <div className="space-y-3">
                    {(lesson.themeObjectives[themeIdx] || ['']).map((obj, objIdx) => (
                      <div key={objIdx} className="flex gap-2">
                        <input className="flex-grow px-4 py-2 bg-slate-50 rounded-lg border border-transparent font-bold" placeholder="Objectif spécifique..." value={obj || ''} onChange={e => {
                          const curr = [...(lesson.themeObjectives[themeIdx] || [])]; curr[objIdx] = e.target.value;
                          updateLesson({ themeObjectives: { ...lesson.themeObjectives, [themeIdx]: curr } });
                        }} />
                        <button onClick={() => {
                          const curr = (lesson.themeObjectives[themeIdx] || []).filter((_, idx) => idx !== objIdx);
                          updateLesson({ themeObjectives: { ...lesson.themeObjectives, [themeIdx]: curr } });
                        }} className="text-slate-300 hover:text-red-500">×</button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const curr = [...(lesson.themeObjectives[themeIdx] || []), ''];
                      updateLesson({ themeObjectives: { ...lesson.themeObjectives, [themeIdx]: curr } });
                    }} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">+ Ajouter un point d'objectif</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case Step.STRUCTURE: {
        const isPitt = lesson.type === PlanType.LESSON;
        const options = isPitt ? PITT_PHASES : INSTRUCTION_PHASES;
        return (
          <div className="space-y-6 max-w-7xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isPitt ? 'Grille PITT' : 'Plan horaire'}</h3>
            <div className="space-y-4">
              {lesson.phases.map((phase, idx) => (
                <div key={phase.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden transition-all hover:shadow-md">
                  <div className="w-full md:w-40 bg-slate-50 p-6 flex flex-col justify-center items-center gap-2 border-r border-slate-100">
                    <div className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-sm shadow-lg shadow-red-100 mb-2">
                       {calculateStartTimeForPhase(idx)}
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="number" className="w-14 bg-white border border-slate-200 rounded-lg px-1 py-1 text-center font-black text-base" value={phase.duration ?? 0} onChange={e => {
                        const n = [...lesson.phases]; n[idx].duration = parseInt(e.target.value) || 0; updateLesson({ phases: n });
                      }} />
                      <span className="text-[10px] font-black text-slate-400">min</span>
                    </div>
                  </div>
                  <div className={`flex-grow p-8 grid grid-cols-1 ${isPitt ? 'xl:grid-cols-4' : 'xl:grid-cols-2'} gap-6`}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isPitt ? 'Phase PITT' : 'Type de Séquence'}</label>
                        <select className="w-full px-4 py-2 bg-slate-100 rounded-lg font-black text-xs text-red-600 outline-none" value={phase.type || ''} onChange={e => {
                          const n = [...lesson.phases]; n[idx].type = e.target.value as PhaseType; updateLesson({ phases: n });
                        }}>
                          {options.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      {!isPitt && phase.type === 'engagement' && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                          <input type="checkbox" id={`ensemble-${idx}`} className="w-5 h-5 rounded accent-red-600" checked={!!phase.isEnsemble} onChange={e => {
                            const n = [...lesson.phases]; n[idx].isEnsemble = e.target.checked; updateLesson({ phases: n });
                          }} />
                          <label htmlFor={`ensemble-${idx}`} className="text-[10px] font-black uppercase text-red-700 tracking-tight cursor-pointer">Exercice d'ensemble</label>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description / Activités</label>
                      <textarea className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black h-24 outline-none border border-transparent focus:border-red-200" value={phase.activity || ''} onChange={e => {
                        const n = [...lesson.phases]; n[idx].activity = e.target.value; updateLesson({ phases: n });
                      }} />
                    </div>
                    {isPitt && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Méthode / Forme / Support</label>
                          <textarea className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold h-24 outline-none" value={phase.methodFormSupport || ''} onChange={e => {
                            const n = [...lesson.phases]; n[idx].methodFormSupport = e.target.value; updateLesson({ phases: n });
                          }} placeholder="- Exposé&#10;- Support..." />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Commentaires didactiques</label>
                          <textarea className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold h-24 outline-none" value={phase.didacticComments || ''} onChange={e => {
                            const n = [...lesson.phases]; n[idx].didacticComments = e.target.value; updateLesson({ phases: n });
                          }} />
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => updateLesson({ phases: lesson.phases.filter(p => p.id !== phase.id) })} className="p-4 bg-slate-50 text-slate-200 hover:text-red-500 border-l border-slate-100">×</button>
                </div>
              ))}
              <button onClick={() => updateLesson({ phases: [...lesson.phases, { id: String(Date.now()), title: '', type: isPitt ? 'Problématisation' : 'Lecon', duration: 15, description: '', activity: '', methodFormSupport: '', didacticComments: '' }] })} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-300 font-black uppercase text-[10px] tracking-widest hover:border-red-400 hover:text-red-500 transition-all">+ Ajouter une séquence</button>
            </div>
          </div>
        );
      }

      case Step.ASSESSMENT:
        return (
          <div className="space-y-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Logistique & Matériel</h3>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Véhicules & Engins</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {VEHICLES_LIST.map(item => (
                      <button key={item} onClick={() => {
                        const curr = lesson.equipment.includes(item) ? lesson.equipment.filter(i => i !== item) : [...lesson.equipment, item];
                        updateLesson({ equipment: curr });
                      }} className={`px-4 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all border-2 text-center ${lesson.equipment.includes(item) ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>{item}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matériel technique</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {EQUIPMENT_LIST.map(item => (
                      <button key={item} onClick={() => {
                        const curr = lesson.equipment.includes(item) ? lesson.equipment.filter(i => i !== item) : [...lesson.equipment, item];
                        updateLesson({ equipment: curr });
                      }} className={`px-4 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all border-2 text-center ${lesson.equipment.includes(item) ? 'bg-slate-800 border-slate-800 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>{item}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 pt-10 border-t border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Sécurité & Points de vigilance</h3>
              <textarea className="w-full p-8 rounded-[2rem] border border-slate-200 min-h-[200px] outline-none shadow-inner text-slate-700 font-medium" value={lesson.assessment || ''} onChange={e => updateLesson({ assessment: e.target.value })} placeholder="Remarques finales..." />
            </div>
          </div>
        );

      case Step.MAP_PLAN: {
        const selectedSymbol = lesson.tacticalSymbols.find(s => s.id === selectedSymbolId);
        return (
          <div className="space-y-6 max-w-7xl mx-auto h-[84vh] flex flex-col">
             <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-xl z-20">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Plan Tactique</h3>
                  {isMapLocked && lesson.mapImage && (
                    <div className="flex gap-2">
                       {TACTICAL_SYMBOLS.map(sym => (
                         <button key={sym.type} onClick={() => setSelectedSymbolType(sym.type)} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] text-white transition-all ${selectedSymbolType === sym.type ? 'ring-4 ring-slate-900 scale-125' : 'opacity-40 hover:opacity-80'}`} style={{ backgroundColor: sym.color }}>{sym.text}</button>
                       ))}
                    </div>
                  )}
                </div>
                {selectedSymbol && (
                  <div className="flex items-center gap-4 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 animate-in">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taille :</label>
                    <input type="range" min="16" max="80" value={selectedSymbol.size || 32} onChange={(e) => handleUpdateSymbolSize(selectedSymbol.id, parseInt(e.target.value))} className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                    <span className="text-[10px] font-black text-slate-900">{selectedSymbol.size || 32}px</span>
                  </div>
                )}
                {!isMapLocked ? (
                  <button onClick={lockViewAction} className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-700">Confirmer la Vue SITG</button>
                ) : (
                  <div className="flex gap-4 items-center">
                    {lesson.tacticalSymbols.length > 0 && (
                      <button onClick={next} className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-700">Confirmer les emplacements</button>
                    )}
                    <button onClick={() => { setIsMapLocked(false); }} className="px-6 py-3 border-2 border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">Changer fond de plan</button>
                  </div>
                )}
             </div>
             <div className="flex-grow bg-slate-100 rounded-[3rem] border border-slate-200 overflow-hidden relative shadow-inner map-background" ref={mapContainerRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={(e) => (e.target as HTMLElement).classList.contains('map-background') && handleMapClick(e)}>
                {!isMapLocked ? (
                  <iframe src="https://map.sitg.ge.ch/app/" className="w-full h-full border-none" title="SITG Map" />
                ) : (
                  <div className="w-full h-full relative bg-cover bg-center map-background" style={{ backgroundImage: lesson.mapImage ? `url(${lesson.mapImage})` : 'none' }}>
                    {lesson.tacticalSymbols.map(s => (
                      <div key={s.id} className="relative group/sym">
                        {renderSymbol(s)}
                        <button onClick={(e) => { e.stopPropagation(); updateLesson({ tacticalSymbols: lesson.tacticalSymbols.filter(sym => sym.id !== s.id) }); setSelectedSymbolId(null); }} className="absolute top-[-25px] left-[50%] -translate-x-1/2 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black opacity-0 group-hover/sym:opacity-100 z-50 shadow-lg">×</button>
                      </div>
                    ))}
                    {!lesson.mapImage && <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black text-xl uppercase tracking-[0.3em]">Importez une image SITG</div>}
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
             </div>
          </div>
        );
      }

      case Step.REVIEW: {
        const isReviewLesson = lesson.type === PlanType.LESSON;
        const rotationLessons = lesson.phases.filter(p => p.type === 'Lecon');
        const rotationAllPhases = lesson.phases.filter(p => p.type === 'Lecon' || p.isEnsemble);
        const instructionThemes = lesson.objectives.filter(o => o.trim());

        return (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-[98%] mx-auto printable-area">
            <div className={`p-10 text-white ${isReviewLesson ? 'bg-[#333]' : 'bg-slate-900'}`}>
              <div className="flex justify-between items-start">
                 <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Sapeurs-Pompiers — {isReviewLesson ? 'Plan de Leçon' : "Plan d'Instruction"}</div>
                    <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">{lesson.title || 'SANS TITRE'}</h2>
                 </div>
                 <div className="text-right">
                    <div className="text-[10px] font-black uppercase opacity-40 mb-1">{isReviewLesson ? 'Durée totale' : 'Horaires'}</div>
                    <div className="text-2xl font-black">{isReviewLesson ? `${lesson.duration} min` : `${lesson.timeStart} — ${lesson.timeEnd}`}</div>
                 </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="text-[9px] uppercase font-black opacity-30 mb-1">{isReviewLesson ? 'Instructeur' : 'DIREX'}</div><div className="text-sm font-black uppercase">{lesson.direx || '-'}</div></div>
                {isReviewLesson && <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="text-[9px] uppercase font-black opacity-30 mb-1">Niveau</div><div className="text-sm font-black uppercase">{lesson.level || '-'}</div></div>}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="text-[9px] uppercase font-black opacity-30 mb-1">Lieu</div><div className="text-sm font-black uppercase">{lesson.location || '-'}</div></div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="text-[9px] uppercase font-black opacity-30 mb-1">Public</div><div className="text-sm font-black uppercase">{lesson.targetAudience || '-'}</div></div>
              </div>
            </div>
            
            <div className="p-8 space-y-10">
              {!isReviewLesson && lesson.mainObjective && (
                <section><div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 border-b border-red-100 pb-2">Objectif Global de l'Instruction</h4>
                  <p className="text-sm font-black text-black leading-relaxed italic">"{lesson.mainObjective}"</p>
                </div></section>
              )}

              {isReviewLesson ? (
                <section><div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 border-b border-red-100 pb-2">Objectifs spécifiques</h4>
                  <ul className="space-y-1">{(lesson.themeObjectives[0] || []).filter(o => o.trim()).map((o, i) => <li key={i} className="text-xs font-bold text-black">• {o}</li>)}</ul>
                </div></section>
              ) : (
                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 border-b border-red-100 pb-2">Instruction (Leçons & Niveaux)</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {instructionThemes.map((o, i) => (
                      <li key={i} className="flex flex-col p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1"><span className="text-xs font-black text-black uppercase tracking-tight">{o}</span><span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">{lesson.themeLevels[i] || 'Apprentissage'}</span></div>
                        <span className="text-[10px] text-black italic">Objectifs pédagogiques: {(lesson.themeObjectives[i] || []).filter(x => x.trim()).join(', ') || 'Non détaillés'}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Plan Horaire Détaillé</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead><tr className="bg-slate-100 border-b border-slate-300">
                      <th className="w-24 p-3 text-[10px] font-black text-black border-r border-slate-300 text-center uppercase">{isReviewLesson ? 'Durée [min]' : 'Horaire'}</th>
                      {isReviewLesson && <><th className="w-10 p-2 text-[10px] font-black text-black border-r border-slate-300 text-center">P</th><th className="w-10 p-2 text-[10px] font-black text-black border-r border-slate-300 text-center">I</th><th className="w-10 p-2 text-[10px] font-black text-black border-r border-slate-300 text-center">T</th><th className="w-10 p-2 text-[10px] font-black text-black border-r border-slate-300 text-center">T</th></>}
                      <th className={`p-3 text-[10px] font-black text-black border-r border-slate-300 ${!isReviewLesson && 'w-1/4'}`}>Séquence / Type</th>
                      {!isReviewLesson && <th className="p-3 text-[10px] font-black text-black uppercase">Activité & Points Clés</th>}
                      {isReviewLesson && <><th className="w-[20%] p-3 text-[10px] font-black text-black border-r border-slate-300 uppercase">Méthode - Forme - Support</th><th className="w-[20%] p-3 text-[10px] font-black text-black uppercase">Commentaires didactiques</th></>}
                    </tr></thead>
                    <tbody>{lesson.phases.map((p, i) => (
                      <tr key={i} className="border-b border-slate-200 align-top hover:bg-slate-50">
                        <td className="p-4 border-r border-slate-200 font-black text-sm text-center text-black">{isReviewLesson ? `${p.duration}'` : calculateStartTimeForPhase(i)}</td>
                        {isReviewLesson && <><td className="p-2 border-r border-slate-200 text-center font-black text-red-600 text-sm">{p.type === 'Problématisation' ? 'x' : ''}</td><td className="p-2 border-r border-slate-200 text-center font-black text-red-600 text-sm">{p.type === 'Information' ? 'x' : ''}</td><td className="p-2 border-r border-slate-200 text-center font-black text-red-600 text-sm">{p.type === 'Traitement' ? 'x' : ''}</td><td className="p-2 border-r border-slate-200 text-center font-black text-red-600 text-sm">{p.type === 'Transfert' ? 'x' : ''}</td></>}
                        <td className="p-4 border-r border-slate-200 text-[11px] font-black leading-relaxed uppercase tracking-tight text-black">{p.type} {p.isEnsemble && <span className="block text-[8px] text-red-600 font-bold mt-1 tracking-widest">(ENSEMBLE)</span>}</td>
                        <td className="p-4 border-r border-slate-200 text-[11px] font-bold text-black leading-relaxed whitespace-pre-wrap">{p.activity}</td>
                        {isReviewLesson && <><td className="p-4 border-r border-slate-200 text-[11px] font-bold text-black whitespace-pre-wrap leading-tight">{p.methodFormSupport}</td><td className="p-4 text-[11px] font-bold text-black whitespace-pre-wrap leading-tight">{p.didacticComments}</td></>}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              {!isReviewLesson && rotationLessons.length > 0 && (
                <section className="mt-12 break-inside-avoid">
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-4">Tableau de Rotation (Tableau Croisé)</h4>
                  <div className="overflow-x-auto rounded-xl border-2 border-black">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead><tr className="bg-black text-white">
                        <th className="w-32 p-4 text-[11px] font-black uppercase tracking-widest border-r border-slate-700">Groupe</th>
                        {rotationAllPhases.map((p, i) => (
                          <th key={i} className="p-4 text-[11px] font-black uppercase tracking-widest border-r border-slate-700 text-center">
                            {calculateStartTimeForPhase(lesson.phases.indexOf(p))}
                            <div className="text-[9px] font-medium opacity-50 lowercase">({p.duration} min)</div>
                          </th>
                        ))}
                      </tr></thead>
                      <tbody>{[1, 2].map((groupNum) => (
                        <tr key={groupNum} className="border-b border-slate-200 font-bold">
                          <td className="p-4 bg-slate-50 text-[11px] font-black uppercase border-r border-slate-200 text-black">SECTION {groupNum}</td>
                          {rotationAllPhases.map((p, i) => {
                            let content = "—";
                            if (p.isEnsemble) {
                              content = "Exercice d'ensemble";
                            } else if (p.type === 'Lecon') {
                              const rIdx = rotationLessons.indexOf(p);
                              let lIdx = rIdx;
                              if (groupNum === 2) lIdx = (rIdx + 1) % rotationLessons.length;
                              content = instructionThemes[lIdx] || `Leçon ${lIdx + 1}`;
                            }
                            return (
                              <td key={i} className="p-4 border-r border-slate-200 text-center">
                                <div className={`inline-block px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight border text-black ${p.isEnsemble ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>{content}</div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-100 pt-10 text-black">
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Matériel engagé</h4><div className="flex flex-wrap gap-2">{lesson.equipment.map(item => (<span key={item} className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase rounded-lg tracking-wider">{item}</span>))}{lesson.equipment.length === 0 && <span className="text-[10px] text-slate-400 italic font-medium">Aucun matériel</span>}</div></div>
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vigilance & Sécurité</h4><p className="text-xs font-bold text-black whitespace-pre-wrap leading-relaxed">{lesson.assessment || "R.A.S"}</p></div>
              </div>

              {lesson.mapImage && (
                <section className="pt-10 border-t border-slate-100 break-inside-avoid">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Plan Tactique & Localisation des leçons</h4>
                  <div className="relative w-full rounded-3xl border-2 border-slate-200 overflow-hidden shadow-lg bg-slate-50" style={{ height: '500px' }}>
                    <img src={lesson.mapImage} alt="Plan Tactique" className="w-full h-full object-cover" />
                    {lesson.tacticalSymbols.map(s => {
                      const sz = s.size || 32;
                      return (
                        <div key={s.id} style={{ backgroundColor: s.color, left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)', position: 'absolute', width: `${sz}px`, height: `${sz}px`, fontSize: `${sz / 2.5}px`, zIndex: 40 }} className={`flex items-center justify-center text-white font-black shadow-2xl border-4 border-white/40 rounded-full`}>{s.label}</div>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="pt-12 flex flex-col items-center no-print">
                <button onClick={() => setShowShareMenu(!showShareMenu)} className="px-16 py-5 bg-red-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95">Exporter le Plan d'Instruction (PDF)</button>
                {showShareMenu && (
                   <div className="mt-4 flex flex-wrap justify-center gap-4 animate-in">
                     <button onClick={() => window.print()} className="px-10 py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 flex items-center gap-3"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>Impression PDF Optimisée</button>
                     <button onClick={exportProject} className="px-10 py-4 bg-slate-100 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 flex items-center gap-3">Sauvegarde Projet (.json)</button>
                     <button onClick={saveToCloud} disabled={isSaving} className="px-10 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 flex items-center gap-3 disabled:opacity-50">
                       {isSaving ? 'Sauvegarde...' : 'Sauvegarder sur Serveur'}
                     </button>
                   </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto w-full px-4 py-12">
        <span className="no-print"><StepIndicator currentStep={currentStep} planType={lesson.type} /></span>
        <div className="mt-8 min-h-[600px]">{renderStep()}</div>
        {currentStep !== Step.TYPE_SELECTION && (
          <div className="mt-16 flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 sticky bottom-10 z-50 shadow-2xl no-print">
            <button onClick={prev} className="px-8 py-3 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Retour</button>
            <button onClick={next} disabled={currentStep === Step.REVIEW} className={`px-12 py-4 rounded-2xl font-black text-white shadow-xl shadow-red-100 transition-all active:scale-95 uppercase text-[10px] tracking-widest ${currentStep === Step.REVIEW ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-red-600 hover:bg-red-700'}`}>Étape Suivante</button>
          </div>
        )}
      </div>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .printable-area { width: 100% !important; max-width: 100% !important; border: 1.5px solid #000 !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; color: #000 !important; }
          table { border: 2px solid #000 !important; }
          th, td { border: 1px solid #000 !important; color: #000 !important; }
          .bg-slate-50, .bg-slate-100, .bg-red-50 { background-color: transparent !important; border: 1px solid #ddd !important; }
          .text-black { color: #000 !important; }
          img { max-width: 100% !important; }
        }
        @keyframes in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: in 0.3s ease-out; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #ef4444; cursor: pointer; border-radius: 50%; }
      `}</style>
    </Layout>
  );
};

export default App;
