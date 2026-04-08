// Status color mapping
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'graded':
      return 'success';
    case 'submitted':
      return 'warning';
    case 'late':
      return 'error';
    default:
      return 'default';
  }
};

// Score color based on percentage
export const getScoreColor = (score, maxScore) => {
  if (!maxScore || maxScore <= 0) return 'default';
  const percentage = (score / maxScore) * 100;
  if (percentage >= 85) return 'success';
  if (percentage >= 70) return 'primary';
  if (percentage >= 50) return 'warning';
  return 'error';
};

// Grade label mapping
export const getStatusLabel = (status) => {
  switch (status?.toLowerCase()) {
    case 'graded':
      return 'Đã chấm';
    case 'submitted':
      return 'Đã nộp';
    case 'late':
      return 'Nộp muộn';
    case 'pending':
      return 'Chờ chấm';
    default:
      return status || 'Không xác định';
  }
};

// Calculate grading statistics
export const calculateGradingStats = (submissions = []) => {
  const total = submissions.length;
  const graded = submissions.filter(s => s.status?.toLowerCase() === 'graded').length;
  const pending = total - graded;
  
  const scores = submissions
    .filter(s => s.score !== null && s.score !== undefined)
    .map(s => s.score);
    
  const averageScore = scores.length > 0 
    ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
    : 0;

  return {
    total,
    graded,
    pending,
    averageScore,
  };
};

// Format date for display
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

// Format date only
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
};

// Download file helper
export const downloadFile = async (downloadFn, submissionId, originalFileName) => {
  try {
    const response = await downloadFn(submissionId);
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = downloadUrl;
    link.download = originalFileName || 'download';
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// Validate score input
export const validateScore = (score, maxScore) => {
  const numScore = parseFloat(score);
  const numMaxScore = parseFloat(maxScore) || 100;
  
  if (isNaN(numScore)) {
    return { valid: false, error: 'Điểm phải là số' };
  }
  
  if (numScore < 0) {
    return { valid: false, error: 'Điểm không thể âm' };
  }
  
  if (numScore > numMaxScore) {
    return { valid: false, error: `Điểm không thể vượt quá ${numMaxScore}` };
  }
  
  return { valid: true, score: numScore };
};
