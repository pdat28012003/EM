/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Paper,
  Radio,
  Stack,
  Typography,
  CircularProgress,
  FormControlLabel,
  RadioGroup,
  Chip,
} from '@mui/material';
import { ArrowBack, Save, Upload, AttachFile } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { assignmentsAPI, authAPI, studentsAPI, uploadAPI } from '../../../services/api';
import { useCallback, useRef } from 'react';
import JoditEditor from 'jodit-react';
import 'jodit/es2021/jodit.min.css';

const StudentAssignmentDetail = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [content, setContent] = useState('');
  const [answers, setAnswers] = useState({}); // questionId -> answerId
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const numericAssignmentId = useMemo(() => Number(assignmentId), [assignmentId]);

  const exitFullscreenSafe = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = localStorage.getItem('user');
        if (!userData) {
          setError('Vui lòng đăng nhập để xem bài tập.');
          return;
        }
        const user = JSON.parse(userData);

        let sId = user.studentId;
        const email = user.email;

        if (!sId) {
          try {
            const profileRes = await authAPI.getProfile();
            const profile = profileRes.data?.data || profileRes.data;
            sId = profile?.studentId;
            if (sId) localStorage.setItem('user', JSON.stringify({ ...user, studentId: sId }));
          } catch (e) {
            // ignore
          }
        }

        if (!sId && email) {
          try {
            const studentsRes = await studentsAPI.getAll({ search: email, page: 1, pageSize: 10, isActive: true });
            const paged = studentsRes.data?.data || studentsRes.data;
            const list = paged?.data || paged || [];
            const normalized = Array.isArray(list) ? list : [];
            const matched =
              normalized.find((s) => String(s.email || '').toLowerCase() === String(email).toLowerCase()) || normalized[0];
            if (matched?.studentId) {
              sId = matched.studentId;
              localStorage.setItem('user', JSON.stringify({ ...user, studentId: sId }));
            }
          } catch (e) {
            // ignore
          }
        }

        if (!sId) {
          setError('Không tìm thấy thông tin học viên. Vui lòng liên hệ Admin.');
          return;
        }
        setStudentId(sId);

        const res = await assignmentsAPI.getById(numericAssignmentId);
        setAssignment(res.data);

        if (String(res.data?.type || '').toLowerCase() === 'quiz') {
          // If already submitted: fetch result and lock
          try {
            const resultRes = await assignmentsAPI.getQuizResult(numericAssignmentId, { studentId: sId });
            setQuizResult(resultRes.data);
          } catch (e) {
            // ignore 404 - not submitted yet
          }

          const qRes = await assignmentsAPI.getQuizQuestions(numericAssignmentId);
          setQuestions(Array.isArray(qRes.data) ? qRes.data : []);
        } else {
          // For regular assignments, check if already submitted
          try {
            const subRes = await assignmentsAPI.getMySubmission(numericAssignmentId, sId);
            setSubmission(subRes.data);
            // Pre-fill content if exists
            if (subRes.data?.content) {
              setContent(subRes.data.content);
            }
          } catch (e) {
            // ignore 404 - not submitted yet
          }
          setQuestions([]);
        }
      } catch (err) {
        console.error('Error loading assignment detail:', err);
        setError('Không thể tải chi tiết bài tập. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(numericAssignmentId) && numericAssignmentId > 0) load();
    else setError('AssignmentId không hợp lệ.');
  }, [numericAssignmentId]);

  useEffect(() => {
    if (!assignment || String(assignment.type || '').toLowerCase() !== 'quiz') return;
    if (quizResult) return; // already submitted -> no timer

    setElapsedSeconds(0);
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [assignment, quizResult]);

  const formatDuration = (totalSeconds) => {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Use a ref for answers to avoid stale closure in event listeners
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const handleSubmit = useCallback(async (note) => {
    if (!studentId || !numericAssignmentId) return;

    if (String(assignment?.type || '').toLowerCase() === 'quiz') {
      if (quizResult) return;
      
      // No alert here if called from fullscreen exit to avoid blocking the submission
      try {
        setSaving(true);
        setError(null);
        const payload = {
          studentId,
          timeSpentSeconds: elapsedSeconds,
          answers: questions.map((q) => ({
            questionId: q.questionId,
            selectedAnswerId: answersRef.current[q.questionId] || null,
            textAnswer: null,
          })),
          note: note || null
        };
        const res = await assignmentsAPI.submitQuiz(numericAssignmentId, payload);
        setQuizResult(res.data);
        await exitFullscreenSafe();
      } catch (err) {
        console.error('Error submitting quiz:', err);
        if (err.response?.status === 409) {
          try {
            const resultRes = await assignmentsAPI.getQuizResult(numericAssignmentId, { studentId });
            setQuizResult(resultRes.data);
            await exitFullscreenSafe();
          } catch (e) {}
        }
        setError(err.response?.data?.message || 'Không thể nộp Quiz. Vui lòng thử lại.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!content.trim() && !selectedFile) {
      setError('Vui lòng nhập nội dung bài làm hoặc đính kèm file trước khi nộp.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Upload file nếu có
      let uploadedUrl = null;
      let originalFileName = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        console.log('Uploading file:', selectedFile.name);
        const uploadRes = await uploadAPI.uploadSubmission(formData);
        console.log('Upload response:', uploadRes.data);
        uploadedUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
        originalFileName = uploadRes.data?.fileName || uploadRes.data?.data?.fileName || selectedFile.name;
        console.log('Extracted URL:', uploadedUrl);
        console.log('Original filename:', originalFileName);
      }
      
      await assignmentsAPI.createSubmission(numericAssignmentId, {
        studentId,
        content,
        attachmentUrl: uploadedUrl,
        originalFileName: originalFileName,
      });
      // Fetch submission to show result
      const subRes = await assignmentsAPI.getMySubmission(numericAssignmentId, studentId);
      setSubmission(subRes.data);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError(err.response?.data?.message || 'Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [studentId, numericAssignmentId, assignment, quizResult, questions, elapsedSeconds, content, selectedFile, navigate]);

  // Fullscreen enforcement
  useEffect(() => {
    if (!assignment || String(assignment.type || '').toLowerCase() !== 'quiz' || quizResult || loading) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !quizResult) {
        // Only trigger if we are not already in the middle of submission
        // We use a small delay to ensure quizResult state didn't change just a millisecond ago
        setTimeout(() => {
          if (!document.fullscreenElement && !quizResult) {
            handleSubmit('Thoát chế độ toàn màn hình');
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [assignment, quizResult, loading, handleSubmit]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={async () => {
            await exitFullscreenSafe();
            navigate(-1);
          }}
        >
          Quay lại
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>
          {assignment?.title || 'Bài tập'}
        </Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>{assignment?.description}</Typography>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Lớp: <strong>{assignment?.className || 'N/A'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Hạn nộp: <strong>{assignment?.dueDate ? dayjs(assignment.dueDate).format('DD/MM/YYYY HH:mm') : 'N/A'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loại: <strong>{assignment?.type || 'N/A'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Điểm tối đa: <strong>{assignment?.maxScore ?? 'N/A'}</strong>
          </Typography>
          {assignment?.skillName && (
            <Chip
              label={assignment.skillName}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Stack>

        {String(assignment?.type || '').toLowerCase() === 'quiz' && !quizResult && !document.fullscreenElement && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'error.lighter', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
            <Typography variant="body2" color="error.main" fontWeight="bold" gutterBottom>
              ⚠️ Chế độ thi nghiêm ngặt:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Bạn phải ở chế độ toàn màn hình (Fullscreen) để làm bài. Nếu thoát Fullscreen, bài thi sẽ tự động được nộp ngay lập tức.
            </Typography>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => document.documentElement.requestFullscreen()}
            >
              Vào chế độ Fullscreen để tiếp tục
            </Button>
          </Box>
        )}
      </Paper>

      {String(assignment?.type || '').toLowerCase() === 'quiz' ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Làm Quiz
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Thời gian làm bài: <strong>{quizResult ? formatDuration(quizResult.timeSpentSeconds) : formatDuration(elapsedSeconds)}</strong>
          </Typography>
          
          {(!document.fullscreenElement && !quizResult) ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Đang chờ kích hoạt Fullscreen...
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Vui lòng nhấn nút "Vào chế độ Fullscreen" ở phía trên để bắt đầu làm bài.
              </Typography>
            </Box>
          ) : questions.length === 0 ? (
            <Alert severity="info">Quiz này chưa có câu hỏi.</Alert>
          ) : (
            <Stack spacing={2}>
              {questions.map((q, idx) => (
                <Card key={q.questionId} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography fontWeight={700}>
                      Câu {idx + 1}: {q.questionText}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Điểm: {q.points}
                    </Typography>
                    <RadioGroup
                      value={answers[q.questionId] ?? ''}
                      onChange={(e) => {
                        if (quizResult) return;
                        setAnswers((prev) => ({ ...prev, [q.questionId]: Number(e.target.value) }));
                      }}
                    >
                      {(q.answers || []).map((a) => (
                        <FormControlLabel
                          key={a.answerId}
                          value={a.answerId}
                          control={<Radio />}
                          label={a.answerText}
                          disabled={Boolean(quizResult)}
                        />
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
          <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={saving || questions.length === 0}>
              {quizResult ? 'Đã nộp' : saving ? 'Đang nộp...' : 'Nộp Quiz'}
            </Button>
          </Box>

          {quizResult && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Nộp thành công. Điểm: <strong>{quizResult.score}</strong>/<strong>{quizResult.maxScore}</strong> (
              <strong>{quizResult.percentage}%</strong>) — Đúng <strong>{quizResult.correctAnswers}</strong>/<strong>{quizResult.totalQuestions}</strong> câu.
            </Alert>
          )}
        </Paper>
      ) : submission ? (
        // Show submitted result
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Kết quả bài làm
          </Typography>
          
          <Alert severity={submission.status === 'Graded' ? 'success' : 'info'} sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              {submission.status === 'Graded' 
                ? `Đã chấm điểm: ${submission.score}/${assignment?.maxScore || 'N/A'}` 
                : 'Đã nộp - Chờ chấm điểm'}
            </Typography>
            <Typography variant="body2">
              Nộp lúc: {dayjs(submission.submittedAt).format('DD/MM/YYYY HH:mm')}
            </Typography>
            {submission.feedback && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Nhận xét:</strong> {submission.feedback}
              </Typography>
            )}
          </Alert>
          
          {/* Show submitted content */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Nội dung bài làm:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50', minHeight: 200 }}>
              <div dangerouslySetInnerHTML={{ __html: submission.content || 'Không có nội dung' }} />
            </Paper>
          </Box>
          
          {/* Show attachment if exists */}
          {submission.attachmentUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                File đính kèm:
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AttachFile />}
                href={submission.attachmentUrl}
                target="_blank"
                sx={{ borderRadius: 2 }}
              >
                Tải xuống file đính kèm
              </Button>
            </Box>
          )}
        </Paper>
      ) : (
        // Show submission form
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Bài làm của bạn
          </Typography>
          
          {/* Rich text editor */}
          <Box sx={{ mb: 2 }}>
            <JoditEditor
              value={content}
              onBlur={(newContent) => setContent(newContent)}
              config={{
                readonly: false,
                height: 500,
                placeholder: 'Nhập nội dung bài làm...',
                autofocus: false,
                buttons: [
                  'bold', 'italic', 'underline', '|',
                  'ul', 'ol', '|',
                  'font', 'fontsize', 'brush', 'paragraph', '|',
                  'image', 'link', '|',
                  'align', 'undo', 'redo', '|',
                  'hr', 'eraser', 'source'
                ],
                uploader: {
                  insertImageAsBase64URI: true,
                },
                events: {
                  afterInit: (editor) => {
                    editor.events.on('focus', () => {
                      editor.container.classList.add('jodit-focused');
                    });
                  }
                }
              }}
            />
          </Box>
          
          {/* File upload section */}
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            
            {selectedFile ? (
              <Paper sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AttachFile color="primary" />
                  <Typography variant="body2">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Typography>
                </Box>
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Xóa
                </Button>
              </Paper>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{ py: 1.5, borderStyle: 'dashed' }}
              >
                Đính kèm file
              </Button>
            )}
          </Box>
          
          <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default StudentAssignmentDetail;

