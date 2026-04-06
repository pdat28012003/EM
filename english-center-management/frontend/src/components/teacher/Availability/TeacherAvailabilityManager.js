import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  Fade,
  CircularProgress,
  Alert,
  Snackbar
} from "@mui/material";
import { Delete, ChevronLeft, ChevronRight, Clear, AccessTime, Save, List } from "@mui/icons-material";
import { teachersAPI } from "../../../services/api";

const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const FULL_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const REVERSE_DAY_MAP = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// C# DayOfWeek enum: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
// UI index: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
const DAY_OF_WEEK_NUMBER = [1, 2, 3, 4, 5, 6, 0];

const START_HOUR = 8;
const END_HOUR = 20;

export default function AvailabilityScheduler() {
  const [teacherId, setTeacherId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get teacherId from logged in user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Teacher role has teacherId
        if (user.teacherId) {
          setTeacherId(user.teacherId);
        } else if (user.role === 'Teacher' && user.userId) {
          // Fallback: try to fetch teacher profile by userId
          setTeacherId(user.userId);
        }
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  // Load availabilities from API when teacherId or currentWeek changes
  useEffect(() => {
    if (teacherId) {
      loadAvailabilities();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, currentWeek]);

  const loadAvailabilities = async () => {
    if (!teacherId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await teachersAPI.getAvailabilities(teacherId);
      const apiSlots = response.data || [];
      
      // Convert API format to local format
      const convertedSlots = apiSlots.map(avail => ({
        availabilityId: avail.availabilityId,
        date: avail.specificDate ? avail.specificDate.split('T')[0] : null,
        dayOfWeek: avail.dayOfWeek,
        start: avail.startTime.substring(0, 5), // HH:mm format
        end: avail.endTime.substring(0, 5),
        isRecurring: avail.isRecurring,
        notes: avail.notes
      }));
      
      // Filter slots for current week view
      const weekStart = new Date(weekDates[0]);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekDates[6]);
      weekEnd.setHours(23, 59, 59, 999);
      
      const filteredSlots = convertedSlots.filter(slot => {
        if (slot.isRecurring) return true;
        if (slot.date) {
          const slotDate = new Date(slot.date + 'T00:00:00');
          return slotDate >= weekStart && slotDate <= weekEnd;
        }
        return false;
      });
      
      setSlots(filteredSlots);
    } catch (err) {
      console.error('Failed to load availabilities:', err);
      setError('Không thể tải lịch rảnh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      const start = `${hour.toString().padStart(2, "0")}:00`;
      const end = `${(hour + 1).toString().padStart(2, "0")}:00`;
      slots.push({ start, end, hour });
    }
    return slots;
  }, []);

  const weekDates = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    startOfWeek.setDate(today.getDate() + diff + currentWeek * 7);

    return DAYS.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  }, [currentWeek]);

  const formatDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit"
    });
  };

  const getSlotKey = (dateIndex, timeIndex) => `${dateIndex}-${timeIndex}`;

  const isSlotSelected = (dateIndex, timeIndex) => {
    return selectedSlots.has(getSlotKey(dateIndex, timeIndex));
  };

  const isSlotSaved = (date, start, end) => {
    return slots.some(
      (slot) => slot.date === date && slot.start === start && slot.end === end
    );
  };

  const handleMouseDown = (dateIndex, timeIndex) => {
    setIsSelecting(true);
    const key = getSlotKey(dateIndex, timeIndex);
    setSelectedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleMouseEnter = (dateIndex, timeIndex) => {
    if (isSelecting) {
      const key = getSlotKey(dateIndex, timeIndex);
      setSelectedSlots((prev) => {
        const newSet = new Set(prev);
        newSet.add(key);
        return newSet;
      });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const handleSaveSelection = async () => {
    if (!teacherId) {
      showSnackbar('Vui lòng chọn giáo viên trước', 'error');
      return;
    }

    const newSlots = [];
    selectedSlots.forEach((key) => {
      const [dateIndex, timeIndex] = key.split("-").map(Number);
      const date = weekDates[dateIndex].toISOString().split("T")[0];
      const time = timeSlots[timeIndex];

      if (!isSlotSaved(date, time.start, time.end)) {
        newSlots.push({ 
          date, 
          start: time.start, 
          end: time.end,
          dayOfWeek: DAY_OF_WEEK_NUMBER[dateIndex] // Send integer for C# DayOfWeek enum
        });
      }
    });

    if (newSlots.length === 0) {
      setSelectedSlots(new Set());
      return;
    }

    setSaving(true);
    try {
      // Create each slot individually to ensure correct specificDate per slot
      const createdSlots = [];
      
      for (const slot of newSlots) {
        const payload = {
          teacherId: teacherId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.start + ':00',
          endTime: slot.end + ':00',
          isRecurring: false,
          specificDate: slot.date,
          notes: ''
        };
        
        try {
          const response = await teachersAPI.createAvailability(payload);
          createdSlots.push(response.data);
        } catch (err) {
          // Skip duplicates or overlapping slots
          if (err.response?.status === 409) {
            console.log('Slot overlaps with existing:', slot);
            continue;
          }
          throw err;
        }
      }
      
      // Add new slots to local state with IDs from API
      const slotsWithIds = createdSlots.map((avail) => ({
        availabilityId: avail.availabilityId,
        date: avail.specificDate ? avail.specificDate.split('T')[0] : null,
        dayOfWeek: avail.dayOfWeek,
        start: avail.startTime.substring(0, 5),
        end: avail.endTime.substring(0, 5),
        isRecurring: avail.isRecurring,
        notes: avail.notes
      }));

      setSlots((prev) => [...prev, ...slotsWithIds]);
      setSelectedSlots(new Set());
      showSnackbar(`Đã lưu ${slotsWithIds.length} khung giờ thành công`, 'success');
    } catch (err) {
      console.error('Failed to save availabilities:', err);
      const errorMsg = err.response?.data?.message || 'Không thể lưu lịch rảnh. Vui lòng thử lại.';
      showSnackbar(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (index) => {
    const slot = slots[index];
    
    if (slot?.availabilityId) {
      try {
        await teachersAPI.deleteAvailability(slot.availabilityId);
        showSnackbar('Đã xóa khung giờ thành công', 'success');
      } catch (err) {
        console.error('Failed to delete availability:', err);
        showSnackbar('Không thể xóa khung giờ. Vui lòng thử lại.', 'error');
        return;
      }
    }
    
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearSelection = () => {
    setSelectedSlots(new Set());
  };

  const handleClearAllSlots = async () => {
    if (!window.confirm("Xóa tất cả lịch rảnh?")) {
      return;
    }

    const slotsWithIds = slots.filter(s => s.availabilityId);
    
    if (slotsWithIds.length > 0) {
      setLoading(true);
      try {
        // Delete all slots with IDs from API
        await Promise.all(
          slotsWithIds.map(slot => teachersAPI.deleteAvailability(slot.availabilityId))
        );
        showSnackbar(`Đã xóa ${slotsWithIds.length} khung giờ thành công`, 'success');
      } catch (err) {
        console.error('Failed to delete availabilities:', err);
        showSnackbar('Không thể xóa một số khung giờ. Vui lòng thử lại.', 'error');
        return;
      } finally {
        setLoading(false);
      }
    }
    
    setSlots([]);
    setSelectedSlots(new Set());
  };

  const groupedSlots = useMemo(() => {
    return slots.reduce((acc, slot, index) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push({ ...slot, index });
      return acc;
    }, {});
  }, [slots]);

  const selectionCount = selectedSlots.size;

  if (!teacherId) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
        <Alert severity="info">
          Vui lòng đăng nhập với tài khoản giảng viên để quản lý lịch rảnh
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}>
            Quản lý lịch rảnh
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Click và kéo để chọn nhiều khung giờ
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => setCurrentWeek((w) => w - 1)} size="small">
            <ChevronLeft />
          </IconButton>
          <Typography sx={{ fontWeight: 500, minWidth: 140, textAlign: "center" }}>
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </Typography>
          <IconButton onClick={() => setCurrentWeek((w) => w + 1)} size="small">
            <ChevronRight />
          </IconButton>
        </Stack>
      </Box>

      {/* Main Content - 2 columns */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left: Timetable */}
        <Box sx={{ flex: { xs: 1, lg: 2 } }}>
          {/* Timetable */}
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              mb: 3,
              userSelect: "none",
              position: "relative"
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
        {/* Loading Overlay */}
        {loading && (
          <Box sx={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}>
            <CircularProgress />
          </Box>
        )}
        {/* Days Header */}
        <Box sx={{ display: "flex", borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
          <Box sx={{ width: 70, p: 1.5, borderRight: "1px solid", borderColor: "divider" }} />
          {DAYS.map((day, index) => (
            <Box
              key={day}
              sx={{
                flex: 1,
                p: 1.5,
                textAlign: "center",
                borderRight: index < DAYS.length - 1 ? "1px solid" : "none",
                borderColor: "divider"
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{day}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {formatDate(weekDates[index])}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Time Grid */}
        {timeSlots.map((time, timeIndex) => (
          <Box key={time.hour} sx={{ display: "flex", borderBottom: timeIndex < timeSlots.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
            <Box
              sx={{
                width: 70,
                p: 1,
                borderRight: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "grey.50"
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {time.start}
              </Typography>
            </Box>
            {DAYS.map((_, dayIndex) => {
              const key = getSlotKey(dayIndex, timeIndex);
              const date = weekDates[dayIndex].toISOString().split("T")[0];
              const saved = isSlotSaved(date, time.start, time.end);
              const selected = isSlotSelected(dayIndex, timeIndex);

              return (
                <Box
                  key={key}
                  sx={{
                    flex: 1,
                    height: 50,
                    borderRight: dayIndex < DAYS.length - 1 ? "1px solid" : "none",
                    borderColor: "divider",
                    bgcolor: selected 
                      ? "primary.main" // Selected = xanh đậm (đang chọn)
                      : saved 
                        ? "grey.200" // Saved = xám nhạt (đã lưu)
                        : "background.paper",
                    cursor: "pointer",
                    transition: "background-color 0.1s",
                    '&:hover': {
                      bgcolor: selected 
                        ? "primary.dark" 
                        : saved 
                          ? "grey.300"
                          : "action.hover"
                    }
                  }}
                  onMouseDown={() => handleMouseDown(dayIndex, timeIndex)}
                  onMouseEnter={() => handleMouseEnter(dayIndex, timeIndex)}
                />
              );
            })}
          </Box>
        ))}
      </Paper>

      {/* Selection Preview */}
      {selectionCount > 0 && (
        <Fade in>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "primary.light"
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              Bạn đang chọn:
            </Typography>
            <Stack spacing={0.5}>
              {Array.from(selectedSlots).map(key => {
                const [dateIndex, timeIndex] = key.split("-").map(Number);
                const date = weekDates[dateIndex];
                const time = timeSlots[timeIndex];
                const dayName = FULL_DAYS[dateIndex];
                const formattedDate = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                return (
                  <Typography key={key} variant="body2" sx={{ fontWeight: 500, color: "primary.main" }}>
                    • {dayName}, {formattedDate}: {time.start} - {time.end}
                  </Typography>
                );
              })}
            </Stack>
          </Paper>
        </Fade>
      )}

      {/* Actions */}
      {selectionCount > 0 && (
        <Fade in>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: "primary.50",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTime fontSize="small" sx={{ color: "primary.main" }} />
              <Typography sx={{ fontWeight: 500, color: "primary.dark" }}>
                Đã chọn {selectionCount} khung giờ
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Clear fontSize="small" />}
                onClick={handleClearSelection}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveSelection}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <Save fontSize="small" />}
              >
                {saving ? 'Đang lưu...' : 'Lưu lịch'}
              </Button>
            </Stack>
          </Paper>
        </Fade>
      )}

        </Box>

        {/* Right: Saved Slots Sidebar */}
        <Box sx={{ flex: { xs: 1, lg: 1 }, minWidth: 280 }}>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              maxHeight: 600,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: "grey.50",
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <List fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  Đã đăng ký ({slots.length})
                </Typography>
              </Stack>
              {slots.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete fontSize="small" />}
                  onClick={handleClearAllSlots}
                  disabled={loading}
                >
                  Xóa
                </Button>
              )}
            </Box>

            <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
              {slots.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Chưa có lịch rảnh nào
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {/* Group by Day */}
                  {Object.keys(groupedSlots)
                    .sort()
                    .map((date) => {
                      const dateObj = new Date(date);
                      const dayName = FULL_DAYS[(dateObj.getDay() + 6) % 7];
                      const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit"
                      });
                      const daySlots = groupedSlots[date];
                      const totalHours = daySlots.reduce((acc, s) => acc + (parseInt(s.end) - parseInt(s.start)), 0);

                      return (
                        <Paper key={date} elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary" }}>
                              {dayName}, {formattedDate}
                            </Typography>
                            <Chip label={`${daySlots.length} slot`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {daySlots
                              .sort((a, b) => a.start.localeCompare(b.start))
                              .map((slot) => (
                                <Tooltip title="Click để xóa" key={slot.index}>
                                  <Chip
                                    label={`${slot.start}-${slot.end}`}
                                    size="small"
                                    onDelete={() => handleDeleteSlot(slot.index)}
                                    sx={{
                                      bgcolor: "primary.50",
                                      borderColor: "primary.light",
                                      border: "1px solid",
                                      fontWeight: 500,
                                      '& .MuiChip-deleteIcon': {
                                        color: 'primary.main',
                                        '&:hover': { color: 'error.main' }
                                      }
                                    }}
                                  />
                                </Tooltip>
                              ))}
                          </Stack>
                        </Paper>
                      );
                    })}
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}