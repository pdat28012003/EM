using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeacherAvailabilityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TeacherAvailabilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all availability slots for a teacher
        /// </summary>
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<TeacherAvailability>>> GetByTeacher(int teacherId)
        {
            var availabilities = await _context.TeacherAvailabilities
                .Where(a => a.TeacherId == teacherId && a.IsActive)
                .OrderBy(a => a.DayOfWeek)
                .ThenBy(a => a.StartTime)
                .ToListAsync();

            return Ok(availabilities);
        }

        /// <summary>
        /// Gets all available teachers for a specific time slot
        /// </summary>
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableTeachers(
            [FromQuery] DayOfWeek dayOfWeek,
            [FromQuery] TimeSpan startTime,
            [FromQuery] TimeSpan endTime,
            [FromQuery] DateTime? specificDate = null)
        {
            // Query teachers who have availability covering this time slot
            var query = _context.TeacherAvailabilities
                .Where(a => a.IsActive &&
                            a.DayOfWeek == dayOfWeek &&
                            a.StartTime <= startTime &&
                            a.EndTime >= endTime);
            
            // If specific date provided, filter by recurring OR matching specific date
            // Otherwise only get recurring slots
            if (specificDate.HasValue)
            {
                query = query.Where(a => a.IsRecurring || 
                                        (a.SpecificDate.HasValue && a.SpecificDate.Value.Date == specificDate.Value.Date));
            }
            else
            {
                query = query.Where(a => a.IsRecurring);
            }
            
            var availableTeacherIds = await query
                .Select(a => a.TeacherId)
                .Distinct()
                .ToListAsync();

            // Check if teacher already has conflicting curriculum session
            // Filter by teacher IDs and time overlap first, then bring to memory for DayOfWeek check
            var potentialConflicts = await _context.CurriculumSessions
                .Include(cs => cs.CurriculumDay)
                .Where(cs => cs.TeacherId.HasValue &&
                             availableTeacherIds.Contains(cs.TeacherId.Value))
                .Where(cs => (cs.StartTime < endTime && cs.EndTime > startTime)) // Overlapping time
                .ToListAsync();

            var conflictingTeacherIds = potentialConflicts
                .Where(cs => cs.CurriculumDay != null && 
                             cs.CurriculumDay.ScheduleDate.DayOfWeek == dayOfWeek)
                .Select(cs => cs.TeacherId!.Value)
                .Distinct()
                .ToList();

            // Filter out teachers with conflicts
            var finalAvailableTeacherIds = availableTeacherIds.Except(conflictingTeacherIds).ToList();

            // Get teacher details
            var teachers = await _context.Teachers
                .Where(t => finalAvailableTeacherIds.Contains(t.TeacherId) && t.IsActive)
                .Select(t => new {
                    t.TeacherId,
                    t.FullName,
                    t.Email,
                    t.PhoneNumber,
                    t.Specialization,
                    t.Qualifications,
                    t.HourlyRate
                })
                .ToListAsync();

            return Ok(teachers);
        }

        /// <summary>
        /// Creates a new availability slot for a teacher
        /// </summary>
        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost]
        public async Task<ActionResult<TeacherAvailability>> Create([FromBody] CreateAvailabilityDto dto)
        {
            // Validate teacher exists
            var teacherExists = await _context.Teachers.AnyAsync(t => t.TeacherId == dto.TeacherId);
            if (!teacherExists)
            {
                return BadRequest(new { message = $"Teacher with ID {dto.TeacherId} does not exist" });
            }

            // Validate time range
            if (dto.StartTime >= dto.EndTime)
            {
                return BadRequest(new { message = "End time must be after start time" });
            }

            // Check for overlapping availability slots
            var hasOverlap = await _context.TeacherAvailabilities
                .Where(a => a.TeacherId == dto.TeacherId &&
                          a.IsActive &&
                          a.DayOfWeek == dto.DayOfWeek &&
                          ((a.StartTime < dto.EndTime && a.EndTime > dto.StartTime)))
                .Where(a => 
                    (dto.IsRecurring && a.IsRecurring) ||
                    (!dto.IsRecurring && !a.IsRecurring && a.SpecificDate.HasValue && dto.SpecificDate.HasValue && a.SpecificDate.Value.Date == dto.SpecificDate.Value.Date) ||
                    (!dto.IsRecurring && a.IsRecurring) ||
                    (dto.IsRecurring && !a.IsRecurring && a.SpecificDate.HasValue && a.SpecificDate.Value.DayOfWeek == dto.DayOfWeek))
                .AnyAsync();

            if (hasOverlap)
            {
                return Conflict(new { message = "This time slot overlaps with an existing availability slot" });
            }

            var availability = new TeacherAvailability
            {
                TeacherId = dto.TeacherId,
                DayOfWeek = dto.DayOfWeek,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                IsRecurring = dto.IsRecurring,
                SpecificDate = dto.SpecificDate,
                Notes = dto.Notes ?? string.Empty,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.TeacherAvailabilities.Add(availability);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByTeacher), new { teacherId = dto.TeacherId }, availability);
        }

        /// <summary>
        /// Updates an availability slot
        /// </summary>
        [Authorize(Roles = "Admin,Teacher")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAvailabilityDto dto)
        {
            var availability = await _context.TeacherAvailabilities.FindAsync(id);
            if (availability == null)
            {
                return NotFound(new { message = "Availability slot not found" });
            }

            // Check for overlapping availability slots (excluding current one)
            var hasOverlap = await _context.TeacherAvailabilities
                .AnyAsync(a => a.AvailabilityId != id &&
                              a.TeacherId == availability.TeacherId &&
                              a.IsActive &&
                              a.DayOfWeek == dto.DayOfWeek &&
                              ((a.StartTime < dto.EndTime && a.EndTime > dto.StartTime)));

            if (hasOverlap)
            {
                return Conflict(new { message = "This time slot overlaps with an existing availability slot" });
            }

            availability.DayOfWeek = dto.DayOfWeek;
            availability.StartTime = dto.StartTime;
            availability.EndTime = dto.EndTime;
            availability.IsRecurring = dto.IsRecurring;
            availability.SpecificDate = dto.SpecificDate;
            availability.Notes = dto.Notes ?? availability.Notes;
            availability.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Deletes (soft delete) an availability slot
        /// </summary>
        [Authorize(Roles = "Admin,Teacher")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var availability = await _context.TeacherAvailabilities.FindAsync(id);
            if (availability == null)
            {
                return NotFound(new { message = "Availability slot not found" });
            }

            availability.IsActive = false;
            availability.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Batch create availability slots for a teacher
        /// </summary>
        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost("batch")]
        public async Task<ActionResult<IEnumerable<TeacherAvailability>>> BatchCreate([FromBody] BatchCreateAvailabilityDto dto)
        {
            // Validate teacher exists
            var teacherExists = await _context.Teachers.AnyAsync(t => t.TeacherId == dto.TeacherId);
            if (!teacherExists)
            {
                return BadRequest(new { message = $"Teacher with ID {dto.TeacherId} does not exist" });
            }

            var createdAvailabilities = new List<TeacherAvailability>();

            foreach (var slot in dto.Slots)
            {
                if (slot.StartTime >= slot.EndTime)
                {
                    continue; // Skip invalid slots
                }

                // Check for overlapping slots
                var hasOverlap = await _context.TeacherAvailabilities
                    .Where(a => a.TeacherId == dto.TeacherId &&
                              a.IsActive &&
                              a.DayOfWeek == slot.DayOfWeek &&
                              ((a.StartTime < slot.EndTime && a.EndTime > slot.StartTime)))
                    .Where(a => 
                        (dto.IsRecurring && a.IsRecurring) ||
                        (!dto.IsRecurring && !a.IsRecurring && a.SpecificDate.HasValue && dto.SpecificDate.HasValue && a.SpecificDate.Value.Date == dto.SpecificDate.Value.Date) ||
                        (!dto.IsRecurring && a.IsRecurring) ||
                        (dto.IsRecurring && !a.IsRecurring && a.SpecificDate.HasValue && a.SpecificDate.Value.DayOfWeek == slot.DayOfWeek))
                    .AnyAsync();

                if (!hasOverlap)
                {
                    var availability = new TeacherAvailability
                    {
                        TeacherId = dto.TeacherId,
                        DayOfWeek = slot.DayOfWeek,
                        StartTime = slot.StartTime,
                        EndTime = slot.EndTime,
                        IsRecurring = dto.IsRecurring,
                        SpecificDate = dto.SpecificDate,
                        Notes = dto.Notes ?? string.Empty,
                        IsActive = true,
                        CreatedAt = DateTime.Now
                    };

                    _context.TeacherAvailabilities.Add(availability);
                    createdAvailabilities.Add(availability);
                }
            }

            if (createdAvailabilities.Any())
            {
                await _context.SaveChangesAsync();
            }

            return Ok(createdAvailabilities);
        }
    }

    // DTOs
    public class CreateAvailabilityDto
    {
        public int TeacherId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsRecurring { get; set; } = true;
        public DateTime? SpecificDate { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateAvailabilityDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsRecurring { get; set; }
        public DateTime? SpecificDate { get; set; }
        public string? Notes { get; set; }
    }

    public class AvailabilitySlotDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }

    public class BatchCreateAvailabilityDto
    {
        public int TeacherId { get; set; }
        public List<AvailabilitySlotDto> Slots { get; set; } = new List<AvailabilitySlotDto>();
        public bool IsRecurring { get; set; } = true;
        public DateTime? SpecificDate { get; set; }
        public string? Notes { get; set; }
    }
}
