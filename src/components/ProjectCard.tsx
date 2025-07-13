import Link from 'next/link';
import { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {project.name}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>

        {project.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Created {formatDate(project.createdAt)}</span>
          {project.totalCost && (
            <span className="font-medium text-gray-900">
              ${project.totalCost.toLocaleString()}
            </span>
          )}
        </div>

        {project.generatedImages && project.generatedImages.length > 0 && (
          <div className="mt-4">
            <img
              src={project.generatedImages[0]}
              alt="Generated design"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </Link>
  );
} 