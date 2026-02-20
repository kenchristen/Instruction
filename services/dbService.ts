import { LessonPlan } from '../types';

// URL de base pour vos scripts PHP sur le serveur mutualisé
// En développement, vous pouvez utiliser une URL absolue si nécessaire
const API_BASE_URL = '/api'; 

export const dbService = {
  async savePlan(plan: LessonPlan): Promise<{ success: boolean; uuid: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/save_plan.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      return await response.json();
    } catch (error) {
      console.error('dbService.savePlan error:', error);
      throw error;
    }
  },

  async getPlans(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/get_plans.php`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return await response.json();
    } catch (error) {
      console.error('dbService.getPlans error:', error);
      throw error;
    }
  },

  async getPlanByUuid(uuid: string): Promise<LessonPlan> {
    try {
      const response = await fetch(`${API_BASE_URL}/get_plans.php?uuid=${uuid}`);
      if (!response.ok) throw new Error('Plan non trouvé');
      return await response.json();
    } catch (error) {
      console.error('dbService.getPlanByUuid error:', error);
      throw error;
    }
  }
};
