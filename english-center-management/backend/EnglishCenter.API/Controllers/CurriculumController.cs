using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CurriculumController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CurriculumController> _logger;
        private readonly INotificationService _notificationService;
        private readonly IActivityLogService _activityLogService;

        public CurriculumController(ApplicationDbContext context, ILogger<CurriculumController> logger, INotificationService notificationService, IActivityLogService activityLogService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
        }

        /// <summary>
        /// Gets all curriculums. (Lấy danh sách khung chương trình.)
        /// </summary>
        /// <returns>List of curriculums (Danh sách khung chương trình)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<CurriculumDto>>> GetAllCurriculums(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var totalCount = await _context.Curriculums.CountAsync();
                var curriculums = await _context.Curriculums
                    .Include(c => c.CurriculumCourses)
                        .ThenInclude(cc => cc.Course)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Lessons)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.AssignedRoom)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Teacher)
                    .Include(c => c.ParticipantTeachers)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var curriculumDtos = curriculums.Select(c => MapCurriculumToDto(c)).ToList();

                var pagedResult = new PagedResult<CurriculumDto>
                {
                    Data = curriculumDtos,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(pagedResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all curriculums");
                return StatusCode(500, new { message = "Error retrieving curriculums", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a curriculum by ID. (Lấy thông tin khung chương trình theo ID.)
        /// </summary>
        /// <param name="id">Curriculum ID (ID khung chương trình)</param>
        /// <returns>Curriculum details (Thông tin khung chương trình)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<CurriculumDto>> GetCurriculumById(int id)
        {
            try
            {
                var curriculum = await _context.Curriculums
                    .Include(c => c.CurriculumCourses)
                        .ThenInclude(cc => cc.Course)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Lessons)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.AssignedRoom)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Teacher)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.SessionStudents)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Document)
                    .Include(c => c.ParticipantTeachers)
                    .FirstOrDefaultAsync(c => c.CurriculumId == id);

                if (curriculum == null)
                    return NotFound(new { message = "Curriculum not found" });

                return Ok(MapCurriculumToDto(curriculum));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting curriculum {id}");
                return StatusCode(500, new { message = "Error retrieving curriculum", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets curriculums for a specific course. (Lấy khung chương trình của một khóa học cụ thể.)
        /// </summary>
        /// <param name="courseId">Course ID (ID khóa học)</param>
        /// <returns>List of curriculums (Danh sách khung chương trình)</returns>
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<CurriculumDto>>> GetCurriculumsByCourse(int courseId)
        {
            try
            {
                var curriculums = await _context.Curriculums
                    .Where(c => c.CurriculumCourses.Any(cc => cc.CourseId == courseId))
                    .Include(c => c.CurriculumCourses)
                        .ThenInclude(cc => cc.Course)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Lessons)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.AssignedRoom)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Teacher)
                    .Include(c => c.ParticipantTeachers)
                    .ToListAsync();

                return Ok(curriculums.Select(c => MapCurriculumToDto(c)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting curriculums for course {courseId}");
                return StatusCode(500, new { message = "Error retrieving curriculums", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets curriculums for a specific teacher. (Lây danh sách khung ch trình c giáo viên)
        /// </summary>
        /// <param name="teacherId">Teacher ID (ID giáo viên)</param>
        /// <returns>List of curriculums (Danh sách khung ch trình)</returns>
        [HttpGet("by-teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<CurriculumDto>>> GetTeacherCurriculums(int teacherId)
        {
            try
            {
                // Get curriculums where teacher is either assigned to sessions or is a participant
                var teacherCurriculums = await _context.CurriculumSessions
                    .Where(cs => cs.TeacherId == teacherId)
                    .Select(cs => cs.CurriculumDay.Curriculum)
                    .Distinct()
                    .ToListAsync();

                // Also get curriculums where teacher is a participant
                var participantCurriculums = await _context.Curriculums
                    .Where(c => c.ParticipantTeachers.Any(pt => pt.TeacherId == teacherId))
                    .ToListAsync();

                // Combine and remove duplicates
                var allCurriculums = teacherCurriculums.Concat(participantCurriculums)
                    .GroupBy(c => c.CurriculumId)
                    .Select(g => g.First())
                    .ToList();

                // Load related data
                var curriculumIds = allCurriculums.Select(c => c.CurriculumId).ToList();
                var curriculumsWithDetails = await _context.Curriculums
                    .Where(c => curriculumIds.Contains(c.CurriculumId))
                    .Include(c => c.CurriculumCourses)
                        .ThenInclude(cc => cc.Course)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Teacher)
                    .Include(c => c.ParticipantTeachers)
                    .ToListAsync();

                return Ok(curriculumsWithDetails.Select(c => MapCurriculumToDto(c)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting curriculums for teacher {teacherId}");
                return StatusCode(500, new { message = "Error retrieving teacher curriculums", error = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new curriculum. (Tạo khung chương trình mới.)
        /// </summary>
        /// <param name="createCurriculumDto">Curriculum creation data (Dữ liệu tạo khung chương trình)</param>
        /// <returns>Created curriculum (Thông tin khung chương trình vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<CurriculumDto>> CreateCurriculum([FromBody] CreateCurriculumDto createCurriculumDto)
        {
            try
            {
                // Validate courses exist
                if (createCurriculumDto.Courses != null && createCurriculumDto.Courses.Any())
                {
                    var courseIds = createCurriculumDto.Courses.Select(c => c.CourseId).ToList();
                    var existingCourses = await _context.Courses
                        .Where(c => courseIds.Contains(c.CourseId))
                        .Select(c => c.CourseId)
                        .ToListAsync();
                    
                    if (existingCourses.Count != courseIds.Count)
                        return BadRequest(new { message = "One or more courses not found" });
                }

                // Validate dates
                if (createCurriculumDto.StartDate >= createCurriculumDto.EndDate)
                    return BadRequest(new { message = "Start date must be before end date" });

                var curriculum = new Curriculum
                {
                    CurriculumName = createCurriculumDto.CurriculumName,
                    StartDate = createCurriculumDto.StartDate,
                    EndDate = createCurriculumDto.EndDate,
                    Description = createCurriculumDto.Description,
                    Status = "Active",
                    CreatedDate = DateTime.Now
                };

                // Add courses
                if (createCurriculumDto.Courses != null && createCurriculumDto.Courses.Any())
                {
                    curriculum.CurriculumCourses = createCurriculumDto.Courses.Select(c => new CurriculumCourse
                    {
                        CourseId = c.CourseId,
                        OrderIndex = c.OrderIndex
                    }).ToList();
                }

                if (createCurriculumDto.ParticipantTeacherIds != null && createCurriculumDto.ParticipantTeacherIds.Any())
                {
                    var teachers = await _context.Teachers
                        .Where(t => createCurriculumDto.ParticipantTeacherIds.Contains(t.TeacherId))
                        .ToListAsync();
                    curriculum.ParticipantTeachers = teachers;
                }

                _context.Curriculums.Add(curriculum);
                await _context.SaveChangesAsync();

                // Re-load to include related data for mapping
                var savedCurriculum = await _context.Curriculums
                    .Include(c => c.CurriculumCourses)
                        .ThenInclude(cc => cc.Course)
                    .Include(c => c.ParticipantTeachers)
                    .FirstOrDefaultAsync(c => c.CurriculumId == curriculum.CurriculumId);

                return CreatedAtAction(nameof(GetCurriculumById), new { id = curriculum.CurriculumId }, MapCurriculumToDto(savedCurriculum!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating curriculum");
                return StatusCode(500, new { message = "Error creating curriculum", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a curriculum. (Cập nhật thông tin khung chương trình.)
        /// </summary>
        /// <param name="id">Curriculum ID (ID khung chương trình)</param>
        /// <param name="updateCurriculumDto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCurriculum(int id, [FromBody] UpdateCurriculumDto updateCurriculumDto)
        {
            try
            {
                var curriculum = await _context.Curriculums
                    .Include(c => c.ParticipantTeachers)
                    .Include(c => c.CurriculumCourses)
                    .FirstOrDefaultAsync(c => c.CurriculumId == id);
                if (curriculum == null)
                    return NotFound(new { message = "Curriculum not found" });

                // Validate dates
                if (updateCurriculumDto.StartDate >= updateCurriculumDto.EndDate)
                    return BadRequest(new { message = "Start date must be before end date" });

                curriculum.CurriculumName = updateCurriculumDto.CurriculumName;
                curriculum.StartDate = updateCurriculumDto.StartDate;
                curriculum.EndDate = updateCurriculumDto.EndDate;
                curriculum.Description = updateCurriculumDto.Description;
                curriculum.Status = updateCurriculumDto.Status;
                curriculum.ModifiedDate = DateTime.Now;

                // Update courses
                if (updateCurriculumDto.Courses != null)
                {
                    // Validate courses exist
                    var courseIds = updateCurriculumDto.Courses.Select(c => c.CourseId).ToList();
                    var existingCourses = await _context.Courses
                        .Where(c => courseIds.Contains(c.CourseId))
                        .ToListAsync();
                    
                    if (existingCourses.Count != courseIds.Count)
                        return BadRequest(new { message = "One or more courses not found" });

                    // Remove existing courses and add new ones
                    curriculum.CurriculumCourses.Clear();
                    foreach (var courseItem in updateCurriculumDto.Courses)
                    {
                        curriculum.CurriculumCourses.Add(new CurriculumCourse
                        {
                            CourseId = courseItem.CourseId,
                            OrderIndex = courseItem.OrderIndex
                        });
                    }
                }

                // Update participant teachers
                if (updateCurriculumDto.ParticipantTeacherIds != null)
                {
                    curriculum.ParticipantTeachers.Clear();
                    if (updateCurriculumDto.ParticipantTeacherIds.Any())
                    {
                        var teachers = await _context.Teachers
                            .Where(t => updateCurriculumDto.ParticipantTeacherIds.Contains(t.TeacherId))
                            .ToListAsync();
                        foreach (var teacher in teachers)
                        {
                            curriculum.ParticipantTeachers.Add(teacher);
                        }
                    }
                }

                _context.Curriculums.Update(curriculum);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Curriculum updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating curriculum {id}");
                return StatusCode(500, new { message = "Error updating curriculum", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a curriculum. (Xóa khung chương trình.)
        /// </summary>
        /// <param name="id">Curriculum ID (ID khung chương trình)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCurriculum(int id)
        {
            try
            {
                var curriculum = await _context.Curriculums
                    .Include(c => c.ParticipantStudents)
                    .FirstOrDefaultAsync(c => c.CurriculumId == id);
                if (curriculum == null)
                    return NotFound(new { message = "Curriculum not found" });

                // Remove related Enrollments first
                var enrollments = await _context.Enrollments
                    .Where(e => e.CurriculumId == id)
                    .ToListAsync();
                if (enrollments.Any())
                {
                    _context.Enrollments.RemoveRange(enrollments);
                }

                _context.Curriculums.Remove(curriculum);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Curriculum deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting curriculum {id}");
                return StatusCode(500, new { message = "Error deleting curriculum", error = ex.Message });
            }
        }

        // CURRICULUM DAYS

        /// <summary>
        /// Creates a new curriculum day. (Tạo mới thông tin ngày học trong chương trình.)
        /// </summary>
        /// <param name="createCurriculumDayDto">Curriculum day creation data (Dữ liệu tạo ngày học)</param>
        /// <returns>Created curriculum day (Thông tin ngày học vừa tạo)</returns>
        [HttpPost("day")]
        public async Task<ActionResult<CurriculumDayDto>> CreateCurriculumDay([FromBody] CreateCurriculumDayDto createCurriculumDayDto)
        {
            try
            {
                var curriculum = await _context.Curriculums.FindAsync(createCurriculumDayDto.CurriculumId);
                if (curriculum == null)
                    return BadRequest(new { message = "Curriculum not found" });

                // Check if date is within curriculum range (compare dates only, ignore time)
                var scheduleDate = createCurriculumDayDto.ScheduleDate.Date;
                var startDate = curriculum.StartDate.Date;
                var endDate = curriculum.EndDate.Date;
                
                _logger.LogInformation($"Debug: ScheduleDate={scheduleDate:yyyy-MM-dd}, StartDate={startDate:yyyy-MM-dd}, EndDate={endDate:yyyy-MM-dd}");
                
                if (scheduleDate < startDate || scheduleDate > endDate)
                {
                    _logger.LogWarning($"Date out of range: {scheduleDate:yyyy-MM-dd} not between {startDate:yyyy-MM-dd} and {endDate:yyyy-MM-dd}");
                    return BadRequest(new { 
                        message = "Schedule date must be within curriculum date range",
                        details = new {
                            scheduleDate = scheduleDate.ToString("yyyy-MM-dd"),
                            curriculumStartDate = startDate.ToString("yyyy-MM-dd"),
                            curriculumEndDate = endDate.ToString("yyyy-MM-dd")
                        }
                    });
                }

                // Check if date already exists
                var existingDay = await _context.CurriculumDays
                    .FirstOrDefaultAsync(cd => cd.CurriculumId == createCurriculumDayDto.CurriculumId && 
                                               cd.ScheduleDate.Date == scheduleDate);
                if (existingDay != null)
                    return BadRequest(new { message = "A day already exists for this date" });

                var curriculumDay = new CurriculumDay
                {
                    CurriculumId = createCurriculumDayDto.CurriculumId,
                    ScheduleDate = createCurriculumDayDto.ScheduleDate,
                    Topic = createCurriculumDayDto.Topic,
                    Description = createCurriculumDayDto.Description,
                    SessionCount = 0
                };

                _context.CurriculumDays.Add(curriculumDay);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCurriculumDayById), new { id = curriculumDay.CurriculumDayId }, 
                    MapCurriculumDayToDto(curriculumDay));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating curriculum day");
                return StatusCode(500, new { message = "Error creating curriculum day", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a curriculum day by ID. (Lấy thông tin ngày học theo ID.)
        /// </summary>
        /// <param name="id">Curriculum day ID (ID ngày học)</param>
        /// <returns>Curriculum day details (Thông tin ngày học)</returns>
        [HttpGet("day/{id}")]
        public async Task<ActionResult<CurriculumDayDto>> GetCurriculumDayById(int id)
        {
            try
            {
                var curriculumDay = await _context.CurriculumDays
                    .Include(cd => cd.CurriculumSessions)
                        .ThenInclude(cs => cs.Lessons)
                    .FirstOrDefaultAsync(cd => cd.CurriculumDayId == id);

                if (curriculumDay == null)
                    return NotFound(new { message = "Curriculum day not found" });

                return Ok(MapCurriculumDayToDto(curriculumDay));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting curriculum day {id}");
                return StatusCode(500, new { message = "Error retrieving curriculum day", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a curriculum day. (Cập nhật thông tin ngày học.)
        /// </summary>
        /// <param name="id">Curriculum day ID (ID ngày học)</param>
        /// <param name="updateCurriculumDayDto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpPut("day/{id}")]
        public async Task<IActionResult> UpdateCurriculumDay(int id, [FromBody] UpdateCurriculumDayDto updateCurriculumDayDto)
        {
            try
            {
                var curriculumDay = await _context.CurriculumDays.FindAsync(id);
                if (curriculumDay == null)
                    return NotFound(new { message = "Curriculum day not found" });

                curriculumDay.Topic = updateCurriculumDayDto.Topic;
                curriculumDay.Description = updateCurriculumDayDto.Description;

                _context.CurriculumDays.Update(curriculumDay);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Curriculum day updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating curriculum day {id}");
                return StatusCode(500, new { message = "Error updating curriculum day", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a curriculum day. (Xóa thông tin ngày học.)
        /// </summary>
        /// <param name="id">Curriculum day ID (ID ngày học)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpDelete("day/{id}")]
        public async Task<IActionResult> DeleteCurriculumDay(int id)
        {
            try
            {
                var curriculumDay = await _context.CurriculumDays.FindAsync(id);
                if (curriculumDay == null)
                    return NotFound(new { message = "Curriculum day not found" });

                _context.CurriculumDays.Remove(curriculumDay);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Curriculum day deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting curriculum day {id}");
                return StatusCode(500, new { message = "Error deleting curriculum day", error = ex.Message });
            }
        }

        // CURRICULUM SESSIONS

        /// <summary>
        /// Creates a new curriculum session. (Tạo mới một ca học/phần học.)
        /// </summary>
        /// <param name="createCurriculumSessionDto">Curriculum session creation data (Dữ liệu tạo ca học)</param>
        /// <returns>Created curriculum session (Thông tin ca học vừa tạo)</returns>
        [HttpPost("session")]
        public async Task<ActionResult<CurriculumSessionDto>> CreateCurriculumSession([FromBody] CreateCurriculumSessionDto createCurriculumSessionDto)
        {
            try
            {
                _logger.LogInformation($"Attempting to create session: DayId={createCurriculumSessionDto.CurriculumDayId}, Num={createCurriculumSessionDto.SessionNumber}, Start={createCurriculumSessionDto.StartTime}, End={createCurriculumSessionDto.EndTime}");

                var curriculumDay = await _context.CurriculumDays
                    .Include(cd => cd.Curriculum)
                        .ThenInclude(c => c.ParticipantTeachers)
                    .FirstOrDefaultAsync(cd => cd.CurriculumDayId == createCurriculumSessionDto.CurriculumDayId);

                if (curriculumDay == null)
                {
                    _logger.LogWarning($"Curriculum day not found: {createCurriculumSessionDto.CurriculumDayId}");
                    return BadRequest(new { message = "Curriculum day not found" });
                }

                // Check session number is 1-3
                if (createCurriculumSessionDto.SessionNumber < 1 || createCurriculumSessionDto.SessionNumber > 3)
                    return BadRequest(new { message = "Session number must be between 1 and 3" });

                // Check if session number already exists for this day
                var existingSession = await _context.CurriculumSessions
                    .FirstOrDefaultAsync(cs => cs.CurriculumDayId == createCurriculumSessionDto.CurriculumDayId && 
                                              cs.SessionNumber == createCurriculumSessionDto.SessionNumber);
                if (existingSession != null)
                    return BadRequest(new { message = "This session number already exists for this day" });

                // Validate times
                if (createCurriculumSessionDto.StartTime >= createCurriculumSessionDto.EndTime)
                    return BadRequest(new { message = "Start time must be before end time" });

                // Room conflict check
                if (createCurriculumSessionDto.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(createCurriculumSessionDto.RoomId.Value);
                    if (room == null)
                        return BadRequest(new { message = "Room not found" });

                    // Check for overlapping sessions in the same room on the same day
                    var overlappingSession = await _context.CurriculumSessions
                        .Include(cs => cs.CurriculumDay)
                        .Where(cs => cs.RoomId == createCurriculumSessionDto.RoomId.Value && 
                                    cs.CurriculumDay.ScheduleDate.Date == curriculumDay.ScheduleDate.Date)
                        .Where(cs => (createCurriculumSessionDto.StartTime < cs.EndTime && createCurriculumSessionDto.EndTime > cs.StartTime))
                        .FirstOrDefaultAsync();

                    if (overlappingSession != null)
                    {
                        return BadRequest(new { 
                            message = $"Room is already occupied on {curriculumDay.ScheduleDate:yyyy-MM-dd} between {overlappingSession.StartTime:hh\\:mm} and {overlappingSession.EndTime:hh\\:mm}" 
                        });
                    }
                }

                // Teacher conflict check
                if (createCurriculumSessionDto.TeacherId.HasValue)
                {
                    var teacherId = createCurriculumSessionDto.TeacherId.Value;
                    var teacher = await _context.Teachers.FindAsync(teacherId);
                    if (teacher == null)
                        return BadRequest(new { message = "Teacher not found" });

                    // Check for overlapping sessions for the same teacher on the same day (TEACHING)
                    var teachingConflict = await _context.CurriculumSessions
                        .Include(cs => cs.CurriculumDay)
                        .Where(cs => cs.TeacherId == teacherId && 
                                    cs.CurriculumDay.ScheduleDate.Date == curriculumDay.ScheduleDate.Date)
                        .Where(cs => (createCurriculumSessionDto.StartTime < cs.EndTime && createCurriculumSessionDto.EndTime > cs.StartTime))
                        .FirstOrDefaultAsync();

                    if (teachingConflict != null)
                    {
                        return BadRequest(new { 
                            message = $"Teacher is already teaching on {curriculumDay.ScheduleDate:yyyy-MM-dd} between {teachingConflict.StartTime:hh\\:mm} and {teachingConflict.EndTime:hh\\:mm}" 
                        });
                    }
                    
                    // STRICT: Check if teacher is teaching ANY session that overlaps (including through curriculum participation)
                    var anyOverlap = await _context.CurriculumSessions
                        .Include(cs => cs.CurriculumDay)
                            .ThenInclude(cd => cd.Curriculum)
                        .Where(cs => cs.CurriculumDay.ScheduleDate.Date == curriculumDay.ScheduleDate.Date)
                        .Where(cs => cs.TeacherId == teacherId || 
                                    cs.CurriculumDay.Curriculum.ParticipantTeachers.Any(pt => pt.TeacherId == teacherId))
                        .Where(cs => (createCurriculumSessionDto.StartTime < cs.EndTime && createCurriculumSessionDto.EndTime > cs.StartTime))
                        .FirstOrDefaultAsync();
                        
                    if (anyOverlap != null)
                    {
                        return BadRequest(new { 
                            message = $"CONFLICT: Teacher already has a session on {curriculumDay.ScheduleDate:yyyy-MM-dd} from {anyOverlap.StartTime:hh\\:mm} to {anyOverlap.EndTime:hh\\:mm}. Cannot create overlapping schedule." 
                        });
                    }

                    // Check if teacher is a participant in any curriculum that has an overlapping session
                    var participatingConflict = await _context.CurriculumSessions
                        .Include(cs => cs.CurriculumDay)
                            .ThenInclude(cd => cd.Curriculum)
                                .ThenInclude(c => c.ParticipantTeachers)
                        .Where(cs => cs.CurriculumDay.ScheduleDate.Date == curriculumDay.ScheduleDate.Date)
                        .Where(cs => cs.CurriculumDay.Curriculum.ParticipantTeachers.Any(t => t.TeacherId == teacherId))
                        .Where(cs => (createCurriculumSessionDto.StartTime < cs.EndTime && createCurriculumSessionDto.EndTime > cs.StartTime))
                        .FirstOrDefaultAsync();

                    if (participatingConflict != null)
                    {
                        return BadRequest(new { 
                            message = $"Teacher is participating in another program session on {curriculumDay.ScheduleDate:yyyy-MM-dd} between {participatingConflict.StartTime:hh\\:mm} and {participatingConflict.EndTime:hh\\:mm}" 
                        });
                    }
                }

                // Check conflicts for each participant teacher of this curriculum
                if (curriculumDay.Curriculum.ParticipantTeachers != null)
                {
                    foreach (var participant in curriculumDay.Curriculum.ParticipantTeachers)
                    {
                        // Is this participant teaching another session at this time?
                        var ptTeachingConflict = await _context.CurriculumSessions
                            .Include(cs => cs.CurriculumDay)
                            .Where(cs => cs.TeacherId == participant.TeacherId && 
                                        cs.CurriculumDay.ScheduleDate.Date == curriculumDay.ScheduleDate.Date)
                            .Where(cs => (createCurriculumSessionDto.StartTime < cs.EndTime && createCurriculumSessionDto.EndTime > cs.StartTime))
                            .FirstOrDefaultAsync();

                        if (ptTeachingConflict != null)
                        {
                            return BadRequest(new { 
                                message = $"Participant teacher {participant.FullName} is already teaching on {curriculumDay.ScheduleDate:yyyy-MM-dd} between {ptTeachingConflict.StartTime:hh\\:mm} and {ptTeachingConflict.EndTime:hh\\:mm}" 
                            });
                        }

                        // Is this participant in another curriculum session at this time?
                        var ptParticipatingConflict = await _context.CurriculumSessions
                            .Include(cs => cs.CurriculumDay)
                                .ThenInclude(cd => cd.Curriculum)
                            .Where(cs => cs.CurriculumDay.CurriculumId != curriculumDay.CurriculumId && // Different curriculum
                                        cs.CurriculumDay.ScheduleDate.Date == curriculumDay.ScheduleDate.Date &&
                                        cs.CurriculumDay.Curriculum.ParticipantTeachers.Any(t => t.TeacherId == participant.TeacherId))
                            .Where(cs => (createCurriculumSessionDto.StartTime < cs.EndTime && createCurriculumSessionDto.EndTime > cs.StartTime))
                            .FirstOrDefaultAsync();

                        if (ptParticipatingConflict != null)
                        {
                            return BadRequest(new { 
                                message = $"Participant teacher {participant.FullName} is participating in another program session on {curriculumDay.ScheduleDate:yyyy-MM-dd} between {ptParticipatingConflict.StartTime:hh\\:mm} and {ptParticipatingConflict.EndTime:hh\\:mm}" 
                            });
                        }
                    }
                }

                var curriculumSession = new CurriculumSession
                {
                    CurriculumDayId = createCurriculumSessionDto.CurriculumDayId,
                    SessionNumber = createCurriculumSessionDto.SessionNumber,
                    StartTime = createCurriculumSessionDto.StartTime,
                    EndTime = createCurriculumSessionDto.EndTime,
                    SessionName = createCurriculumSessionDto.SessionName,
                    SessionDescription = createCurriculumSessionDto.SessionDescription,
                    RoomId = createCurriculumSessionDto.RoomId,
                    TeacherId = createCurriculumSessionDto.TeacherId,
                    DocumentId = createCurriculumSessionDto.DocumentId
                };

                _context.CurriculumSessions.Add(curriculumSession);
                
                // Update session count
                curriculumDay.SessionCount = await _context.CurriculumSessions
                    .CountAsync(cs => cs.CurriculumDayId == createCurriculumSessionDto.CurriculumDayId) + 1;

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCurriculumSessionById), new { id = curriculumSession.CurriculumSessionId }, 
                    MapCurriculumSessionToDto(curriculumSession));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating curriculum session");
                return StatusCode(500, new { message = "Error creating curriculum session", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a curriculum session by ID. (Lấy thông tin ca học theo ID.)
        /// </summary>
        /// <param name="id">Curriculum session ID (ID ca học)</param>
        /// <returns>Curriculum session details (Thông tin ca học)</returns>
        [HttpGet("session/{id}")]
        public async Task<ActionResult<CurriculumSessionDto>> GetCurriculumSessionById(int id)
        {
            try
            {
                var curriculumSession = await _context.CurriculumSessions
                    .Include(cs => cs.Lessons)
                    .Include(cs => cs.AssignedRoom)
                    .Include(cs => cs.Teacher)
                    .Include(cs => cs.Document)
                    .FirstOrDefaultAsync(cs => cs.CurriculumSessionId == id);

                if (curriculumSession == null)
                    return NotFound(new { message = "Curriculum session not found" });

                return Ok(MapCurriculumSessionToDto(curriculumSession));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting curriculum session {id}");
                return StatusCode(500, new { message = "Error retrieving curriculum session", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a curriculum session. (Cập nhật thông tin ca học.)
        /// </summary>
        /// <param name="id">Curriculum session ID (ID ca học)</param>
        /// <param name="updateCurriculumSessionDto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpPut("session/{id}")]
        public async Task<IActionResult> UpdateCurriculumSession(int id, [FromBody] UpdateCurriculumSessionDto updateCurriculumSessionDto)
        {
            try
            {
                var curriculumSession = await _context.CurriculumSessions
                    .Include(cs => cs.CurriculumDay)
                        .ThenInclude(cd => cd.Curriculum)
                            .ThenInclude(c => c.ParticipantTeachers)
                    .FirstOrDefaultAsync(cs => cs.CurriculumSessionId == id);

                if (curriculumSession == null)
                    return NotFound(new { message = "Curriculum session not found" });

                // Validate times
                if (updateCurriculumSessionDto.StartTime >= updateCurriculumSessionDto.EndTime)
                    return BadRequest(new { message = "Start time must be before end time" });

                // Room conflict check
                if (updateCurriculumSessionDto.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(updateCurriculumSessionDto.RoomId.Value);
                    if (room == null)
                        return BadRequest(new { message = "Room not found" });

                    // Check for overlapping sessions in the same room on the same day (excluding itself)
                    var overlappingSession = await _context.CurriculumSessions
                        .Include(cs => cs.CurriculumDay)
                        .Where(cs => cs.CurriculumSessionId != id &&
                                    cs.RoomId == updateCurriculumSessionDto.RoomId.Value && 
                                    cs.CurriculumDay.ScheduleDate.Date == curriculumSession.CurriculumDay.ScheduleDate.Date)
                        .Where(cs => (updateCurriculumSessionDto.StartTime < cs.EndTime && updateCurriculumSessionDto.EndTime > cs.StartTime))
                        .FirstOrDefaultAsync();

                    if (overlappingSession != null)
                    {
                        return BadRequest(new { 
                            message = $"Room is already occupied on {curriculumSession.CurriculumDay.ScheduleDate:yyyy-MM-dd} between {overlappingSession.StartTime:hh\\:mm} and {overlappingSession.EndTime:hh\\:mm}" 
                        });
                    }
                }

                // Teacher conflict check
                if (updateCurriculumSessionDto.TeacherId.HasValue)
                {
                    var teacherId = updateCurriculumSessionDto.TeacherId.Value;
                    var teacher = await _context.Teachers.FindAsync(teacherId);
                    if (teacher == null)
                        return BadRequest(new { message = "Teacher not found" });

                    // Check for overlapping sessions for the same teacher on the same day (TEACHING, excluding itself)
                    var teachingConflict = await _context.CurriculumSessions
                        .Include(cs => cs.CurriculumDay)
                        .Where(cs => cs.CurriculumSessionId != id &&
                                    cs.TeacherId == teacherId && 
                                    cs.CurriculumDay.ScheduleDate.Date == curriculumSession.CurriculumDay.ScheduleDate.Date)
                        .Where(cs => (updateCurriculumSessionDto.StartTime < cs.EndTime && updateCurriculumSessionDto.EndTime > cs.StartTime))
                        .FirstOrDefaultAsync();

                    if (teachingConflict != null)
                    {
                        return BadRequest(new { 
                            message = $"Teacher is already teaching on {curriculumSession.CurriculumDay.ScheduleDate:yyyy-MM-dd} between {teachingConflict.StartTime:hh\\:mm} and {teachingConflict.EndTime:hh\\:mm}" 
                        });
                    }

                    // Check if teacher is a participant in any curriculum that has an overlapping session
                    // Note: We don't exclude the current session's curriculum if it's the same curriculum because 
                    // a teacher could be a participant in THIS curriculum but they shouldn't have overlapping 
                    // sessions within it either? Actually, if they are the TEACHER of this session, they are 
                    // participating in it. So we should probably exclude sessions of THIS curriculum day's session id?
                    // But `CurriculumSession` doesn't store participants, the `Curriculum` does.
                    // So we check if they are in ANY other session.
                    var participatingConflict = await _context.CurriculumSessions
                        .Include(cs => cs.CurriculumDay)
                            .ThenInclude(cd => cd.Curriculum)
                                .ThenInclude(c => c.ParticipantTeachers)
                        .Where(cs => cs.CurriculumSessionId != id && // Exclude self
                                    cs.CurriculumDay.ScheduleDate.Date == curriculumSession.CurriculumDay.ScheduleDate.Date &&
                                    cs.CurriculumDay.Curriculum.ParticipantTeachers.Any(t => t.TeacherId == teacherId))
                        .Where(cs => (updateCurriculumSessionDto.StartTime < cs.EndTime && updateCurriculumSessionDto.EndTime > cs.StartTime))
                        .FirstOrDefaultAsync();

                    if (participatingConflict != null)
                    {
                        return BadRequest(new { 
                            message = $"Teacher is participating in another program session on {curriculumSession.CurriculumDay.ScheduleDate:yyyy-MM-dd} between {participatingConflict.StartTime:hh\\:mm} and {participatingConflict.EndTime:hh\\:mm}" 
                        });
                    }
                }

                // Check conflicts for each participant teacher of this curriculum
                if (curriculumSession.CurriculumDay.Curriculum.ParticipantTeachers != null)
                {
                    foreach (var participant in curriculumSession.CurriculumDay.Curriculum.ParticipantTeachers)
                    {
                        // Is this participant teaching another session at this time? (excluding current session)
                        var ptTeachingConflict = await _context.CurriculumSessions
                            .Include(cs => cs.CurriculumDay)
                            .Where(cs => cs.CurriculumSessionId != id && // Exclude self
                                        cs.TeacherId == participant.TeacherId && 
                                        cs.CurriculumDay.ScheduleDate.Date == curriculumSession.CurriculumDay.ScheduleDate.Date)
                            .Where(cs => (updateCurriculumSessionDto.StartTime < cs.EndTime && updateCurriculumSessionDto.EndTime > cs.StartTime))
                            .FirstOrDefaultAsync();

                        if (ptTeachingConflict != null)
                        {
                            return BadRequest(new { 
                                message = $"Participant teacher {participant.FullName} is already teaching on {curriculumSession.CurriculumDay.ScheduleDate:yyyy-MM-dd} between {ptTeachingConflict.StartTime:hh\\:mm} and {ptTeachingConflict.EndTime:hh\\:mm}" 
                            });
                        }

                        // Is this participant in another curriculum session at this time?
                        var ptParticipatingConflict = await _context.CurriculumSessions
                            .Include(cs => cs.CurriculumDay)
                                .ThenInclude(cd => cd.Curriculum)
                            .Where(cs => cs.CurriculumSessionId != id && // Exclude self
                                        cs.CurriculumDay.CurriculumId != curriculumSession.CurriculumDay.CurriculumId && // Different curriculum
                                        cs.CurriculumDay.ScheduleDate.Date == curriculumSession.CurriculumDay.ScheduleDate.Date &&
                                        cs.CurriculumDay.Curriculum.ParticipantTeachers.Any(t => t.TeacherId == participant.TeacherId))
                            .Where(cs => (updateCurriculumSessionDto.StartTime < cs.EndTime && updateCurriculumSessionDto.EndTime > cs.StartTime))
                            .FirstOrDefaultAsync();

                        if (ptParticipatingConflict != null)
                        {
                            return BadRequest(new { 
                                message = $"Participant teacher {participant.FullName} is participating in another program session on {curriculumSession.CurriculumDay.ScheduleDate:yyyy-MM-dd} between {ptParticipatingConflict.StartTime:hh\\:mm} and {ptParticipatingConflict.EndTime:hh\\:mm}" 
                            });
                        }
                    }
                }

                curriculumSession.StartTime = updateCurriculumSessionDto.StartTime;
                curriculumSession.EndTime = updateCurriculumSessionDto.EndTime;
                curriculumSession.SessionName = updateCurriculumSessionDto.SessionName;
                curriculumSession.SessionDescription = updateCurriculumSessionDto.SessionDescription;
                curriculumSession.RoomId = updateCurriculumSessionDto.RoomId;
                curriculumSession.TeacherId = updateCurriculumSessionDto.TeacherId;
                curriculumSession.DocumentId = updateCurriculumSessionDto.DocumentId;

                _context.CurriculumSessions.Update(curriculumSession);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Curriculum session updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating curriculum session {id}");
                return StatusCode(500, new { message = "Error updating curriculum session", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a curriculum session. (Xóa thông tin ca học.)
        /// </summary>
        /// <param name="id">Curriculum session ID (ID ca học)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpDelete("session/{id}")]
        public async Task<IActionResult> DeleteCurriculumSession(int id)
        {
            try
            {
                var curriculumSession = await _context.CurriculumSessions.FindAsync(id);
                if (curriculumSession == null)
                    return NotFound(new { message = "Curriculum session not found" });

                var curriculumDayId = curriculumSession.CurriculumDayId;

                _context.CurriculumSessions.Remove(curriculumSession);
                
                // Update session count
                var curriculumDay = await _context.CurriculumDays.FindAsync(curriculumDayId);
                if (curriculumDay != null)
                {
                    curriculumDay.SessionCount = await _context.CurriculumSessions
                        .CountAsync(cs => cs.CurriculumDayId == curriculumDayId);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Curriculum session deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting curriculum session {id}");
                return StatusCode(500, new { message = "Error deleting curriculum session", error = ex.Message });
            }
        }

        // LESSONS

        /// <summary>
        /// Creates a new lesson. (Tạo mới một bài học/buổi học.)
        /// </summary>
        /// <param name="createLessonDto">Lesson creation data (Dữ liệu tạo bài học)</param>
        /// <returns>Created lesson (Thông tin bài học vừa tạo)</returns>
        [HttpPost("lesson")]
        public async Task<ActionResult<LessonDto>> CreateLesson([FromBody] CreateLessonDto createLessonDto)
        {
            try
            {
                var curriculumSession = await _context.CurriculumSessions.FindAsync(createLessonDto.CurriculumSessionId);
                if (curriculumSession == null)
                    return BadRequest(new { message = "Curriculum session not found" });

                var lesson = new Lesson
                {
                    CurriculumSessionId = createLessonDto.CurriculumSessionId,
                    LessonNumber = createLessonDto.LessonNumber,
                    LessonTitle = createLessonDto.LessonTitle,
                    Content = createLessonDto.Content,
                    Duration = createLessonDto.Duration,
                    Resources = createLessonDto.Resources,
                    Notes = createLessonDto.Notes
                };

                _context.Lessons.Add(lesson);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetLessonById), new { id = lesson.LessonId }, MapLessonToDto(lesson));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating lesson");
                return StatusCode(500, new { message = "Error creating lesson", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a lesson by ID. (Lấy thông tin bài học theo ID.)
        /// </summary>
        /// <param name="id">Lesson ID (ID bài học)</param>
        /// <returns>Lesson details (Thông tin bài học)</returns>
        [HttpGet("lesson/{id}")]
        public async Task<ActionResult<LessonDto>> GetLessonById(int id)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null)
                    return NotFound(new { message = "Lesson not found" });

                return Ok(MapLessonToDto(lesson));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting lesson {id}");
                return StatusCode(500, new { message = "Error retrieving lesson", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a lesson. (Cập nhật thông tin bài học.)
        /// </summary>
        /// <param name="id">Lesson ID (ID bài học)</param>
        /// <param name="updateLessonDto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpPut("lesson/{id}")]
        public async Task<IActionResult> UpdateLesson(int id, [FromBody] UpdateLessonDto updateLessonDto)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null)
                    return NotFound(new { message = "Lesson not found" });

                lesson.LessonTitle = updateLessonDto.LessonTitle;
                lesson.Content = updateLessonDto.Content;
                lesson.Duration = updateLessonDto.Duration;
                lesson.Resources = updateLessonDto.Resources;
                lesson.Notes = updateLessonDto.Notes;

                _context.Lessons.Update(lesson);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Lesson updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating lesson {id}");
                return StatusCode(500, new { message = "Error updating lesson", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a lesson. (Xóa thông tin bài học.)
        /// </summary>
        /// <param name="id">Lesson ID (ID bài học)</param>
        /// <returns>Success message (Thông báo thành công)</returns>
        [HttpDelete("lesson/{id}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null)
                    return NotFound(new { message = "Lesson not found" });

                _context.Lessons.Remove(lesson);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Lesson deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting lesson {id}");
                return StatusCode(500, new { message = "Error deleting lesson", error = ex.Message });
            }
        }

        // Helper methods

        private CurriculumDto MapCurriculumToDto(Curriculum curriculum)
        {
            return new CurriculumDto
            {
                CurriculumId = curriculum.CurriculumId,
                CurriculumName = curriculum.CurriculumName,
                StartDate = curriculum.StartDate,
                EndDate = curriculum.EndDate,
                Description = curriculum.Description,
                CreatedDate = curriculum.CreatedDate,
                ModifiedDate = curriculum.ModifiedDate,
                Status = curriculum.Status,
                Courses = curriculum.CurriculumCourses?.Select(cc => new CurriculumCourseInfoDto
                {
                    CourseId = cc.Course.CourseId,
                    CourseName = cc.Course.CourseName,
                    CourseCode = cc.Course.CourseCode,
                    OrderIndex = cc.OrderIndex
                }).ToList() ?? new List<CurriculumCourseInfoDto>(),
                CurriculumDays = curriculum.CurriculumDays?.Select(cd => MapCurriculumDayToDto(cd)).ToList() ?? new List<CurriculumDayDto>(),
                ParticipantTeachers = curriculum.ParticipantTeachers?.Select(t => new TeacherDto
                {
                    TeacherId = t.TeacherId,
                    FullName = t.FullName,
                    Email = t.Email,
                    PhoneNumber = t.PhoneNumber,
                    Specialization = t.Specialization,
                    Qualifications = t.Qualifications,
                    HireDate = t.HireDate,
                    HourlyRate = t.HourlyRate,
                    IsActive = t.IsActive
                }).ToList() ?? new List<TeacherDto>()
            };
        }

        private CurriculumDayDto MapCurriculumDayToDto(CurriculumDay curriculumDay)
        {
            return new CurriculumDayDto
            {
                CurriculumDayId = curriculumDay.CurriculumDayId,
                CurriculumId = curriculumDay.CurriculumId,
                ScheduleDate = curriculumDay.ScheduleDate,
                Topic = curriculumDay.Topic,
                Description = curriculumDay.Description,
                SessionCount = curriculumDay.SessionCount,
                CurriculumSessions = curriculumDay.CurriculumSessions?.Select(cs => MapCurriculumSessionToDto(cs)).ToList() ?? new List<CurriculumSessionDto>()
            };
        }

        private CurriculumSessionDto MapCurriculumSessionToDto(CurriculumSession curriculumSession)
        {
            return new CurriculumSessionDto
            {
                CurriculumSessionId = curriculumSession.CurriculumSessionId,
                CurriculumDayId = curriculumSession.CurriculumDayId,
                SessionNumber = curriculumSession.SessionNumber,
                StartTime = curriculumSession.StartTime,
                EndTime = curriculumSession.EndTime,
                SessionName = curriculumSession.SessionName,
                SessionDescription = curriculumSession.SessionDescription,
                RoomId = curriculumSession.RoomId,
                RoomName = curriculumSession.AssignedRoom?.RoomName ?? string.Empty,
                TeacherId = curriculumSession.TeacherId,
                TeacherName = curriculumSession.Teacher?.FullName ?? string.Empty,
                DocumentId = curriculumSession.DocumentId,
                DocumentTitle = curriculumSession.Document?.OriginalFileName,
                Lessons = curriculumSession.Lessons?.Select(l => MapLessonToDto(l)).ToList() ?? new List<LessonDto>(),
                StudentCount = curriculumSession.SessionStudents?.Count ?? 0
            };
        }

        private LessonDto MapLessonToDto(Lesson lesson)
        {
            return new LessonDto
            {
                LessonId = lesson.LessonId,
                CurriculumSessionId = lesson.CurriculumSessionId,
                LessonNumber = lesson.LessonNumber,
                LessonTitle = lesson.LessonTitle,
                Content = lesson.Content,
                Duration = lesson.Duration,
                Resources = lesson.Resources,
                Notes = lesson.Notes
            };
        }

        // ==================== CURRICULUM STUDENTS ====================

        /// <summary>
        /// Gets all students from all sessions in a curriculum. (Lấy tất cả học viên từ các buổi học.)
        /// </summary>
        [HttpGet("{id}/students")]
        public async Task<ActionResult<object>> GetCurriculumStudents(int id)
        {
            try
            {
                // Get all sessions with their students
                var sessions = await _context.CurriculumSessions
                    .Include(cs => cs.CurriculumDay)
                    .Include(cs => cs.AssignedRoom)
                    .Include(cs => cs.SessionStudents)
                        .ThenInclude(ss => ss.Student)
                    .Where(cs => cs.CurriculumDay.CurriculumId == id)
                    .ToListAsync();

                // Get unique students from all sessions
                var students = sessions
                    .SelectMany(cs => cs.SessionStudents)
                    .Select(ss => ss.Student)
                    .Where(s => s != null && s.IsActive)
                    .DistinctBy(s => s!.StudentId)
                    .Select(s => new
                    {
                        s!.StudentId,
                        s.FullName,
                        s.Email,
                        s.PhoneNumber,
                        s.Level,
                        s.IsActive,
                        s.DateOfBirth,
                        s.Address,
                        s.EnrollmentDate
                    })
                    .ToList();

                // Get session capacity info
                var sessionCapacities = sessions
                    .Where(cs => cs.RoomId.HasValue && cs.AssignedRoom != null)
                    .Select(cs => new
                    {
                        cs.CurriculumSessionId,
                        cs.SessionName,
                        cs.CurriculumDay.ScheduleDate,
                        RoomName = cs.AssignedRoom!.RoomName,
                        RoomCapacity = cs.AssignedRoom!.Capacity
                    })
                    .ToList();

                var minCapacity = sessionCapacities.Any() ? sessionCapacities.Min(s => s.RoomCapacity) : (int?)null;
                var totalCount = students.Count;
                int? availableSlots = minCapacity.HasValue ? minCapacity.Value - totalCount : (int?)null;
                
                return Ok(new
                {
                    students,
                    totalCount,
                    maxCapacity = minCapacity,
                    availableSlots,
                    sessions = sessionCapacities
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting curriculum students", error = ex.Message });
            }
        }
    
        /// <summary>
        /// Removes a student from a curriculum. (Xóa học viên khỏi chương trình học.)
        /// </summary>
        [HttpDelete("{id}/students/{studentId}")]
        public async Task<IActionResult> RemoveStudentFromCurriculum(int id, int studentId)
        {
            try
            {
                var curriculum = await _context.Curriculums
                    .Include(c => c.ParticipantStudents)
                    .FirstOrDefaultAsync(c => c.CurriculumId == id);

                if (curriculum == null)
                    return NotFound(new { message = "Curriculum not found" });

                var student = curriculum.ParticipantStudents.FirstOrDefault(s => s.StudentId == studentId);
                if (student == null)
                    return NotFound(new { message = "Student not found in this curriculum" });

                curriculum.ParticipantStudents.Remove(student);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Student removed from curriculum successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error removing student from curriculum", error = ex.Message });
            }
        }

        // ==================== SESSION STUDENTS ====================

        /// <summary>
        /// Gets all students registered for a specific session. (Lấy danh sách học viên đăng ký buổi học.)
        /// </summary>
        [HttpGet("session/{sessionId}/students")]
        public async Task<ActionResult<object>> GetSessionStudents(int sessionId)
        {
            try
            {
                var session = await _context.CurriculumSessions
                    .Include(cs => cs.CurriculumDay)
                    .Include(cs => cs.AssignedRoom)
                    .Include(cs => cs.SessionStudents)
                    .ThenInclude(ss => ss.Student)
                    .FirstOrDefaultAsync(cs => cs.CurriculumSessionId == sessionId);

                if (session == null)
                    return NotFound(new { message = "Session not found" });

                var students = session.SessionStudents.Select(ss => new
                {
                    ss.SessionStudentId,
                    ss.Student.StudentId,
                    ss.Student.FullName,
                    ss.Student.Email,
                    ss.Student.PhoneNumber,
                    ss.Student.Level,
                    ss.RegistrationDate,
                    ss.Notes
                }).ToList();

                int? maxCapacity = session.AssignedRoom?.Capacity;
                int totalCount = students.Count;
                int? availableSlots = maxCapacity.HasValue ? maxCapacity.Value - totalCount : (int?)null;

                return Ok(new
                {
                    sessionId = session.CurriculumSessionId,
                    sessionName = session.SessionName,
                    roomName = session.AssignedRoom?.RoomName,
                    maxCapacity,
                    totalCount,
                    availableSlots,
                    students
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting session students", error = ex.Message });
            }
        }

        /// <summary>
        /// Registers a student to a specific session. (Đăng ký học viên vào buổi học.)
        /// </summary>
        [HttpPost("session/{sessionId}/students")]
        public async Task<IActionResult> AddStudentToSession(int sessionId, [FromBody] AddStudentToSessionDto dto)
        {
            try
            {
                var session = await _context.CurriculumSessions
                    .Include(cs => cs.AssignedRoom)
                    .Include(cs => cs.SessionStudents)
                    .Include(cs => cs.CurriculumDay)
                        .ThenInclude(cd => cd.Curriculum)
                    .FirstOrDefaultAsync(cs => cs.CurriculumSessionId == sessionId);

                if (session == null)
                    return NotFound(new { message = "Session not found" });

                var student = await _context.Students.FindAsync(dto.StudentId);
                if (student == null)
                    return NotFound(new { message = "Student not found" });

                // Check if already registered
                if (session.SessionStudents.Any(ss => ss.StudentId == dto.StudentId))
                    return BadRequest(new { message = "Student already registered for this session" });

                // Check room capacity
                if (session.AssignedRoom != null)
                {
                    var currentCount = session.SessionStudents.Count;
                    if (currentCount >= session.AssignedRoom.Capacity)
                    {
                        return BadRequest(new
                        {
                            message = $"Cannot register. Room {session.AssignedRoom.RoomName} has reached capacity ({session.AssignedRoom.Capacity} students)."
                        });
                    }
                }

                // Check if student has paid for the curriculum
                var curriculumId = session.CurriculumDay.CurriculumId;
                var curriculum = await _context.Curriculums
                    .Include(c => c.CurriculumCourses)
                    .FirstOrDefaultAsync(c => c.CurriculumId == curriculumId);
                
                if (curriculum != null)
                {
                    var courseIds = curriculum.CurriculumCourses.Select(cc => cc.CourseId).ToList();
                    var hasPaid = await _context.Payments
                        .AnyAsync(p => p.StudentId == dto.StudentId 
                            && p.Status == "Completed"
                            && p.PaymentCourses.Any(pc => courseIds.Contains(pc.CourseId)));
                    
                    if (!hasPaid)
                    {
                        return BadRequest(new 
                        { 
                            message = "Học viên chưa thanh toán khóa học này. Vui lòng hoàn tất thanh toán trước khi tham gia buổi học."
                        });
                    }
                }

                var sessionStudent = new SessionStudent
                {
                    CurriculumSessionId = sessionId,
                    StudentId = dto.StudentId,
                    Notes = dto.Notes ?? string.Empty
                };

                _context.SessionStudents.Add(sessionStudent);
                await _context.SaveChangesAsync();

                // Create activity log for student enrollment
                await _activityLogService.LogStudentEnrolledAsync(
                    studentId: dto.StudentId,
                    curriculumId: session.CurriculumDay.CurriculumId,
                    curriculumName: session.CurriculumDay.Curriculum.CurriculumName
                );

                return Ok(new { message = "Student registered to session successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error registering student to session", error = ex.Message });
            }
        }

        /// <summary>
        /// Removes a student from a specific session. (Hủy đăng ký học viên khỏi buổi học.)
        /// </summary>
        [HttpDelete("session/{sessionId}/students/{studentId}")]
        public async Task<IActionResult> RemoveStudentFromSession(int sessionId, int studentId)
        {
            try
            {
                var sessionStudent = await _context.SessionStudents
                    .FirstOrDefaultAsync(ss => ss.CurriculumSessionId == sessionId && ss.StudentId == studentId);

                if (sessionStudent == null)
                    return NotFound(new { message = "Student not found in this session" });

                _context.SessionStudents.Remove(sessionStudent);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Student removed from session successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error removing student from session", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets available students for a session from enrolled courses. (Lấy danh sách học viên từ khóa học.)
        /// </summary>
        [HttpGet("session/{sessionId}/available-students")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableStudentsForSession(int sessionId)
        {
            try
            {
                var session = await _context.CurriculumSessions
                    .Include(cs => cs.CurriculumDay)
                    .ThenInclude(cd => cd.Curriculum)
                        .ThenInclude(c => c.CurriculumCourses)
                            .ThenInclude(cc => cc.Course)
                    .FirstOrDefaultAsync(cs => cs.CurriculumSessionId == sessionId);

                if (session == null)
                    return NotFound(new { message = "Session not found" });
    
                // Get students registered for this session
                var registeredIds = await _context.SessionStudents
                    .Where(ss => ss.CurriculumSessionId == sessionId)
                    .Select(ss => ss.StudentId)
                    .ToListAsync();

                // Get course IDs from curriculum
                var curriculum = session.CurriculumDay.Curriculum;
                var courseIds = curriculum.CurriculumCourses.Select(cc => cc.CourseId).ToList();

                // Get students from CourseEnrollments
                var studentsFromCourses = await _context.CourseEnrollments
                    .Where(ce => courseIds.Contains(ce.CourseId) && ce.Status == "Active")
                    .Include(ce => ce.Student)
                    .Select(ce => ce.Student)
                    .Where(s => s.IsActive && !registeredIds.Contains(s.StudentId))
                    .Distinct()
                    .Select(s => new
                    {
                        s.StudentId,
                        s.FullName,
                        s.Email,
                        s.PhoneNumber,
                        s.Level
                    })
                    .ToListAsync();

                return Ok(studentsFromCourses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting available students", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets all curriculums for a specific teacher. (Lấy danh sách khóa học của giảng viên.)
        /// </summary>
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCurriculumsByTeacher(int teacherId)
        {
            try
            {
                var curriculums = await _context.Curriculums
                    .Include(c => c.CurriculumCourses)
                        .ThenInclude(cc => cc.Course)
                    .Include(c => c.ParticipantStudents)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.AssignedRoom)
                    .Include(c => c.CurriculumDays)
                        .ThenInclude(cd => cd.CurriculumSessions)
                            .ThenInclude(cs => cs.Teacher)
                    .Where(c => c.CurriculumDays.Any(cd => cd.CurriculumSessions.Any(cs => cs.TeacherId == teacherId)))
                    .Select(c => new
                    {
                        curriculumId = c.CurriculumId,
                        curriculumName = c.CurriculumName,
                        courseName = string.Join(", ", c.CurriculumCourses.Select(cc => cc.Course.CourseName)),
                        startDate = c.StartDate,
                        endDate = c.EndDate,
                        status = c.Status,
                        roomName = c.CurriculumDays.SelectMany(cd => cd.CurriculumSessions).Where(cs => cs.TeacherId == teacherId).Select(cs => cs.AssignedRoom!.RoomName).FirstOrDefault(),
                        teacherName = c.CurriculumDays.SelectMany(cd => cd.CurriculumSessions).Where(cs => cs.TeacherId == teacherId).Select(cs => cs.Teacher!.FullName).FirstOrDefault(),
                        currentStudents = c.ParticipantStudents.Count,
                        maxStudents = c.CurriculumDays.SelectMany(cd => cd.CurriculumSessions).Where(cs => cs.TeacherId == teacherId && cs.AssignedRoom != null).Select(cs => cs.AssignedRoom!.Capacity).FirstOrDefault(),
                        progress = c.StartDate != default && c.EndDate != default && c.EndDate > c.StartDate
                            ? Math.Min(100, Math.Max(0, (int)((DateTime.UtcNow - c.StartDate).TotalDays / (c.EndDate - c.StartDate).TotalDays * 100)))
                            : 0
                    })
                    .ToListAsync();

                return Ok(curriculums);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting teacher curriculums", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets students for sessions taught by a specific teacher. (Lấy danh sách học viên theo buổi giảng viên dạy.)
        /// </summary>
        [HttpGet("teacher/{teacherId}/students")]
        public async Task<ActionResult<object>> GetStudentsByTeacherSessions(int teacherId)
        {
            try
            {
                // Get all sessions taught by this teacher
                var teacherSessions = await _context.CurriculumSessions
                    .Include(cs => cs.CurriculumDay)
                    .Include(cs => cs.SessionStudents)
                        .ThenInclude(ss => ss.Student)
                    .Where(cs => cs.TeacherId == teacherId)
                    .ToListAsync();

                // Get unique students from all sessions
                var students = teacherSessions
                    .SelectMany(cs => cs.SessionStudents)
                    .Select(ss => ss.Student)
                    .Where(s => s != null)
                    .DistinctBy(s => s!.StudentId)
                    .Select(s => new
                    {
                        s!.StudentId,
                        s.FullName,
                        s.Email,
                        s.PhoneNumber,
                        s.Level,
                        s.IsActive,
                        s.DateOfBirth,
                        s.Address,
                        s.EnrollmentDate
                    })
                    .ToList();

                // Get session info
                var sessions = teacherSessions.Select(cs => new
                {
                    cs.CurriculumSessionId,
                    cs.SessionName,
                    scheduleDate = cs.CurriculumDay.ScheduleDate,
                    studentCount = cs.SessionStudents.Count
                }).ToList();

                return Ok(new
                {
                    students,
                    totalCount = students.Count,
                    sessions
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting students by teacher sessions", error = ex.Message });
            }
        }

    }
}
