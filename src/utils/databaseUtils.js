import { database } from '../../firebaseConfig';
import { ref, get, set, update } from 'firebase/database';

const BASE_PATH = '/elearning';

export const fetchData = async (path) => {
  const dataRef = ref(database, `${BASE_PATH}/${path}`);
  const snapshot = await get(dataRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    return Array.isArray(data) ? data : Object.entries(data).map(([id, value]) => ({
      id,
      ...value
    }));
  }
  return [];
};

export const updateData = async (path, data) => {
  const dataRef = ref(database, `${BASE_PATH}/${path}`);
  await update(dataRef, data);
};

export const setData = async (path, data) => {
  const dataRef = ref(database, `${BASE_PATH}/${path}`);
  await set(dataRef, data);
};

export const fetchDataById = async (path, id) => {
  if (!id) return null;
  
  const dataRef = ref(database, `${BASE_PATH}/${path}/${id}`);
  const snapshot = await get(dataRef);

  if (snapshot.exists()) {
    return {
      id,
      ...snapshot.val()
    };
  }
  
  return null;
};
