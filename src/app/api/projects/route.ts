import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { db } from '@/lib/firebase';
import OpenAI from 'openai';
import { Material } from '@/types/project';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  console.log('Initializing Firebase Admin SDK...');
  console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing required Firebase Admin SDK environment variables');
  }
  
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  console.log('Firebase Admin SDK initialized successfully');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to download and store images permanently
async function downloadAndStoreImages(imageUrls: string[], userId: string, projectId: string): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) {
    console.log('No images to download and store');
    return [];
  }

  const adminStorage = getStorage();
  const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET!);
  const storedUrls: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const imageUrl = imageUrls[i];
      if (!imageUrl) {
        console.warn(`Skipping empty image URL at index ${i}`);
        continue;
      }

      console.log(`Downloading image ${i + 1}/${imageUrls.length}:`, imageUrl);
      
      // Download the image from OpenAI
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      
      const imageBuffer = await response.arrayBuffer();
      const fileName = `projects/${userId}/${projectId}/generated_${Date.now()}_${i}.png`;
      
      console.log('Storing image as:', fileName);
      const file = bucket.file(fileName);
      await file.save(Buffer.from(imageBuffer), {
        metadata: {
          contentType: 'image/png',
        },
      });
      
      // Make the file publicly accessible
      await file.makePublic();
      const storedUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
      storedUrls.push(storedUrl);
      
      console.log('Image stored successfully:', storedUrl);
    } catch (error) {
      console.error(`Error downloading/storing image ${i + 1}:`, error);
      // If we can't store the image, keep the original URL as fallback
      storedUrls.push(imageUrls[i]);
    }
  }

  return storedUrls;
}

export async function GET() {
  try {
    // Get the user session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.email;
    
    // Query projects for the current user, ordered by creation date (newest first)
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(projectsQuery);
    const projects = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      };
    });
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: `Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.FIREBASE_STORAGE_BUCKET) {
      console.error('FIREBASE_STORAGE_BUCKET environment variable is not set');
      return NextResponse.json({ error: 'Firebase storage bucket not configured' }, { status: 500 });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
    console.log('Using storage bucket:', process.env.FIREBASE_STORAGE_BUCKET);
    
    // Get the user session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Use the user's email as the userId for now
    // In a production app, you might want to use a proper user ID from your database
    const userId = session.user.email;
    
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type');
    
    let projectData: {
      name: string;
      climateZone: string;
      squareFootage: number;
      notes?: string;
      sunExposure?: string;
      designStyle?: string;
      budget?: number;
    };
    let imageFile: File | null = null;
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('Processing multipart/form-data request');
      const formData = await request.formData();
      const dataString = formData.get('data') as string;
      console.log('Received data string:', dataString);
      
      if (!dataString) {
        return NextResponse.json({ error: 'No data field found in form data' }, { status: 400 });
      }
      
      try {
        projectData = JSON.parse(dataString);
        console.log('Parsed project data:', projectData);
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return NextResponse.json({ error: 'Invalid JSON in data field' }, { status: 400 });
      }
      
      imageFile = formData.get('image') as File;
      console.log('Image file received:', imageFile ? imageFile.name : 'No image');
    } else if (contentType?.includes('application/json')) {
      // For testing purposes, accept JSON data
      const jsonData = await request.json();
      projectData = jsonData;
      imageFile = null; // No image in JSON request
    } else {
      console.log('Unsupported content type:', contentType);
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (!projectData) {
      return NextResponse.json({ error: 'Project data is required' }, { status: 400 });
    }

    // Validate required project data
    if (!projectData.name || !projectData.climateZone || !projectData.squareFootage) {
      return NextResponse.json({ error: 'Missing required project data: name, climateZone, and squareFootage are required' }, { status: 400 });
    }

    // Handle image upload if provided
    let imageUrl = '';
    if (imageFile) {
      try {
        // Upload image to Firebase Storage using Admin SDK
        console.log('Storage bucket:', process.env.FIREBASE_STORAGE_BUCKET);
        const adminStorage = getStorage();
        const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET!);
        const imageBuffer = await imageFile.arrayBuffer();
        const fileName = `projects/${userId}/${Date.now()}_${imageFile.name}`;
        
        console.log('Uploading file:', fileName);
        const file = bucket.file(fileName);
        await file.save(Buffer.from(imageBuffer), {
          metadata: {
            contentType: imageFile.type,
          },
        });
        
        console.log('File uploaded successfully, making public...');
        // Make the file publicly accessible and get the URL
        await file.makePublic();
        imageUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
        console.log('Image URL:', imageUrl);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image to Firebase Storage' }, { status: 500 });
      }
    }

    // Create project document in Firestore
    const projectDoc = await addDoc(collection(db, 'projects'), {
      userId: userId,
      name: projectData.name,
      description: projectData.notes || '',
      status: 'draft',
      originalImage: imageUrl,
      climateZone: projectData.climateZone,
      sunExposure: projectData.sunExposure || 'full-sun',
      squareFootage: projectData.squareFootage,
      designStyle: projectData.designStyle || 'modern',
      budget: projectData.budget || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('Project document created with ID:', projectDoc.id);

    // Generate AI content with enhanced prompts
    const designPrompt = `Create a comprehensive, professional landscape design proposal for a ${projectData.squareFootage} square foot area with ${projectData.sunExposure} exposure in climate zone ${projectData.climateZone}. The design style should be ${projectData.designStyle}. ${projectData.notes ? `Additional requirements: ${projectData.notes}` : ''}

Please provide a detailed response that includes:

1. **Design Philosophy**: Explain the overall design approach and how it addresses the specific site conditions
2. **Plant Selection Strategy**: Detail the plant choices, including specific species that thrive in this climate zone and sun exposure
3. **Hardscape Elements**: Describe any pathways, patios, retaining walls, or other structural elements
4. **Materials List**: Provide a comprehensive list of materials with quantities and estimated costs
5. **Maintenance Recommendations**: Include care instructions for the selected plants and hardscape elements
6. **Seasonal Considerations**: Address how the design will look and function throughout the year

Make the response sound professional and authoritative, as if written by a landscape designer with 20+ years of experience. Focus on practical, implementable solutions that will create a beautiful, functional, and sustainable landscape.`;

    const imagePrompt = `Professional landscape design rendering of a ${projectData.designStyle} style garden for a ${projectData.squareFootage} square foot area with ${projectData.sunExposure} exposure in climate zone ${projectData.climateZone}. 

Include:
- Appropriate plants and trees for this climate and sun exposure
- Hardscaping elements like pathways, patios, or retaining walls
- Proper scale and perspective
- Natural lighting and shadows
- Professional landscape design visualization quality
- Realistic materials and textures

Style: High quality, photorealistic, professional landscape design rendering that looks like it was created by an experienced landscape architect.`;

    console.log('Generating AI content...');
    
    const [designResponse, imageResponse] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced landscape designer with over 20 years of experience creating professional proposals. Provide detailed, practical advice that sounds authoritative and knowledgeable. Focus on creating beautiful, functional, and sustainable landscapes that work with the specific site conditions.',
          },
          {
            role: 'user',
            content: designPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
      openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    ]);

    const designThesis = designResponse.choices[0]?.message?.content || '';
    const generatedImages = imageResponse.data?.map(img => img.url || '') || [];

    console.log('AI content generated successfully');
    console.log('Design thesis length:', designThesis.length);
    console.log('Generated images count:', generatedImages.length);

    // Parse materials list from AI response and extract costs
    const materialsList = parseMaterialsList(designThesis);
    const totalCost = materialsList.reduce((sum, material) => sum + material.totalPrice, 0);

    console.log('Materials parsed:', materialsList.length, 'items');
    console.log('Total cost calculated:', totalCost);

    // Download and store generated images permanently
    const storedGeneratedImages = await downloadAndStoreImages(generatedImages, userId, projectDoc.id);

    // Update project document with generated content and permanently stored images
    await updateDoc(doc(db, 'projects', projectDoc.id), {
      status: 'completed',
      generatedImages: storedGeneratedImages,
      designThesis,
      materialsList,
      totalCost,
      updatedAt: serverTimestamp(),
    });

    console.log('Project updated with generated content and permanently stored images');

    // Return the complete project data
    const project = {
      id: projectDoc.id,
      userId: userId,
      name: projectData.name,
      description: projectData.notes || '',
      status: 'completed',
      originalImage: imageUrl,
      generatedImages: storedGeneratedImages,
      designThesis,
      materialsList,
      totalCost,
      climateZone: projectData.climateZone,
      sunExposure: projectData.sunExposure || 'full-sun',
      squareFootage: projectData.squareFootage,
      designStyle: projectData.designStyle || 'modern',
      budget: projectData.budget || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Project creation completed successfully');
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Bucket name not specified') || error.message.includes('storageBucket')) {
        return NextResponse.json(
          { error: 'Firebase Storage bucket not configured. Please check FIREBASE_STORAGE_BUCKET environment variable.' },
          { status: 500 }
        );
      }
      if (error.message.includes('Firebase')) {
        return NextResponse.json(
          { error: 'Firebase configuration error. Please check your environment variables.' },
          { status: 500 }
        );
      }
      if (error.message.includes('OpenAI')) {
        return NextResponse.json(
          { error: 'OpenAI API error. Please check your API key and billing.' },
          { status: 500 }
        );
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Authentication error. Please sign in again.' },
          { status: 401 }
        );
      }
      if (error.message.includes('Missing required Firebase Admin SDK')) {
        return NextResponse.json(
          { error: 'Firebase Admin SDK not properly configured. Please check your environment variables.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function parseMaterialsList(designThesis: string): Material[] {
  // Enhanced parser for better material extraction
  const materials = [];
  
  // Extract common landscape materials and estimate costs
  const materialPatterns = [
    { name: 'Mulch', pattern: /mulch/gi, unitPrice: 3, quantity: '2 cubic yards', category: 'mulch' as const },
    { name: 'Topsoil', pattern: /topsoil/gi, unitPrice: 25, quantity: '1 cubic yard', category: 'other' as const },
    { name: 'Landscape Fabric', pattern: /fabric/gi, unitPrice: 0.5, quantity: '100 sq ft', category: 'other' as const },
    { name: 'Decorative Stones', pattern: /stone/gi, unitPrice: 150, quantity: '1 ton', category: 'hardscape' as const },
    { name: 'Pavers', pattern: /paver/gi, unitPrice: 4, quantity: '1 sq ft', category: 'hardscape' as const },
    { name: 'Concrete', pattern: /concrete/gi, unitPrice: 120, quantity: '1 cubic yard', category: 'hardscape' as const },
    { name: 'Gravel', pattern: /gravel/gi, unitPrice: 45, quantity: '1 ton', category: 'hardscape' as const },
    { name: 'Shrubs', pattern: /shrub/gi, unitPrice: 25, quantity: '10 plants', category: 'plants' as const },
    { name: 'Perennials', pattern: /perennial/gi, unitPrice: 15, quantity: '20 plants', category: 'plants' as const },
    { name: 'Trees', pattern: /tree/gi, unitPrice: 150, quantity: '3 trees', category: 'plants' as const },
    { name: 'Annuals', pattern: /annual/gi, unitPrice: 8, quantity: '30 plants', category: 'plants' as const },
    { name: 'Grass Seed', pattern: /grass/gi, unitPrice: 25, quantity: '5 lbs', category: 'plants' as const },
  ];

  materialPatterns.forEach(({ name, pattern, unitPrice, quantity, category }) => {
    if (pattern.test(designThesis)) {
      materials.push({
        name,
        quantity,
        unitPrice,
        totalPrice: unitPrice,
        category,
      });
    }
  });

  // Add some default materials if none were detected
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