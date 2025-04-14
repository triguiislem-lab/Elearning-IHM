import { database } from '../../firebaseConfig';
import { ref, get, set, update, remove } from 'firebase/database';

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

/**
 * Archive an entity instead of deleting it
 * @param {string} path - Path to the entity collection
 * @param {string} id - ID of the entity to archive
 * @param {Object} additionalData - Additional data to store with the archived entity
 * @returns {Promise<boolean>} - Success status
 */
export const archiveEntity = async (path, id, additionalData = {}) => {
  try {
    if (!id) return false;

    // Get the current data
    const dataRef = ref(database, `${BASE_PATH}/${path}/${id}`);
    const snapshot = await get(dataRef);

    if (!snapshot.exists()) return false;

    const entityData = snapshot.val();

    // Update the entity with archived flag and timestamp
    await update(dataRef, {
      ...additionalData,
      archived: true,
      archivedAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error(`Error archiving entity at ${path}/${id}:`, error);
    return false;
  }
};

/**
 * Fetch data with option to include or exclude archived entities
 * @param {string} path - Path to the data
 * @param {boolean} includeArchived - Whether to include archived entities
 * @returns {Array} - Array of entities
 */
export const fetchDataWithArchiveFilter = async (path, includeArchived = false) => {
  const dataRef = ref(database, `${BASE_PATH}/${path}`);
  const snapshot = await get(dataRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    const entities = Array.isArray(data)
      ? data
      : Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));

    // Filter out archived entities if includeArchived is false
    return includeArchived
      ? entities
      : entities.filter(entity => !entity.archived);
  }
  return [];
};

/**
 * Restore a previously archived entity
 * @param {string} path - Path to the entity collection
 * @param {string} id - ID of the entity to restore
 * @param {Object} additionalData - Additional data to store with the restored entity
 * @returns {Promise<boolean>} - Success status
 */
export const restoreEntity = async (path, id, additionalData = {}) => {
  try {
    if (!id) return false;

    // Get the current data
    const dataRef = ref(database, `${BASE_PATH}/${path}/${id}`);
    const snapshot = await get(dataRef);

    if (!snapshot.exists()) return false;

    const entityData = snapshot.val();

    // Make sure the entity is archived
    if (!entityData.archived) {
      console.warn(`Entity at ${path}/${id} is not archived, cannot restore`);
      return false;
    }

    // Create update object that removes archive flags and adds restoration data
    const updateData = {
      ...additionalData,
      archived: false,
      restoredAt: new Date().toISOString()
    };

    // If there are archive-specific fields, remove them
    if (entityData.archivedAt) updateData.archivedAt = null;
    if (entityData.archivedBy) updateData.archivedBy = null;
    if (entityData.archivedReason) updateData.archivedReason = null;

    // Update the entity
    await update(dataRef, updateData);

    return true;
  } catch (error) {
    console.error(`Error restoring entity at ${path}/${id}:`, error);
    return false;
  }
};