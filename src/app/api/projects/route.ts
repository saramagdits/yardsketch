import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { storage, db } from '@/lib/firebase';
import OpenAI from 'openai';
import { Material } from '@/types/project';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string; email?: string | null }).id || session.user.email; // Fallback to email if id not available
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const formData = await request.formData();
    const projectData = JSON.parse(formData.get('data') as string);
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Temporarily disable Firebase functionality for development
    // Upload image to Firebase Storage
    // const imageBuffer = await imageFile.arrayBuffer();
    // const imageRef = ref(storage, `projects/${userId}/${Date.now()}_${imageFile.name}`);
    // await uploadBytes(imageRef, imageBuffer);
    // const imageUrl = await getDownloadURL(imageRef);

    // Create project document in Firestore
    // const projectDoc = await addDoc(collection(db, 'projects'), {
    //   userId: userId,
    //   name: projectData.name,
    //   description: projectData.notes,
    //   status: 'draft',
    //   originalImage: imageUrl,
    //   climateZone: projectData.climateZone,
    //   sunExposure: projectData.sunExposure,
    //   squareFootage: projectData.squareFootage,
    //   designStyle: projectData.designStyle,
    //   budget: projectData.budget || 0,
    //   createdAt: serverTimestamp(),
    //   updatedAt: serverTimestamp(),
    // });

    // Temporary mock data for development
    const imageUrl = 'https://via.placeholder.com/800x600?text=Uploaded+Image';
    const projectDoc = { id: 'mock-project-id-' + Date.now() };

    // Generate AI content (temporarily disabled for development)
    // const designPrompt = `Create a professional landscape design proposal for a ${projectData.squareFootage} sq ft area with ${projectData.sunExposure} exposure in climate zone ${projectData.climateZone}. The design style should be ${projectData.designStyle}. ${projectData.notes ? `Additional requirements: ${projectData.notes}` : ''}

    // Please provide:
    // 1. A detailed design thesis explaining the design approach and plant selections
    // 2. A comprehensive materials list with quantities and estimated costs
    // 3. Design recommendations for this specific climate and sun exposure

    // Make it sound professional and experienced, as if written by a landscape designer with 20+ years of experience.`;

    // const [designResponse, imageResponse] = await Promise.all([
    //   openai.chat.completions.create({
    //     model: 'gpt-4',
    //     messages: [
    //       {
    //         role: 'system',
    //         content: 'You are an experienced landscape designer creating professional proposals. Provide detailed, practical advice that sounds authoritative and knowledgeable.',
    //       },
    //       {
    //         role: 'user',
    //         content: designPrompt,
    //       },
    //     ],
    //     max_tokens: 1500,
    //   }),
    //   openai.images.generate({
    //     model: 'dall-e-3',
    //     prompt: `Professional landscape design rendering of a ${projectData.designStyle} style garden for a ${projectData.squareFootage} sq ft area with ${projectData.sunExposure} exposure. Include appropriate plants, hardscaping, and design elements. High quality, photorealistic, professional landscape design visualization.`,
    //     n: 3,
    //     size: '1024x1024',
    //     quality: 'standard',
    //   }),
    // ]);

    // const designThesis = designResponse.choices[0]?.message?.content || '';
    // const generatedImages = imageResponse.data?.map(img => img.url || '') || [];

    // Mock data for development
    const designThesis = `This landscape design proposal presents a comprehensive approach to transforming your ${projectData.squareFootage} sq ft outdoor space into a beautiful, functional, and sustainable garden that harmonizes with your property's unique characteristics.

Design Philosophy:
Our approach focuses on creating a landscape that not only enhances the visual appeal of your property but also considers the practical aspects of maintenance, climate suitability, and long-term sustainability. We've carefully selected plants and materials that will thrive in your specific climate zone ${projectData.climateZone} and ${projectData.sunExposure} exposure conditions.

Plant Selection Strategy:
The plant palette has been thoughtfully curated to include a mix of evergreen and deciduous species that provide year-round interest while requiring minimal maintenance. We've incorporated native and climate-appropriate species that are well-suited to your region's growing conditions.

Hardscape Integration:
The hardscape elements have been designed to complement the natural landscape while providing functional spaces for outdoor living. We've used materials that are durable, weather-resistant, and aesthetically pleasing.

Maintenance Considerations:
This design prioritizes low-maintenance solutions while ensuring the landscape remains beautiful throughout the seasons. Plant selections include drought-tolerant species where appropriate, and the layout facilitates easy access for routine maintenance tasks.`;

    const generatedImages = [
      'https://via.placeholder.com/1024x1024?text=Generated+Design+1',
      'https://via.placeholder.com/1024x1024?text=Generated+Design+2',
      'https://via.placeholder.com/1024x1024?text=Generated+Design+3'
    ];

    // Parse materials list from AI response and extract costs
    const materialsList = parseMaterialsList(designThesis);
    const totalCost = materialsList.reduce((sum, material) => sum + material.totalPrice, 0);

    // Update project with generated content
    // Note: In a real implementation, you'd update the Firestore document here
    // For now, we'll return the complete project data

    const project = {
      id: projectDoc.id,
      userId: userId,
      name: projectData.name,
      description: projectData.notes,
      status: 'completed',
      originalImage: imageUrl,
      generatedImages,
      designThesis,
      materialsList,
      totalCost,
      climateZone: projectData.climateZone,
      sunExposure: projectData.sunExposure,
      squareFootage: projectData.squareFootage,
      designStyle: projectData.designStyle,
      budget: projectData.budget || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

function parseMaterialsList(designThesis: string): Material[] {
  // This is a simplified parser - in a real implementation, you'd want more sophisticated parsing
  const materials = [];
  
  // Extract common landscape materials and estimate costs
  const materialPatterns = [
    { name: 'Mulch', pattern: /mulch/gi, unitPrice: 3, quantity: '2 cubic yards' },
    { name: 'Topsoil', pattern: /topsoil/gi, unitPrice: 25, quantity: '1 cubic yard' },
    { name: 'Landscape Fabric', pattern: /fabric/gi, unitPrice: 0.5, quantity: '100 sq ft' },
    { name: 'Decorative Stones', pattern: /stone/gi, unitPrice: 150, quantity: '1 ton' },
    { name: 'Pavers', pattern: /paver/gi, unitPrice: 4, quantity: '1 sq ft' },
  ];

  materialPatterns.forEach(({ name, pattern, unitPrice, quantity }) => {
    if (pattern.test(designThesis)) {
      materials.push({
        name,
        quantity,
        unitPrice,
        totalPrice: unitPrice,
        category: (name.toLowerCase().includes('stone') || name.toLowerCase().includes('paver')) ? 'hardscape' as const : 'other' as const,
      });
    }
  });

  // Add some default plants if none were detected
  if (materials.length === 0) {
    materials.push(
      {
        name: 'Shrubs (Various)',
        quantity: '10 plants',
        unitPrice: 25,
        totalPrice: 250,
        category: 'plants' as const,
      },
      {
        name: 'Perennials (Various)',
        quantity: '20 plants',
        unitPrice: 15,
        totalPrice: 300,
        category: 'plants' as const,
      },
      {
        name: 'Mulch',
        quantity: '2 cubic yards',
        unitPrice: 3,
        totalPrice: 6,
        category: 'mulch' as const,
      }
    );
  }

  return materials;
} 