using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RoomController> _logger;

        public RoomController(ApplicationDbContext context, ILogger<RoomController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/room
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomDto>>> GetAllRooms()
        {
            try
            {
                var rooms = await _context.Rooms.ToListAsync();
                return Ok(rooms.Select(r => MapToDto(r)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all rooms");
                return StatusCode(500, new { message = "Error retrieving rooms", error = ex.Message });
            }
        }

        // GET: api/room/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RoomDto>> GetRoomById(int id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                    return NotFound(new { message = "Room not found" });

                return Ok(MapToDto(room));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting room {id}");
                return StatusCode(500, new { message = "Error retrieving room", error = ex.Message });
            }
        }

        // POST: api/room
        [HttpPost]
        public async Task<ActionResult<RoomDto>> CreateRoom([FromBody] CreateRoomDto createRoomDto)
        {
            try
            {
                var room = new Room
                {
                    RoomName = createRoomDto.RoomName,
                    Description = createRoomDto.Description,
                    Capacity = createRoomDto.Capacity,
                    AvailableStartTime = createRoomDto.AvailableStartTime,
                    AvailableEndTime = createRoomDto.AvailableEndTime,
                    IsActive = true
                };

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetRoomById), new { id = room.RoomId }, MapToDto(room));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating room");
                var message = ex.Message;
                if (ex.InnerException != null)
                {
                    message += " Inner: " + ex.InnerException.Message;
                }
                return StatusCode(500, new { message = "Error creating room", error = message });
            }
        }

        // PUT: api/room/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] RoomDto roomDto)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                    return NotFound(new { message = "Room not found" });

                room.RoomName = roomDto.RoomName;
                room.Description = roomDto.Description;
                room.Capacity = roomDto.Capacity;
                room.AvailableStartTime = roomDto.AvailableStartTime;
                room.AvailableEndTime = roomDto.AvailableEndTime;
                room.IsActive = roomDto.IsActive;

                _context.Rooms.Update(room);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Room updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating room {id}");
                return StatusCode(500, new { message = "Error updating room", error = ex.Message });
            }
        }

        // DELETE: api/room/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                    return NotFound(new { message = "Room not found" });

                _context.Rooms.Remove(room);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Room deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting room {id}");
                return StatusCode(500, new { message = "Error deleting room", error = ex.Message });
            }
        }

        private RoomDto MapToDto(Room room)
        {
            return new RoomDto
            {
                RoomId = room.RoomId,
                RoomName = room.RoomName,
                Description = room.Description,
                Capacity = room.Capacity,
                AvailableStartTime = room.AvailableStartTime,
                AvailableEndTime = room.AvailableEndTime,
                IsActive = room.IsActive
            };
        }
    }
}
