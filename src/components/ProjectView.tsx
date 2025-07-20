'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Project } from '@/types/project';

interface ProjectViewProps {
  project: Project;
}

export function ProjectView({ project }: ProjectViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'plants':
        return 'bg-green-100 text-green-800';
      case 'hardscape':
        return 'bg-blue-100 text-blue-800';
      case 'mulch':
        return 'bg-brown-100 text-brown-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">
              Created on {formatDate(project.createdAt)}
            </p>
          </div>
          <div className="flex space-x-4">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Edit
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Generated Images */}
          {project.generatedImages && project.generatedImages.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Designs</h2>
              
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={project.generatedImages[selectedImageIndex]}
                    alt={`Generated design ${selectedImageIndex + 1}`}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error('Failed to load generated image:', project.generatedImages?.[selectedImageIndex]);
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                    }}
                    unoptimized={project.generatedImages?.[selectedImageIndex]?.includes('storage.googleapis.com') || false}
                  />
                </div>
                
                {project.generatedImages.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {project.generatedImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === selectedImageIndex
                            ? 'border-green-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Design option ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error('Failed to load thumbnail image:', image);
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2Njc0ODciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OQTwvdGV4dD48L3N2ZyI+';
                          }}
                          unoptimized={image?.includes('storage.googleapis.com')}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Designs</h2>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">No generated designs available yet</p>
                  <p className="text-sm text-gray-500 mt-1">Designs will appear here once the AI generation is complete</p>
                </div>
              </div>
            </div>
          )}

          {/* Design Thesis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Design Thesis</h2>
            <div className="prose max-w-none">
              {project.designThesis?.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Materials List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Materials & Cost Breakdown</h2>
            
            <div className="space-y-4">
              {project.materialsList?.map((material, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(material.category)}`}>
                      {material.category}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{material.name}</h4>
                      <p className="text-sm text-gray-600">{material.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${material.totalPrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">${material.unitPrice}/unit</p>
                  </div>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Estimated Cost</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${project.totalCost?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Status</span>
                <p className="text-gray-900">{project.status}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Climate Zone</span>
                <p className="text-gray-900">Zone {project.climateZone}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Sun Exposure</span>
                <p className="text-gray-900 capitalize">{project.sunExposure?.replace('-', ' ')}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Square Footage</span>
                <p className="text-gray-900">{project.squareFootage?.toLocaleString()} sq ft</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Design Style</span>
                <p className="text-gray-900 capitalize">{project.designStyle}</p>
              </div>
              
              {project.budget && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Budget</span>
                  <p className="text-gray-900">${project.budget.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Original Image */}
          {project.originalImage && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Property</h3>
              <Image
                src={project.originalImage}
                alt="Original property"
                width={400}
                height={192}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 