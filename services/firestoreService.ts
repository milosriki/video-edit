import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

// Example: Save a video project
export const saveVideoProject = async (userId: string, projectData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'projects'), {
      userId,
      ...projectData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Project saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving project:', error);
    throw error;
  }
};

// Example: Get user's projects
export const getUserProjects = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error getting projects:', error);
    throw error;
  }
};

// Example: Update a project
export const updateProject = async (projectId: string, updates: any) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('✅ Project updated');
  } catch (error) {
    console.error('❌ Error updating project:', error);
    throw error;
  }
};

// Example: Delete a project
export const deleteProject = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    console.log('✅ Project deleted');
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    throw error;
  }
};

// Example: Save analytics data
export const saveAnalytics = async (analyticsData: any) => {
  try {
    await addDoc(collection(db, 'analytics'), {
      ...analyticsData,
      timestamp: Timestamp.now()
    });
    console.log('✅ Analytics saved');
  } catch (error) {
    console.error('❌ Error saving analytics:', error);
    throw error;
  }
};

// Example: Create user profile
export const createUserProfile = async (userId: string, profileData: any) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      createdAt: Timestamp.now()
    });
    console.log('✅ User profile created');
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
};
