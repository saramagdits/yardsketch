import { DashboardHeader } from '@/components/DashboardHeader';
import { ProjectView } from '@/components/ProjectView';
import { Project } from '@/types/project';

export default function TestProjectPage() {
  // Create a test project with generated images
  const testProject: Project = {
    id: 'test-project',
    name: 'Test Landscape Project',
    description: 'A test project to verify generated image display',
    status: 'completed',
    originalImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    generatedImages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&sat=-50',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&sat=50',
    ],
    designThesis: `This is a test landscape design proposal that demonstrates the generated image display functionality.

Design Philosophy:
Our approach focuses on creating a landscape that not only enhances the visual appeal of your property but also considers the practical aspects of maintenance, climate suitability, and long-term sustainability.

Plant Selection Strategy:
The plant palette has been thoughtfully curated to include a mix of evergreen and deciduous species that provide year-round interest while requiring minimal maintenance.`,
    materialsList: [
      {
        name: 'Shrubs (Various)',
        quantity: '10 plants',
        unitPrice: 25,
        totalPrice: 250,
        category: 'plants',
      },
      {
        name: 'Perennials (Various)',
        quantity: '20 plants',
        unitPrice: 15,
        totalPrice: 300,
        category: 'plants',
      },
      {
        name: 'Mulch',
        quantity: '2 cubic yards',
        unitPrice: 3,
        totalPrice: 6,
        category: 'mulch',
      },
    ],
    totalCost: 556,
    climateZone: '5',
    sunExposure: 'full-sun',
    squareFootage: 500,
    designStyle: 'modern',
    budget: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={{ name: 'Test User', email: 'test@example.com' }} />
      <ProjectView project={testProject} />
    </div>
  );
} 