using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CurriculumController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CurriculumController> _logger;

        public CurriculumController(ApplicationDbContext context, ILogger<CurriculumController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/curriculum
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CurriculumDto>>> GetAllCurriculums()
        {
            try
            {
                var curriculums = await _context.Curriculums
                    .Include(c => c.Class)
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
                _logger.LogError(ex, "Error getting all curriculums");
                return StatusCode(500, new { message = "Error retrieving curriculums", error = ex.Message });
            }
        }

        // GET: api/curriculum/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CurriculumDto>> GetCurriculumById(int id)
        {
            try
            {
                var curriculum = await _context.Curriculums
                    .Include(c => c.Class)
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

        // GET: api/curriculum/class/5
        [HttpGet("class/{classId}")]
        public async Task<ActionResult<IEnumerable<CurriculumDto>>> GetCurriculumsByClass(int classId)
        {
            try
            {
                var curriculums = await _context.Curriculums
                    .Where(c => c.ClassId == classId)
                    .Include(c => c.Class)
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
                _logger.LogError(ex, $"Error getting curriculums for class {classId}");
                return StatusCode(500, new { message = "Error retrieving curriculums", error = ex.Message });
            }
        }

        // POST: api/curriculum
        [HttpPost]
        public async Task<ActionResult<CurriculumDto>> CreateCurriculum([FromBody] CreateCurriculumDto createCurriculumDto)
        {
            try
            {
                // Validate class exists
                var classExists = await _context.Classes.AnyAsync(c => c.ClassId == createCurriculumDto.ClassId);
                if (!classExists)
                    return BadRequest(new { message = "Class not found" });

                // Validate dates
                if (createCurriculumDto.StartDate >= createCurriculumDto.EndDate)
                    return BadRequest(new { message = "Start date must be before end date" });

                var curriculum = new Curriculum
                {
                    CurriculumName = createCurriculumDto.CurriculumName,
                    ClassId = createCurriculumDto.ClassId,
                    StartDate = createCurriculumDto.StartDate,
                    EndDate = createCurriculumDto.EndDate,
                    Description = createCurriculumDto.Description,
                    Status = "Active",
                    CreatedDate = DateTime.Now
                };

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
                    .Include(c => c.Class)
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

        // PUT: api/curriculum/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCurriculum(int id, [FromBody] UpdateCurriculumDto updateCurriculumDto)
        {
            try
            {
                var curriculum = await _context.Curriculums
                    .Include(c => c.ParticipantTeachers)
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

        // DELETE: api/curriculum/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCurriculum(int id)
        {
            try
            {
                var curriculum = await _context.Curriculums.FindAsync(id);
                if (curriculum == null)
                    return NotFound(new { message = "Curriculum not found" });

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

        // POST: api/curriculum/day
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

        // GET: api/curriculum/day/5
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

        // PUT: api/curriculum/day/5
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

        // DELETE: api/curriculum/day/5
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

        // POST: api/curriculum/session
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

                    // Check room availability hours
                    if (createCurriculumSessionDto.StartTime < room.AvailableStartTime || createCurriculumSessionDto.EndTime > room.AvailableEndTime)
                    {
                        return BadRequest(new { 
                            message = $"Room is only available between {room.AvailableStartTime:hh\\:mm} and {room.AvailableEndTime:hh\\:mm}" 
                        });
                    }

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
                    TeacherId = createCurriculumSessionDto.TeacherId
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

        // GET: api/curriculum/session/5
        [HttpGet("session/{id}")]
        public async Task<ActionResult<CurriculumSessionDto>> GetCurriculumSessionById(int id)
        {
            try
            {
                var curriculumSession = await _context.CurriculumSessions
                    .Include(cs => cs.Lessons)
                    .Include(cs => cs.AssignedRoom)
                    .Include(cs => cs.Teacher)
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

        // PUT: api/curriculum/session/5
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

                    // Check room availability hours
                    if (updateCurriculumSessionDto.StartTime < room.AvailableStartTime || updateCurriculumSessionDto.EndTime > room.AvailableEndTime)
                    {
                        return BadRequest(new { 
                            message = $"Room is only available between {room.AvailableStartTime:hh\\:mm} and {room.AvailableEndTime:hh\\:mm}" 
                        });
                    }

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

        // DELETE: api/curriculum/session/5
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

        // POST: api/curriculum/lesson
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

        // GET: api/curriculum/lesson/5
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

        // PUT: api/curriculum/lesson/5
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

        // DELETE: api/curriculum/lesson/5
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
                ClassId = curriculum.ClassId,
                ClassName = curriculum.Class?.ClassName ?? string.Empty,
                StartDate = curriculum.StartDate,
                EndDate = curriculum.EndDate,
                Description = curriculum.Description,
                CreatedDate = curriculum.CreatedDate,
                ModifiedDate = curriculum.ModifiedDate,
                Status = curriculum.Status,
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
                Lessons = curriculumSession.Lessons?.Select(l => MapLessonToDto(l)).ToList() ?? new List<LessonDto>()
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
    }
}
