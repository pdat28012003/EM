using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Tạo dữ liệu test cho thanh toán
        /// </summary>
        [HttpPost("create-payment-test-data")]
        public async Task<IActionResult> CreatePaymentTestData()
        {
            try
            {
                // Lấy student đầu tiên
                var student = await _context.Students.FirstOrDefaultAsync();
                if (student == null)
                {
                    return BadRequest("No student found");
                }

                // Lấy course đầu tiên có fee > 0
                var course = await _context.Courses.FirstOrDefaultAsync(c => c.Fee > 0);
                if (course == null)
                {
                    return BadRequest("No course with fee found");
                }

                // Lấy class đầu tiên của course này
                var classEntity = await _context.Classes.FirstOrDefaultAsync(c => c.CourseId == course.CourseId);
                if (classEntity == null)
                {
                    return BadRequest("No class found for this course");
                }

                // Kiểm tra enrollment đã tồn tại chưa
                var existingEnrollment = await _context.Enrollments
                    .FirstOrDefaultAsync(e => e.StudentId == student.StudentId && e.ClassId == classEntity.ClassId);

                if (existingEnrollment == null)
                {
                    // Tạo enrollment mới
                    var enrollment = new Enrollment
                    {
                        StudentId = student.StudentId,
                        ClassId = classEntity.ClassId,
                        EnrollmentDate = DateTime.Now,
                        Status = "Active"
                    };

                    _context.Enrollments.Add(enrollment);
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    message = "Test data created successfully",
                    studentId = student.StudentId,
                    studentName = student.FullName,
                    courseId = course.CourseId,
                    courseName = course.CourseName,
                    courseFee = course.Fee
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }
}
