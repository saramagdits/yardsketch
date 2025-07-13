'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useSession } from 'next-auth/react';
import { ProjectFormData } from '@/types/project';

export default function NewProject() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    climateZone: '',
    sunExposure: 'full-sun',
    squareFootage: 0,
    designStyle: 'modern',
    budget: 0,
    notes: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!session) {
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement project creation with image upload and AI generation
      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify(formData));
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const project = await response.json();
        router.push(`/projects/${project.id}`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user!} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">
            Upload a photo and provide details to generate your landscape proposal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Smith Residence Front Yard"
                />
              </div>

              <div>
                <label htmlFor="climateZone" className="block text-sm font-medium text-gray-700 mb-2">
                  Climate Zone *
                </label>
                <select
                  id="climateZone"
                  required
                  value={formData.climateZone}
                  onChange={(e) => setFormData({ ...formData, climateZone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select climate zone</option>
                  <option value="1">Zone 1 - Very Cold</option>
                  <option value="2">Zone 2 - Cold</option>
                  <option value="3">Zone 3 - Cool</option>
                  <option value="4">Zone 4 - Moderate</option>
                  <option value="5">Zone 5 - Warm</option>
                  <option value="6">Zone 6 - Hot</option>
                  <option value="7">Zone 7 - Very Hot</option>
                  <option value="8">Zone 8 - Tropical</option>
                </select>
              </div>

              <div>
                <label htmlFor="sunExposure" className="block text-sm font-medium text-gray-700 mb-2">
                  Sun Exposure *
                </label>
                <select
                  id="sunExposure"
                  required
                  value={formData.sunExposure}
                  onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value as 'full-sun' | 'partial-sun' | 'shade' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="full-sun">Full Sun (6+ hours)</option>
                  <option value="partial-sun">Partial Sun (3-6 hours)</option>
                  <option value="shade">Shade (Less than 3 hours)</option>
                </select>
              </div>

              <div>
                <label htmlFor="squareFootage" className="block text-sm font-medium text-gray-700 mb-2">
                  Square Footage *
                </label>
                <input
                  type="number"
                  id="squareFootage"
                  required
                  min="1"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label htmlFor="designStyle" className="block text-sm font-medium text-gray-700 mb-2">
                  Design Style *
                </label>
                <select
                  id="designStyle"
                  required
                  value={formData.designStyle}
                  onChange={(e) => setFormData({ ...formData, designStyle: e.target.value as 'modern' | 'traditional' | 'cottage' | 'tropical' | 'desert' | 'woodland' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="modern">Modern</option>
                  <option value="traditional">Traditional</option>
                  <option value="cottage">Cottage</option>
                  <option value="tropical">Tropical</option>
                  <option value="desert">Desert</option>
                  <option value="woodland">Woodland</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (Optional)
                </label>
                <input
                  type="number"
                  id="budget"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 5000"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any specific requirements or preferences..."
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Photo</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photo *
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  required
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload a clear photo of the area you want to landscape
                </p>
              </div>

              {imagePreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <img
                    src={imagePreview}
                    alt="Property preview"
                    className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 