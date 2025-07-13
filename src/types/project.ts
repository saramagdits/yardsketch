export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'completed' | 'archived';
  createdAt: Date | string;
  updatedAt: Date | string;
  originalImage?: string;
  generatedImages?: string[];
  designThesis?: string;
  materialsList?: Material[];
  totalCost?: number;
  climateZone?: string;
  sunExposure?: string;
  squareFootage?: number;
  designStyle?: string;
  budget?: number;
}

export interface Material {
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: number;
  category: 'plants' | 'hardscape' | 'mulch' | 'other';
}

export interface ProjectFormData {
  name: string;
  climateZone: string;
  sunExposure: 'full-sun' | 'partial-sun' | 'shade';
  squareFootage: number;
  designStyle: 'modern' | 'traditional' | 'cottage' | 'tropical' | 'desert' | 'woodland';
  budget?: number;
  notes?: string;
} 