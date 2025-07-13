import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ProjectView } from '@/components/ProjectView';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/signin');
  }

  // TODO: Fetch project from Firebase using params.id
  // For now, we'll use placeholder data
  const project = {
    id: params.id,
    name: 'Sample Project',
    status: 'completed',
    originalImage: '/placeholder-image.jpg',
    generatedImages: ['/placeholder-generated-1.jpg', '/placeholder-generated-2.jpg'],
    designThesis: `This landscape design proposal presents a comprehensive approach to transforming your outdoor space into a beautiful, functional, and sustainable garden that harmonizes with your property's unique characteristics.

Design Philosophy:
Our approach focuses on creating a landscape that not only enhances the visual appeal of your property but also considers the practical aspects of maintenance, climate suitability, and long-term sustainability. We've carefully selected plants and materials that will thrive in your specific climate zone and sun exposure conditions.

Plant Selection Strategy:
The plant palette has been thoughtfully curated to include a mix of evergreen and deciduous species that provide year-round interest while requiring minimal maintenance. We've incorporated native and climate-appropriate species that are well-suited to your region's growing conditions.

Hardscape Integration:
The hardscape elements have been designed to complement the natural landscape while providing functional spaces for outdoor living. We've used materials that are durable, weather-resistant, and aesthetically pleasing.

Maintenance Considerations:
This design prioritizes low-maintenance solutions while ensuring the landscape remains beautiful throughout the seasons. Plant selections include drought-tolerant species where appropriate, and the layout facilitates easy access for routine maintenance tasks.`,
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
      {
        name: 'Decorative Stones',
        quantity: '1 ton',
        unitPrice: 150,
        totalPrice: 150,
        category: 'hardscape',
      },
    ],
    totalCost: 706,
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
      <DashboardHeader user={session.user} />
      <ProjectView project={project} />
    </div>
  );
} 