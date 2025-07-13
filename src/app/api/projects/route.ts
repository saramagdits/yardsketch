import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
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

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.FIREBASE_STORAGE_BUCKET) {
      console.error('FIREBASE_STORAGE_BUCKET environment variable is not set');
      return NextResponse.json({ error: 'Firebase storage bucket not configured' }, { status: 500 });
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
    
    let projectData: any;
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

    // Handle image upload if provided
    let imageUrl = '';
    if (imageFile) {
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
    }

    // Create project document in Firestore
    const projectDoc = await addDoc(collection(db, 'projects'), {
      userId: userId,
      name: projectData.name,
      description: projectData.notes,
      status: 'draft',
      originalImage: imageUrl,
      climateZone: projectData.climateZone,
      sunExposure: projectData.sunExposure,
      squareFootage: projectData.squareFootage,
      designStyle: projectData.designStyle,
      budget: projectData.budget || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Generate AI content
    const designPrompt = `Create a professional landscape design proposal for a ${projectData.squareFootage} sq ft area with ${projectData.sunExposure} exposure in climate zone ${projectData.climateZone}. The design style should be ${projectData.designStyle}. ${projectData.notes ? `Additional requirements: ${projectData.notes}` : ''}

Please provide:
1. A detailed design thesis explaining the design approach and plant selections
2. A comprehensive materials list with quantities and estimated costs
3. Design recommendations for this specific climate and sun exposure

Make it sound professional and experienced, as if written by a landscape designer with 20+ years of experience.`;

    const [designResponse, imageResponse] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced landscape designer creating professional proposals. Provide detailed, practical advice that sounds authoritative and knowledgeable.',
          },
          {
            role: 'user',
            content: designPrompt,
          },
        ],
        max_tokens: 1500,
      }),
      openai.images.generate({
        model: 'dall-e-3',
        prompt: `Professional landscape design rendering of a ${projectData.designStyle} style garden for a ${projectData.squareFootage} sq ft area with ${projectData.sunExposure} exposure. Include appropriate plants, hardscaping, and design elements. High quality, photorealistic, professional landscape design visualization.`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    ]);

    const designThesis = designResponse.choices[0]?.message?.content || '';
    const generatedImages = imageResponse.data?.map(img => img.url || '') || [];

    // Parse materials list from AI response and extract costs
    const materialsList = parseMaterialsList(designThesis);
    const totalCost = materialsList.reduce((sum, material) => sum + material.totalPrice, 0);

    // Update project document with generated content
    await updateDoc(doc(db, 'projects', projectDoc.id), {
      status: 'completed',
      generatedImages,
      designThesis,
      materialsList,
      totalCost,
      updatedAt: serverTimestamp(),
    });

    // Update project with generated content
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