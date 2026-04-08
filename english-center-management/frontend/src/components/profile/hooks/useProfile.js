import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, uploadAPI } from '../../../services/api';

const UPLOAD_URL = process.env.REACT_APP_API_URL?.replace('/api', '') + '/upload' || 'http://localhost:5000/upload';
const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Load profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const apiData = response.data?.data || response.data;
        
        setUser(apiData);
        setFormData({
          fullName: apiData.fullName || '',
          email: apiData.email || '',
          phoneNumber: apiData.phoneNumber || ''
        });
        setAvatarPreview(apiData.avatar || '');
        localStorage.setItem('user', JSON.stringify(apiData));
      } catch (error) {
        // Fallback to localStorage if API fails
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setFormData({
            fullName: parsedUser.fullName || '',
            email: parsedUser.email || '',
            phoneNumber: parsedUser.phoneNumber || ''
          });
          setAvatarPreview(parsedUser.avatar || '');
        } else {
          navigate('/login');
        }
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const updateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data?.data || response.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      
      setSuccess('Cập nhật thông tin thành công!');
      return true;
    } catch (err) {
      setError('Cập nhật thông tin thất bại. Vui lòng thử lại.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;

    setUploading(true);
    setError('');
    
    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await uploadAPI.uploadAvatar(uploadFormData);
      const uploadResult = uploadResponse.data;
      const avatarUrl = uploadResult.url || uploadResult.data?.url;
      const fullAvatarUrl = avatarUrl && !avatarUrl.startsWith('http') 
        ? `${BASE_URL}${avatarUrl}`
        : avatarUrl;
      
      await authAPI.updateProfile({ avatar: fullAvatarUrl });
      
      // Update user state directly instead of calling API again
      setUser(prev => ({ ...prev, avatar: fullAvatarUrl }));
      setAvatarPreview(fullAvatarUrl);
      localStorage.setItem('user', JSON.stringify({ ...user, avatar: fullAvatarUrl }));
      
      window.dispatchEvent(new CustomEvent('userUpdated', { 
        detail: { ...user, avatar: fullAvatarUrl } 
      }));
      
      setSuccess('Cập nhật avatar thành công!');
      return true;
    } catch (err) {
      setError('Cập nhật avatar thất bại. Vui lòng thử lại.');
      // Reset to original avatar on error
      setAvatarPreview(user?.avatar || '');
      return false;
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return {
    user,
    formData,
    setFormData,
    loading,
    uploading,
    avatarPreview,
    error,
    success,
    fileInputRef,
    setError,
    setSuccess,
    handleInputChange,
    updateProfile,
    uploadAvatar
  };
};
