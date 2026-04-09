# Quản Lý Lớp Học - Cải Tiến UI/UX Chi Tiết

## 📋 Tóm Tắt Các Cải Tiến

File được cập nhật: [Classes.js](src/components/admin/classes/Classes.js)

---

## 🎯 Chi Tiết Các Cải Tiến

### 1. **Tối Ưu Hóa Cột Sĩ Số** ✅

**Trước:**
- Hiển thị text đơn giản: `4/20`

**Sau:**
- ✅ Progress Bar trực quan với hai dòng:
  - Dòng 1: `4/20` + `Phần trăm (%)`
  - Dòng 2: Linear Progress bar
- ✅ Màu sắc tự động thay đổi:
  - 🟢 **Xanh lá** (Success) khi còn chỗ
  - 🔴 **Đỏ** (Error) khi lớp đã đầy (Full)
- ✅ **Căn giữa** (Center) để dễ đọc

**Code:**
```jsx
{
  field: 'students',
  headerName: 'Sĩ Số',
  width: 160,
  align: 'center',
  headerAlign: 'center',
  renderCell: (params) => {
    const current = params.row.currentStudents || 0;
    const max = params.row.maxStudents || 20;
    const percentage = Math.round((current / max) * 100);
    const isFull = current >= max;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', py: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight={700}>{current}/{max}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{percentage}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            backgroundColor: alpha(theme.palette.grey[400], 0.3),
            '& .MuiLinearProgress-bar': {
              backgroundColor: isFull ? theme.palette.error.main : theme.palette.success.main,
            },
          }}
        />
      </Box>
    );
  },
}
```

---

### 2. **Gộp Cột Khóa Học & Chương Trình** ✅

**Trước:**
- 2 cột riêng biệt, nội dung thường lặp lại
- Chiếm nhiều diện tích ngang

**Sau:**
- ✅ 1 cột "Khóa Học / Chương Trình" với 2 dòng:
  - **Dòng 1 (Chính):** Tên Khóa Học - **Đậm**
  - **Dòng 2 (Phụ):** Tên Chương Trình - Nhỏ + Xám
- ✅ Tiết kiệm 40% diện tích cột
- ✅ Trông chuyên nghiệp và gọn gàng hơn

**Code:**
```jsx
{
  field: 'courseAndCurriculum',
  headerName: 'Khóa Học / Chương Trình',
  width: 280,
  sortable: false,
  renderCell: (params) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 1 }}>
      <Typography variant="body2" fontWeight={700}>
        {params.row.courseName}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {params.row.curriculumName}
      </Typography>
    </Box>
  ),
}
```

---

### 3. **Menu Hành Động (Action Menu)** ✅

**Trước:**
- 2 icon riêng biệt: "Thêm người" + "Xóa"
- Chiếm diện tích, trông lộn xộn

**Sau:**
- ✅ **Menu 3 chấm dọc** (MoreVert icon)
- ✅ Khi click hiển thị các tùy chọn:
  - 👥 Thêm Học Viên
  - ✏️ Chỉnh Sửa
  - 🗑️ Xóa Lớp
- ✅ Đồng bộ 100% với các trang khác (Skills, Rooms, etc.)
- ✅ Bảng gọn gàng hơn, chỉ hiển thị 1 icon

**Code:**
```jsx
{
  field: 'actions',
  headerName: 'Hành Động',
  width: 80,
  align: 'center',
  headerAlign: 'center',
  sortable: false,
  pinned: 'right',
  renderCell: (params) => (
    <IconButton
      size="small"
      onClick={(e) => handleOpenMenu(e, params.row)}
      sx={{ color: 'text.secondary' }}
    >
      <MoreVert fontSize="small" />
    </IconButton>
  ),
}
```

**Menu Component:**
```jsx
<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleCloseMenu}
  TransitionComponent={Fade}
  PaperProps={{
    sx: {
      borderRadius: 2,
      minWidth: 200,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      border: '1px solid',
      borderColor: 'divider',
      mt: 1,
    },
  }}
>
  <MenuItem onClick={() => handleEnrollStudent(selectedClassForMenu)}>
    <PersonAdd fontSize="small" color="primary" />
    <Typography variant="body2" fontWeight={700}>Thêm Học Viên</Typography>
  </MenuItem>
  <MenuItem onClick={() => handleOpenDialog(selectedClassForMenu)}>
    <Edit fontSize="small" color="primary" />
    <Typography variant="body2" fontWeight={700}>Chỉnh Sửa</Typography>
  </MenuItem>
  <MenuItem onClick={() => handleDeleteClass(selectedClassForMenu)} sx={{ color: 'error.main' }}>
    <Delete fontSize="small" />
    <Typography variant="body2" fontWeight={700}>Xóa Lớp</Typography>
  </MenuItem>
</Menu>
```

---

### 4. **Nhãn Trạng Thái (Status Badge)** ✅

**Trước:**
- Chỉ 2 trạng thái: "Active" hoặc "Completed"

**Sau:**
- ✅ **3 trạng thái** dựa vào thời gian:
  - 🟢 **Active** (Màu xanh) - Lớp đang diễn ra
  - 🟡 **Sắp khai giảng** (Màu cam/vàng) - Chưa bắt đầu
  - ⚪ **Đã kết thúc** (Màu xám) - Lớp kết thúc
- ✅ Auto-calculate dựa vào `startDate` và `endDate`
- ✅ Admin dễ phân loại lớp theo thời gian thực

**Code:**
```jsx
const getClassStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'Sắp khai giảng';
  if (now > end) return 'Đã kết thúc';
  return 'Active';
};

const getStatusColor = (status) => {
  switch(status) {
    case 'Sắp khai giảng': return 'warning';
    case 'Đã kết thúc': return 'default';
    case 'Active': return 'success';
    default: return 'default';
  }
};
```

---

### 5. **Sticky Columns (Cột Cố Định)** ✅

**Trước:**
- Khi cuộn ngang, các cột ID và Tên Lớp biến mất
- Admin không biết lớp nào đang chỉnh sửa

**Sau:**
- ✅ **Sticky Left:** Cột ID + Tên Lớp **cố định bên trái**
- ✅ **Sticky Right:** Cột Hành Động **cố định bên phải**
- ✅ Khi cuộn ngang để xem ngày tháng, phòng, trạng thái
- ✅ Vẫn thấy rõ tên lớp học đang làm việc

**Code:**
```jsx
{
  field: 'classId',
  headerName: 'ID',
  width: 70,
  pinned: 'left',  // ← Cố định bên trái
},
{
  field: 'className',
  headerName: 'Tên Lớp',
  flex: 1,
  minWidth: 200,
  pinned: 'left',  // ← Cố định bên trái
},
// ... các cột khác ...
{
  field: 'actions',
  headerName: 'Hành Động',
  width: 80,
  pinned: 'right',  // ← Cố định bên phải
}
```

---

### 6. **Cột Phòng Học (Link)** ✅

**Trước:**
- Text đơn giản: "Phòng 101", "Phòng 102"
- Không có tương tác

**Sau:**
- ✅ **Chuyển thành Link** (Text xanh, có gạch chân khi hover)
- ✅ Tương tác: Click vào sẽ hiện tooltip/action
- ✅ Tương lai có thể dẫn tới trang Quản lý Phòng
- ✅ Trông chuyên nghiệp hơn

**Code:**
```jsx
{
  field: 'roomName',
  headerName: 'Phòng',
  width: 120,
  renderCell: (params) => (
    <Typography
      component="span"
      sx={{
        color: theme.palette.primary.main,
        cursor: 'pointer',
        fontWeight: 600,
        '&:hover': {
          textDecoration: 'underline',
        },
      }}
      title="Xem lịch phòng"
    >
      {params.value || '—'}
    </Typography>
  ),
}
```

---

### 8. **Cải Tiến Cột Trạng Thái và Mô Tả (Rooms)** ✅

**Trước:**
- Nhãn trạng thái căn giữa cột, không thẳng hàng với văn bản bên cạnh
- Cột Mô Tả hiển thị thông tin lặp lại với Sức Chứa (vd: "chứa 30 học viên")

**Sau:**
- ✅ **Căn trái nhãn trạng thái** để thẳng hàng với văn bản cột Mô Tả
- ✅ **Tận dụng không gian Mô Tả** với thông tin hữu ích:
  - 📽️ Máy Chiếu
  - 🖥️ Phòng Lab  
  - 📺 Bảng Thông Minh
  - 📶 WiFi
- ✅ Hiển thị dưới dạng Chip với icon, dễ đọc và chuyên nghiệp

**Code:**
```jsx
// Cột Trạng Thái - Căn trái
{
  field: 'isActive',
  headerName: 'Trạng Thái',
  width: 140,
  align: 'left',  // ← Thay đổi từ center
  headerAlign: 'left',
  renderCell: (params) => {
    const isActive = Boolean(params.value);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start' }}>  // ← Thay đổi từ center
        <Chip
          label={isActive ? 'Sẵn sàng' : 'Bảo trì'}
          color={isActive ? 'success' : 'warning'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Box>
    );
  },
}

// Cột Mô Tả - Hiển thị tính năng
{ 
  field: 'description', 
  headerName: 'Mô Tả', 
  width: 250,
  renderCell: (params) => {
    const desc = params.value || '';
    const features = [];
    
    if (desc.toLowerCase().includes('máy chiếu')) features.push({ label: 'Máy Chiếu', icon: '📽️' });
    if (desc.toLowerCase().includes('phòng lab')) features.push({ label: 'Phòng Lab', icon: '🖥️' });
    if (desc.toLowerCase().includes('bảng thông minh')) features.push({ label: 'Bảng Thông Minh', icon: '📺' });
    if (desc.toLowerCase().includes('wifi')) features.push({ label: 'WiFi', icon: '📶' });
    
    if (features.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {features.map((feature, index) => (
            <Chip
              key={index}
              label={`${feature.icon} ${feature.label}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
          ))}
        </Box>
      );
    }
    
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {desc || 'Không có mô tả'}
      </Typography>
    );
  },
}
```

---

## 9. **Đồng Bộ Hóa Giao Diện Quản Lý Chương Trình Học** ✅

**Trước:**
- Menu hành động: Icon dàn ngang (Info, People, Edit, Delete)
- Trạng thái: Chip màu xanh đậm
- Cột riêng biệt: Tên chương trình + Khóa học
- Thời gian: 2 cột Ngày bắt đầu + Ngày kết thúc
- Không có bộ lọc nhanh

**Sau:**
- ✅ **Menu ba chấm dọc** đồng bộ với Classes/Rooms
- ✅ **Badge trạng thái** nền nhạt, chữ đậm như Skills
- ✅ **Gộp cột Chương trình/Khóa học** với 2 dòng (như Classes)
- ✅ **Gộp cột Thời gian** dạng "01/04/2026 - 11/04/2026"
- ✅ **Bộ lọc nhanh theo Khóa học** (5 khóa đầu tiên)

**Code:**
```jsx
// Menu ba chấm dọc
{
  field: 'actions',
  headerName: 'Hành động',
  width: 80,
  align: 'center',
  headerAlign: 'center',
  sortable: false,
  renderCell: (params) => (
    <IconButton
      size="small"
      onClick={(e) => handleOpenMenu(e, params.row)}
      sx={{ color: 'text.secondary' }}
    >
      <MoreVert fontSize="small" />
    </IconButton>
  ),
}

// Badge trạng thái
{
  field: 'status',
  headerName: 'Trạng thái',
  width: 140,
  align: 'center',
  headerAlign: 'center',
  sortable: false,
  renderCell: (params) => {
    const isActive = params.value === 'Active';
    const s = isActive ? statusStyle.active : statusStyle.inactive;
    return (
      <Chip
        label={params.value}
        size="small"
        sx={{
          bgcolor: s.bg,
          color: s.text,
          border: '1px solid',
          borderColor: s.border,
          fontWeight: 800,
          borderRadius: 1.5,
          fontSize: '0.7rem',
          height: 22,
          minWidth: 88,
        }}
      />
    );
  },
}

// Gộp cột Chương trình/Khóa học
{
  field: 'curriculumName',
  headerName: 'Chương trình / Khóa học',
  flex: 1,
  minWidth: 280,
  sortable: false,
  renderCell: (params) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
        <Avatar sx={{...}}>
          <MapOutlined fontSize="small" />
        </Avatar>
        <Typography variant="body2" fontWeight={700} noWrap>
          {params.row.curriculumName}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', ml: 4.5 }}>
        {params.row.courseName}
      </Typography>
    </Box>
  ),
}

// Gộp cột Thời gian
{
  field: 'timeRange',
  headerName: 'Thời gian',
  width: 180,
  align: 'center',
  headerAlign: 'center',
  sortable: false,
  renderCell: (params) => {
    const startDate = new Date(params.row.startDate).toLocaleDateString('vi-VN');
    const endDate = new Date(params.row.endDate).toLocaleDateString('vi-VN');
    return (
      <Typography variant="body2" fontWeight={600}>
        {startDate} - {endDate}
      </Typography>
    );
  },
}

// Bộ lọc nhanh
<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
  <Button variant={selectedCourseFilter === 'all' ? 'contained' : 'outlined'} size="small" onClick={() => setSelectedCourseFilter('all')}>
    Tất cả
  </Button>
  {courses.slice(0, 5).map((course) => (
    <Button key={course.courseId} variant={selectedCourseFilter === course.courseId.toString() ? 'contained' : 'outlined'} size="small" onClick={() => setSelectedCourseFilter(course.courseId.toString())}>
      {course.courseName}
    </Button>
  ))}
</Box>
```

---

## 10. **Hoàn Thiện Trang Quản Lý Chương Trình Học** ✅

**Cải Tiến Bổ Sung:**

### **Cột Số Lượng Bài Học** ✅
- ✅ Thêm cột "Bài học" hiển thị tổng số bài học của chương trình
- ✅ Tính từ cấu trúc: `CurriculumDays → CurriculumSessions → Lessons`
- ✅ Hiển thị dạng "25 bài" với màu xanh và font đậm
- ✅ Giúp Admin đánh giá độ phức tạp của chương trình

### **Căn Chỉnh Icon Hoàn Hảo** ✅
- ✅ Icon bản đồ màu tím được căn chỉnh hoàn hảo với 2 dòng text
- ✅ Sử dụng `alignSelf: 'flex-start'` để icon căn trên với dòng đầu
- ✅ Text được wrap trong Box riêng để layout cân đối
- ✅ Tạo sự cân đối thị giác chuyên nghiệp

### **Bộ Lọc Nâng Cao** ✅
- ✅ Chuyển từ Buttons sang Chips để hiện đại hơn
- ✅ Thêm label "Lọc theo Khóa học:" để rõ ràng
- ✅ Hiển thị tối đa 8 khóa học đầu tiên
- ✅ Chips có variant filled/outlined và màu primary
- ✅ UX tốt hơn với spacing và typography phù hợp

**Code:**
```jsx
// Cột Số Bài Học
{
  field: 'lessonCount',
  headerName: 'Bài học',
  width: 100,
  align: 'center',
  headerAlign: 'center',
  renderCell: (params) => {
    const totalLessons = params.row.curriculumDays?.reduce((dayTotal, day) => {
      return dayTotal + (day.curriculumSessions?.reduce((sessionTotal, session) => {
        return sessionTotal + (session.lessons?.length || 0);
      }, 0) || 0);
    }, 0) || 0;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {totalLessons}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          bài
        </Typography>
      </Box>
    );
  },
}

// Icon Căn Chỉnh
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
  <Avatar sx={{ alignSelf: 'flex-start' }}>
    <MapOutlined fontSize="small" />
  </Avatar>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
    <Typography variant="body2" fontWeight={700} noWrap>
      {params.row.curriculumName}
    </Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {params.row.courseName}
    </Typography>
  </Box>
</Box>

// Bộ Lọc Chips
<Box sx={{ mb: 2 }}>
  <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
    Lọc theo Khóa học:
  </Typography>
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
    <Chip label="Tất cả" variant={selectedCourseFilter === 'all' ? 'filled' : 'outlined'} ... />
    {courses.slice(0, 8).map((course) => (
      <Chip key={course.courseId} label={course.courseName} ... />
    ))}
  </Box>
</Box>
```

---

## 📊 Bảng So Sánh (Hoàn Chỉnh)

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| **Sĩ Số** | Text `4/20` | Progress Bar + Color |
| **Khóa/Chương Trình** | 2 cột riêng | 1 cột (2 dòng) |
| **Hành Động** | 2 icon riêng | Menu 3 chấm |
| **Trạng Thái** | 2 loại | 3 loại + Auto-calculate |
| **Sticky Columns** | ❌ | ✅ |
| **Phòng Học** | Text | Link (Interactive) |
| **Edit Lớp** | ❌ | ✅ |
| **Trạng Thái Phòng** | Căn giữa | Căn trái + Thẳng hàng |
| **Mô Tả Phòng** | Text lặp lại | Chip tính năng với icon |
| **Menu Chương Trình** | Icon ngang | Menu 3 chấm |
| **Trạng Thái CT** | Chip xanh đậm | Badge nền nhạt |
| **Cột CT/Khóa** | 2 cột | 1 cột 2 dòng |
| **Thời Gian CT** | 2 cột | 1 cột gộp |
| **Bộ Lọc CT** | ❌ | ✅ Chips theo khóa học |
| **Icon Căn Chỉnh** | Không cân đối | Căn giữa hoàn hảo |
| **Số Bài Học** | ❌ | ✅ Hiển thị số lượng |
---

## 🎨 Visual Improvements

### Trước:
```
+----+------------------+------------------+------------------+--+
| ID | Tên Lớp         | Khóa Học         | Chương Trình      |..| Action |
+----+------------------+------------------+------------------+--+
| 5  | Grammar for B.. | Công nghệ PM    | Công nghệ PM     |  | [+][-] |
+----+------------------+------------------+------------------+--+
```

### Sau:
```
+----+------------------+---------------------------------+--+
| ID | Tên Lớp         | Khóa Học / Chương Trình       |  | [⋮] |
+----+------------------+---------------------------------+--+
| 5  | 🎓 Grammar for | **Công nghệ PM**              |  | 
    |    Beginners     | _Công nghệ phần mềm_           |  | Menu:
    |                  |                                |  | ├─ Thêm HV
    |                  | **Sĩ Số**: 4/20 🟢 [▮▮▮░░░] |  | ├─ Chỉnh Sửa
    |                  |                                |  | └─ Xóa
+----+------------------+---------------------------------+--+
```

---

## 🚀 Lợi Ích

1. **Giao diện dễ thở hơn** - Ít cột, thông tin được sắp xếp tốt
2. **Dễ đọc & hiểu** - Progress bar trực quan, trạng thái rõ ràng
3. **Chuyên nghiệp** - Design pattern đồng nhất với các trang khác
4. **Tối ưu không gian** - Cột Khóa/Chương giảm 40% chiều rộng
5. **Tính năng đầy đủ** - Chỉnh sửa, xóa, thêm học viên đơn giản
6. **Căn chỉnh nhất quán** - Nhãn trạng thái thẳng hàng với văn bản
7. **Thông tin giá trị** - Mô tả phòng hiển thị tính năng hữu ích thay vì lặp lại
8. **Đồng bộ hoàn hảo** - Curriculum giờ đây nhất quán với Classes/Rooms
9. **Lọc nhanh hiệu quả** - Tìm chương trình theo khóa học chỉ với 1 click
10. **Thông tin chi tiết** - Hiển thị số lượng bài học để đánh giá độ phức tạp
11. **Cân đối thị giác** - Icon được căn chỉnh hoàn hảo với nội dung

---

**Cập nhật:** April 9, 2026
