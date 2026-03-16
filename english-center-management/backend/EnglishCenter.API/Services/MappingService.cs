using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Services
{
    public class MappingService : IMappingService
    {
        private readonly IPasswordService _passwordService;

        public MappingService(IPasswordService passwordService)
        {
            _passwordService = passwordService;
        }

        public StudentDto MapToStudentDto(Student student)
        {
            return new StudentDto
            {
                StudentId = student.StudentId,
                FullName = student.FullName,
                Email = student.Email,
                PhoneNumber = student.PhoneNumber,
                DateOfBirth = student.DateOfBirth,
                Address = student.Address,
                EnrollmentDate = student.EnrollmentDate,
                Level = student.Level,
                IsActive = student.IsActive
            };
        }

        public Student MapToStudent(CreateStudentDto dto)
        {
            return new Student
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                DateOfBirth = dto.DateOfBirth,
                Address = dto.Address,
                Password = dto.Password, // Will be hashed in service layer
                EnrollmentDate = DateTime.Now,
                Level = dto.Level,
                IsActive = true
            };
        }

        public void UpdateStudentFromDto(Student student, UpdateStudentDto dto)
        {
            student.FullName = dto.FullName;
            student.Email = dto.Email;
            student.PhoneNumber = dto.PhoneNumber;
            student.DateOfBirth = dto.DateOfBirth;
            student.Address = dto.Address;
            student.Level = dto.Level;
            student.IsActive = dto.IsActive;
            
            // Only update password if provided
            if (!string.IsNullOrEmpty(dto.Password))
            {
                student.Password = _passwordService.HashPassword(dto.Password);
            }
        }
    }
}
