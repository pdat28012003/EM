using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Data;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SkillController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SkillController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all skills with pagination. (Lấy danh sách kỹ năng có phân trang)
        /// </summary>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Số lượng mỗi trang)</param>
        /// <returns>Paged list of skills (Danh sách kỹ năng có phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<SkillDto>>> GetSkills(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool? isActive = null,
            [FromQuery] bool? showAll = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var query = _context.Skills.AsQueryable();
            if (!showAll.GetValueOrDefault())
            {
                if (isActive.HasValue)
                {
                    query = query.Where(s => s.IsActive == isActive.Value);
                }
                else
                {
                    query = query.Where(s => s.IsActive);
                }
            }
            query = query.OrderBy(s => s.Name);

            var totalCount = await query.CountAsync();

            var skills = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new SkillDto
                {
                    SkillId = s.SkillId,
                    Name = s.Name,
                    Description = s.Description,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                })
                .ToListAsync();

            var pagedResult = new PagedResult<SkillDto>
            {
                Data = skills,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(pagedResult);
        }

        /// <summary>
        /// Gets a skill by ID. (Lấy kỹ năng theo ID)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<SkillDto>> GetSkill(int id)
        {
            var skill = await _context.Skills
                .Where(s => s.SkillId == id && s.IsActive)
                .Select(s => new SkillDto
                {
                    SkillId = s.SkillId,
                    Name = s.Name,
                    Description = s.Description,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (skill == null)
            {
                return NotFound(new { message = "Skill not found" });
            }

            return Ok(skill);
        }

        /// <summary>
        /// Creates a new skill. (Tạo kỹ năng mới)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<SkillDto>> CreateSkill(CreateSkillDto dto)
        {
            try
            {
                // Check if skill name already exists
                var existingSkill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.Name.ToLower() == dto.Name.ToLower());

                if (existingSkill != null)
                {
                    return BadRequest(new { message = "Skill with this name already exists" });
                }

                var skill = new Skill
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Skills.Add(skill);
                await _context.SaveChangesAsync();

                var skillDto = new SkillDto
                {
                    SkillId = skill.SkillId,
                    Name = skill.Name,
                    Description = skill.Description,
                    IsActive = skill.IsActive,
                    CreatedAt = skill.CreatedAt,
                    UpdatedAt = skill.UpdatedAt
                };

                return CreatedAtAction(nameof(GetSkill), new { id = skill.SkillId }, skillDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a skill. (Cập nhật kỹ năng)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<SkillDto>> UpdateSkill(int id, CreateSkillDto dto)
        {
            try
            {
                var skill = await _context.Skills.FindAsync(id);
                if (skill == null)
                {
                    return NotFound(new { message = "Skill not found" });
                }

                // Check if another skill with the same name exists
                var existingSkill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.SkillId != id && s.Name.ToLower() == dto.Name.ToLower());

                if (existingSkill != null)
                {
                    return BadRequest(new { message = "Skill with this name already exists" });
                }

                skill.Name = dto.Name;
                skill.Description = dto.Description;
                skill.IsActive = dto.IsActive;
                skill.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var skillDto = new SkillDto
                {
                    SkillId = skill.SkillId,
                    Name = skill.Name,
                    Description = skill.Description,
                    IsActive = skill.IsActive,
                    CreatedAt = skill.CreatedAt,
                    UpdatedAt = skill.UpdatedAt
                };

                return Ok(skillDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a skill. (Xóa kỹ năng)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteSkill(int id)
        {
            try
            {
                var skill = await _context.Skills.FindAsync(id);
                if (skill == null)
                {
                    return NotFound(new { message = "Skill not found" });
                }

                // Check if skill is used in any assignments
                var isInUse = await _context.AssignmentSkills
                    .AnyAsync(asg => asg.SkillId == id);

                if (isInUse)
                {
                    // Soft delete - just deactivate
                    skill.IsActive = false;
                    skill.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Hard delete if not in use
                    _context.Skills.Remove(skill);
                    await _context.SaveChangesAsync();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}
