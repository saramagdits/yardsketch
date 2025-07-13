import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Project } from '@/types/project';

export async function getRecentProjects(userId: string, limitCount: number = 6): Promise<Project[]> {
  try {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(projectsQuery);
    const projects = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Project;
    });
    
    return projects;
  } catch (error) {
    console.error('Error fetching recent projects:', error);
    throw new Error(`Failed to fetch recent projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 