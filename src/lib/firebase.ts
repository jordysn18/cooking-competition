import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBxeeBPOm-CMXQJMFIgKdAFKGFf6p8UI4E",
  authDomain: "cooking-wheel.firebaseapp.com",
  projectId: "cooking-wheel",
  storageBucket: "cooking-wheel.firebasestorage.app",
  messagingSenderId: "418212959518",
  appId: "1:418212959518:web:ba2b5e76b8b65b83afe50f",
  databaseURL: "https://cooking-wheel-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export const toggleWheelStatus = async (isActive: boolean) => {
  try {
    await set(ref(database, 'wheelStatus'), {
      isActive,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error toggling wheel status:', error);
    return false;
  }
};

export const getWheelStatus = async () => {
  try {
    const snapshot = await get(ref(database, 'wheelStatus'));
    return snapshot.val()?.isActive || false;
  } catch (error) {
    console.error('Error getting wheel status:', error);
    return false;
  }
};

export const addCategory = async (name: string) => {
  try {
    const newCategoryRef = ref(database, `categories/${name.toLowerCase()}`);
    await set(newCategoryRef, {
      name,
      createdAt: new Date().toISOString(),
      active: true
    });
    alert('Categoría agregada exitosamente');
    return true;
  } catch (error) {
    console.error('Error adding category:', error);
    alert('Error al agregar la categoría');
    return false;
  }
};

export const getCategories = async () => {
  try {
    const categoriesRef = ref(database, 'categories');
    const snapshot = await get(categoriesRef);
    return snapshot.val() || {};
  } catch (error) {
    console.error('Error getting categories:', error);
    return {};
  }
};

export const getRegisteredUsers = async () => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    return snapshot.val() || {};
  } catch (error) {
    console.error('Error getting users:', error);
    return {};
  }
};

export const getRounds = async () => {
  try {
    const roundsRef = ref(database, 'rounds');
    const snapshot = await get(roundsRef);
    return snapshot.val() || {};
  } catch (error) {
    console.error('Error getting rounds:', error);
    return {};
  }
};

export const createNewRound = async (date: string, participants: { [key: string]: any }, categoryId: string) => {
  try {
    const roundRef = ref(database, 'rounds');
    const newRoundRef = push(roundRef);

    const participantIds = Object.keys(participants);

    await set(newRoundRef, {
      date,
      categoryId,
      status: 'pending',
      participants,
      currentTurn: participantIds[0], // El primer participante empieza
      turnOrder: participantIds, // Orden de los turnos
      createdAt: new Date().toISOString()
    });

    alert('Ronda creada exitosamente');
    return newRoundRef.key;
  } catch (error) {
    console.error('Error creating round:', error);
    alert('Error al crear la ronda');
    return null;
  }
};

export const deleteRound = async (roundId: string) => {
  try {
    await set(ref(database, `rounds/${roundId}`), null);
    alert('Ronda eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('Error deleting round:', error);
    alert('Error al eliminar la ronda');
    return false;
  }
};

export const moveToNextTurn = async (roundId: string, currentTurn: string, turnOrder: string[]) => {
  try {
    const currentIndex = turnOrder.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextTurn = turnOrder[nextIndex];

    await update(ref(database, `rounds/${roundId}`), {
      currentTurn: nextTurn
    });
    return true;
  } catch (error) {
    console.error('Error moving to next turn:', error);
    return false;
  }
};

export const addDish = async (dishData: {
  name: string;
  categoryId: string;
  description?: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
  active: boolean;
}) => {
  try {
    const dishId = dishData.name.toLowerCase().replace(/\s+/g, '-');
    await set(ref(database, `dishes/${dishId}`), {
      ...dishData,
      createdAt: new Date().toISOString()
    });
    alert('Platillo agregado exitosamente');
    return true;
  } catch (error) {
    console.error('Error adding dish:', error);
    alert('Error al agregar el platillo');
    return false;
  }
};

export const getDishes = async () => {
  try {
    const dishesRef = ref(database, 'dishes');
    const snapshot = await get(dishesRef);
    return snapshot.val() || {};
  } catch (error) {
    console.error('Error getting dishes:', error);
    return {};
  }
};

export const deleteDish = async (dishId: string) => {
  try {
    await set(ref(database, `dishes/${dishId}`), null);
    alert('Platillo eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('Error deleting dish:', error);
    alert('Error al eliminar el platillo');
    return false;
  }
};

export const deleteCategory = async (categoryId: string) => {
  try {
    await set(ref(database, `categories/${categoryId}`), null);
    alert('Categoría eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('Error al eliminar la categoría');
    return false;
  }
};

export { auth, database };