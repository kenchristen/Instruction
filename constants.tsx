
import { Step, StepConfig, PlanType, LessonPlan, PhaseType } from './types';

export const EXERCISE_TYPES = ['Compagnie', 'GI', 'PR', 'Anti-chute', 'Tronçonneuse', 'Théorique', 'Pratique'];

export const INSTRUCTION_PHASES: PhaseType[] = [
  'Appel et déplacement', 'Lecon', 'engagement', 'pause', 'repli', 'appel de fin'
];

export const PITT_PHASES: PhaseType[] = [
  'Problématisation', 'Information', 'Traitement', 'Transfert'
];

export const PEDAGOGICAL_LEVELS = ['Apprentissage', 'Consolidation', 'Application'];

export const VEHICLES_LIST = [
  'Tonne-pompe', 'Motopompe', 'Mitch', 'Échelle remorquable'
];

export const EQUIPMENT_LIST = [
  'Brise-glace', 'Échelle à coulisse', 
  'Échelle remarquable', 'Éclairage', 'Pompe en immersion', 'Aspirateur', 
  'Sac antichute', 'Corde', 'Matériel PR', 'Combinaison', 
  'Récupération d\'insectes', 'Caisse animaux', 'Génératrice', 'Moyen d\'éclairage',
  'Projecteur', 'Tableau blanc', 'Maquette', 'Mannequin'
];

export const TACTICAL_SYMBOLS = [
  { category: 'Standard', type: 'LECON', label: 'Leçon', color: '#3b82f6', shape: 'circle', text: 'L' },
  { category: 'Sapeurs', type: 'ENGIN', label: 'Engin', color: '#ef4444', shape: 'square', text: 'E' },
  { category: 'Sapeurs', type: 'OFFICIER', label: 'Officier', color: '#f59e0b', shape: 'circle', text: 'O' },
];

export const GET_STEPS = (type: PlanType): StepConfig[] => {
  const steps: StepConfig[] = [
    { id: Step.TYPE_SELECTION, label: 'Format', description: 'Type de document' },
    { id: Step.CONTEXT, label: 'Contexte', description: 'Infos de base' },
  ];

  if (type === PlanType.INSTRUCTION) {
    steps.push({ id: Step.OBJECTIVES, label: 'Instruction', description: 'Thèmes' });
  }

  steps.push(
    { id: Step.CONTENT, label: 'Objectifs', description: 'Détails techniques' },
    { id: Step.STRUCTURE, label: type === PlanType.LESSON ? 'Grille PITT' : 'Plan horaire', description: 'Séquençage' },
    { id: Step.ASSESSMENT, label: 'Logistique', description: 'Moyens' },
  );

  if (type === PlanType.INSTRUCTION) {
    steps.push({ id: Step.MAP_PLAN, label: 'Plan', description: 'Plan de situation' });
  }

  steps.push({ id: Step.REVIEW, label: 'Récapitulatif', description: 'Document final' });
  
  return steps;
};

export const INITIAL_LESSON_STATE: LessonPlan = {
  type: PlanType.LESSON,
  title: '', subject: '', gradeLevel: '', level: 'Apprentissage', exerciseType: 'Théorique', location: '', contactPerson: '', direx: '', observers: '',
  timeStart: '19:30', timeEnd: '20:15', duration: '45', targetAudience: '', didacticMaterials: [], mainObjective: '',
  objectives: [''], themeInstructors: {}, themeLevels: {}, themeObjectives: {},
  materials: [''], prerequisites: [''], 
  phases: [
    { id: 'p1', title: 'Phase d\'introduction', type: 'Problématisation', duration: 5, description: '', activity: 'Motivation des participants sur le thème et les objectifs', methodFormSupport: '- Exposé\n- Plénum\n- Affiche', didacticComments: 'Éveil des participants' },
    { id: 'p2', title: 'Phase d\'apport', type: 'Information', duration: 15, description: '', activity: 'Démonstration des techniques clés', methodFormSupport: '- Entretien didactique\n- Plénum', didacticComments: 'Transmettre le savoir' },
    { id: 'p3', title: 'Phase pratique', type: 'Traitement', duration: 20, description: '', activity: 'Mise en pratique individuelle par les sapeurs', methodFormSupport: '- Travail individuel', didacticComments: 'Effectuer selon le règlement' },
    { id: 'p4', title: 'Phase de bilan', type: 'Transfert', duration: 5, description: '', activity: 'Synthèse des points clés et contrôle', methodFormSupport: '- Question / réponse', didacticComments: 'Effectuer un contrôle final' },
  ],
  equipment: [], assessment: '', tacticalSymbols: [],
};

export const INITIAL_INSTRUCTION_STATE: LessonPlan = {
  type: PlanType.INSTRUCTION,
  title: '', subject: '', gradeLevel: '', level: '', exerciseType: 'Compagnie', location: '', contactPerson: '', direx: '', observers: '',
  timeStart: '08:00', timeEnd: '12:00', duration: '', targetAudience: '', didacticMaterials: [], mainObjective: '',
  objectives: ['Leçon 1', 'Leçon 2'], themeInstructors: {}, themeLevels: {}, themeObjectives: {},
  materials: [''], prerequisites: [''],
  phases: [
    { id: '1', title: 'Prise de contact', type: 'Appel et déplacement', duration: 15, description: '', activity: 'Appel, briefing sécurité et distribution des missions', methodFormSupport: '', didacticComments: '' },
    { id: '2', title: 'Leçon 1', type: 'Lecon', duration: 90, description: '', activity: 'Travail technique sur le thème principal', methodFormSupport: '', didacticComments: '' },
    { id: '3', title: 'Leçon 2', type: 'Lecon', duration: 90, description: '', activity: 'Travail technique sur le thème secondaire', methodFormSupport: '', didacticComments: '' },
    { id: '4', title: 'Engagement final', type: 'engagement', duration: 30, description: '', activity: 'Mise en pratique globale', methodFormSupport: '', didacticComments: '' },
    { id: '5', title: 'Bilan', type: 'appel de fin', duration: 15, description: '', activity: 'Rangement et débriefing final', methodFormSupport: '', didacticComments: '' },
  ],
  equipment: [], assessment: '', tacticalSymbols: [],
};
