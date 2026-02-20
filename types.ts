
export enum PlanType {
  LESSON = 'LESSON',
  INSTRUCTION = 'INSTRUCTION'
}

export type ExerciseType = 'Compagnie' | 'GI' | 'PR' | 'Anti-chute' | 'Tronçonneuse' | 'Théorique' | 'Pratique' | '';

export type PhaseType = 
  | 'Appel et déplacement' | 'Lecon' | 'pause' | 'repli' | 'appel de fin' | 'engagement' 
  | 'Introduction' | 'Théorie' | 'Démonstration' | 'Application' | 'Synthèse' 
  | 'Problématisation' | 'Information' | 'Traitement' | 'Transfert' | '';

export interface TacticalSymbol {
  id: string;
  type: string;
  x: number;
  y: number;
  label?: string;
  color?: string;
  shape?: string;
  text?: string;
  size?: number; // Taille en pixels
}

export interface LessonPhase {
  id: string;
  title: string;
  type: PhaseType;
  duration: number;
  description: string;
  activity: string;
  methodFormSupport: string; // Utilisé pour Plan de Leçon
  didacticComments: string;   // Utilisé pour Plan de Leçon
  isEnsemble?: boolean;      // Utilisé pour Plan d'Instruction
}

export interface LessonPlan {
  uuid?: string;
  type: PlanType;
  title: string;
  subject: string;
  gradeLevel: string;
  level: string; // Niveau pédagogique (Apprentissage, etc.)
  exerciseType: ExerciseType;
  location: string;
  contactPerson: string;
  direx: string; // Sert d'Instructeur pour Leçon
  observers: string;
  timeStart: string;
  timeEnd: string;
  duration: string; 
  targetAudience: string;
  didacticMaterials: string[];
  mainObjective: string;
  objectives: string[]; // Thèmes pour Instruction
  themeInstructors: Record<number, string>;
  themeLevels: Record<number, string>;
  themeObjectives: Record<number, string[]>;
  materials: string[];
  prerequisites: string[];
  phases: LessonPhase[];
  equipment: string[];
  assessment: string;
  mapImage?: string;
  tacticalSymbols: TacticalSymbol[];
}

export enum Step {
  TYPE_SELECTION = 0,
  CONTEXT = 1,
  OBJECTIVES = 2,
  CONTENT = 3,
  STRUCTURE = 4,
  ASSESSMENT = 5,
  MAP_PLAN = 6,
  REVIEW = 7
}

export interface StepConfig {
  id: Step;
  label: string;
  description: string;
}
