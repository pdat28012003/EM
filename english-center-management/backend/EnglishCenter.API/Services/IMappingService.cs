using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Services
{
    public interface IMappingService
    {
        StudentDto MapToStudentDto(Student student);
        Student MapToStudent(CreateStudentDto dto);
        void UpdateStudentFromDto(Student student, UpdateStudentDto dto);
    }
}
