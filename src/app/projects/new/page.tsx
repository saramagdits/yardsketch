'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useSession } from 'next-auth/react';
import { ProjectFormData } from '@/types/project';

export default function NewProject() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
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
    setLoadingStep('Uploading image and creating project...');

    try {
      console.log('Form submission started');
      console.log('Form data:', formData);
      console.log('Selected image:', selectedImage);
      
      // Validate required fields
      if (!formData.name || !formData.climateZone || !selectedImage) {
        throw new Error('Please fill in all required fields and upload an image');
      }

      const formDataToSend = new FormData();
      const dataString = JSON.stringify(formData);
      console.log('Data string to send:', dataString);
      
      formDataToSend.append('data', dataString);
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
        console.log('Image appended:', selectedImage.name, selectedImage.size);
      }

      console.log('Sending request to /api/projects');
      console.log('FormData entries:');
      for (const [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }
      
      let response;
      try {
        response = await fetch('/api/projects', {
          method: 'POST',
          body: formDataToSend,
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown network error'}`);
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        try {
          const project = await response.json();
          console.log('Project created:', project);
          
          setLoadingStep('Project created successfully! Redirecting...');
          // Show success message before redirecting
          setTimeout(() => {
            router.push(`/projects/${project.id}`);
          }, 1000);
        } catch (jsonError) {
          console.error('Error parsing success response:', jsonError);
          throw new Error('Invalid response format from server');
        }
      } else {
        try {
          const errorText = await response.text();
          console.error('API Error Response Text:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            console.error('Failed to parse error response as JSON:', parseError);
            errorData = { error: errorText || 'Unknown error occurred' };
          }
          
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to create project');
        } catch (textError) {
          console.error('Error reading error response:', textError);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      // Show error message to user
      alert(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user!} />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Project</h3>
            <p className="text-gray-600">{loadingStep}</p>
            <p className="text-sm text-gray-500 mt-4">
              This may take a few moments as we generate your AI-powered landscape design...
            </p>
          </div>
        </div>
      )}
      
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  value={formData.squareFootage || ''}
                  onChange={(e) => setFormData({ ...formData, squareFootage: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  <Image
                    src={imagePreview}
                    alt="Property preview"
                    width={400}
                    height={256}
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
              {isLoading ? 'Creating Project & Generating AI Content...' : 'Create Project & Generate Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 