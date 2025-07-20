import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ProjectView } from '@/components/ProjectView';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Project } from '@/types/project';

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // For now, we'll skip authentication check and fetch the project directly
  // TODO: Implement proper authentication
  const { id: projectId } = await params;

  try {
    // Fetch project from Firestore
    const projectDoc = await getDoc(doc(db, 'projects', projectId));

    if (!projectDoc.exists()) {
      redirect('/dashboard');
    }

    const projectData = projectDoc.data();

    // Convert Firestore timestamps to Date objects and create Project object
    const project: Project = {
      id: projectDoc.id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      originalImage: projectData.originalImage,
      generatedImages: projectData.generatedImages || [],
      designThesis: projectData.designThesis,
      materialsList: projectData.materialsList,
      totalCost: projectData.totalCost,
      climateZone: projectData.climateZone,
      sunExposure: projectData.sunExposure,
      squareFootage: projectData.squareFootage,
      designStyle: projectData.designStyle,
      budget: projectData.budget,
      createdAt: projectData.createdAt?.toDate() || new Date(),
      updatedAt: projectData.updatedAt?.toDate() || new Date(),
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={{ name: 'User', email: 'user@example.com' }} />
        <ProjectView project={project} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching project:', error);
    redirect('/dashboard');
  }
} 