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
                    Status = "Draft",
                    CreatedDate = DateTime.Now
                };

                _context.Curriculums.Add(curriculum);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCurriculumById), new { id = curriculum.CurriculumId }, MapCurriculumToDto(curriculum));
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
                var curriculum = await _context.Curriculums.FindAsync(id);
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

                var curriculumDay = await _context.CurriculumDays.FindAsync(createCurriculumSessionDto.CurriculumDayId);
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

                var curriculumSession = new CurriculumSession
                {
                    CurriculumDayId = createCurriculumSessionDto.CurriculumDayId,
                    SessionNumber = createCurriculumSessionDto.SessionNumber,
                    StartTime = createCurriculumSessionDto.StartTime,
                    EndTime = createCurriculumSessionDto.EndTime,
                    SessionName = createCurriculumSessionDto.SessionName,
                    SessionDescription = createCurriculumSessionDto.SessionDescription,
                    Room = createCurriculumSessionDto.Room
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
                var curriculumSession = await _context.CurriculumSessions.FindAsync(id);
                if (curriculumSession == null)
                    return NotFound(new { message = "Curriculum session not found" });

                // Validate times
                if (updateCurriculumSessionDto.StartTime >= updateCurriculumSessionDto.EndTime)
                    return BadRequest(new { message = "Start time must be before end time" });

                curriculumSession.StartTime = updateCurriculumSessionDto.StartTime;
                curriculumSession.EndTime = updateCurriculumSessionDto.EndTime;
                curriculumSession.SessionName = updateCurriculumSessionDto.SessionName;
                curriculumSession.SessionDescription = updateCurriculumSessionDto.SessionDescription;
                curriculumSession.Room = updateCurriculumSessionDto.Room;

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
                CurriculumDays = curriculum.CurriculumDays?.Select(cd => MapCurriculumDayToDto(cd)).ToList() ?? new List<CurriculumDayDto>()
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
                Room = curriculumSession.Room,
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
