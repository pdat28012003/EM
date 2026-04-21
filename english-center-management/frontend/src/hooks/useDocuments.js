import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook quản lý loading states cho async operations
 * @param {Object} options
 * @param {number} options.debounceDelay - Thời gian debounce (ms)
 */
export const useAsyncLoading = (options = {}) => {
  const { debounceDelay = 500 } = options;
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const abortControllerRef = useRef(null);

  const startLoading = useCallback((isFirstLoad = false) => {
    if (isFirstLoad) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
  }, []);

  const stopLoading = useCallback((isFirstLoad = false) => {
    if (isFirstLoad) {
      setInitialLoading(false);
    }
    setLoading(false);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const getAbortSignal = useCallback(() => {
    cancelRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return controller.signal;
  }, [cancelRequest]);

  useEffect(() => {
    return () => cancelRequest();
  }, [cancelRequest]);

  return {
    initialLoading,
    loading,
    data,
    setData,
    startLoading,
    stopLoading,
    cancelRequest,
    getAbortSignal,
    useDebounce: (value) => useDebounce(value, debounceDelay)
  };
};

/**
 * Hook quản lý documents cho teacher
 * @param {Object} options
 * @param {Function} options.fetchApi - API function để fetch data
 * @param {string} options.teacherId - ID của teacher
 * @param {Object} options.filters - Các filter hiện tại
 */
export const useTeacherDocuments = (options = {}) => {
  const { fetchApi, teacherId, filters = {} } = options;
  const { 
    initialLoading, 
    loading, 
    data: documents, 
    setData: setDocuments,
    startLoading, 
    stopLoading, 
    getAbortSignal,
    useDebounce 
  } = useAsyncLoading({ debounceDelay: 500 });

  const { search = '', type = 'all', curriculumId = 'all', date = null } = filters;
  const debouncedSearch = useDebounce(search);

  const loadDocuments = useCallback(async () => {
    if (!teacherId || !fetchApi) return;

    const signal = getAbortSignal();
    const isFirstLoad = initialLoading;
    
    startLoading(isFirstLoad);

    try {
      const params = {
        search: debouncedSearch,
        type: type !== 'all' ? type : undefined,
        curriculumId: curriculumId !== 'all' ? curriculumId : undefined,
        date: date ? date.format('YYYY-MM-DD') : undefined
      };

      const response = await fetchApi(teacherId, params, { signal });
      const rawData = response.data?.data || response.data || [];
      
      // Normalize documents
      const normalized = rawData.map(doc => ({
        ...doc,
        id: doc.documentId ?? doc.DocumentId ?? doc.id
      }));
      
      setDocuments(normalized);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      stopLoading(isFirstLoad);
    }
  }, [teacherId, fetchApi, debouncedSearch, type, curriculumId, date, startLoading, stopLoading, getAbortSignal, setDocuments, initialLoading]);

  useEffect(() => {
    if (teacherId) {
      loadDocuments();
    }
  }, [teacherId, loadDocuments]);

  return {
    documents,
    initialLoading,
    loading,
    loadDocuments
  };
};

export default useAsyncLoading;
