using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSampleDataDirect : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Classes",
                columns: new[] { "ClassId", "ClassName", "CourseId", "EndDate", "MaxStudents", "Room", "StartDate", "Status", "TeacherId" },
                values: new object[,]
                {
                    { 1, "test", 1, new DateTime(2024, 5, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 20, "Room 101", new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", 1 },
                    { 2, "ENG101-A2", 1, new DateTime(2024, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), 15, "Room 102", new DateTime(2024, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", 2 }
                });

            migrationBuilder.InsertData(
                table: "Students",
                columns: new[] { "StudentId", "Address", "Avatar", "DateOfBirth", "Email", "EnrollmentDate", "FullName", "IsActive", "Level", "Password", "PhoneNumber", "Username" },
                values: new object[,]
                {
                    { 1, "123 Nguyễn Huệ, Q1, TP.HCM", "", new DateTime(1995, 5, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "a.nguyen@email.com", new DateTime(2024, 2, 28, 0, 0, 0, 0, DateTimeKind.Unspecified), "Nguyễn Văn A", true, "Beginner", "", "0901234567", "" },
                    { 2, "456 Lê Lợi, Q3, TP.HCM", "", new DateTime(1998, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "b.tran@email.com", new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Trần Thị B", true, "Elementary", "", "0902345678", "" },
                    { 3, "789 Đồng Khởi, Q5, TP.HCM", "", new DateTime(2000, 12, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "c.le@email.com", new DateTime(2024, 3, 5, 0, 0, 0, 0, DateTimeKind.Unspecified), "Lê Văn C", true, "Pre-Intermediate", "", "0903456789", "" }
                });

            migrationBuilder.InsertData(
                table: "Enrollments",
                columns: new[] { "EnrollmentId", "ClassId", "EnrollmentDate", "Status", "StudentId" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2024, 2, 28, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", 1 },
                    { 2, 1, new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", 2 },
                    { 3, 1, new DateTime(2024, 3, 5, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", 3 }
                });

            migrationBuilder.InsertData(
                table: "Payments",
                columns: new[] { "PaymentId", "Amount", "Notes", "PaymentDate", "PaymentMethod", "Status", "StudentId" },
                values: new object[,]
                {
                    { 1, 2000000m, "Full payment for English for Beginners course", new DateTime(2024, 2, 28, 0, 0, 0, 0, DateTimeKind.Unspecified), "Bank Transfer", "Completed", 1 },
                    { 2, 2000000m, "Full payment for English for Beginners course", new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Cash", "Completed", 2 },
                    { 3, 2000000m, "Full payment for English for Beginners course", new DateTime(2024, 3, 5, 0, 0, 0, 0, DateTimeKind.Unspecified), "Credit Card", "Completed", 3 },
                    { 4, 500000m, "Partial payment for additional materials", new DateTime(2024, 4, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "Bank Transfer", "Completed", 1 },
                    { 5, 300000m, "Late fee payment", new DateTime(2024, 4, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Cash", "Completed", 2 }
                });

            migrationBuilder.InsertData(
                table: "TestScores",
                columns: new[] { "TestScoreId", "ClassId", "Comments", "ListeningScore", "ReadingScore", "SpeakingScore", "StudentId", "TestDate", "TestName", "TotalScore", "WritingScore" },
                values: new object[,]
                {
                    { 1, 1, "Good performance in listening and writing. Need more practice in speaking.", 8.5m, 7.8m, 7.5m, 1, new DateTime(2024, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Midterm Exam - Unit 1", 8.0m, 8.2m },
                    { 2, 1, "Excellent improvement in all skills. Keep up the good work!", 9.0m, 8.5m, 8.2m, 1, new DateTime(2024, 4, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "Final Exam - Unit 1", 8.6m, 8.8m },
                    { 3, 1, "Average performance. Should focus more on listening comprehension.", 6.5m, 7.0m, 7.2m, 2, new DateTime(2024, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Midterm Exam - Unit 1", 6.9m, 6.8m },
                    { 4, 1, "Good understanding of grammar. Vocabulary needs improvement.", 7.2m, 8.0m, 7.8m, 2, new DateTime(2024, 3, 25, 0, 0, 0, 0, DateTimeKind.Unspecified), "Quiz - Grammar & Vocabulary", 7.6m, 7.5m },
                    { 5, 1, "Outstanding speaking skills! Very fluent and confident.", 8.8m, 8.2m, 9.2m, 1, new DateTime(2024, 4, 5, 0, 0, 0, 0, DateTimeKind.Unspecified), "Quiz - Conversation Skills", 8.7m, 8.5m },
                    { 6, 1, "Below average performance. Requires additional support and practice.", 5.5m, 6.0m, 6.2m, 3, new DateTime(2024, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Midterm Exam - Unit 1", 5.9m, 5.8m },
                    { 7, 1, "Writing has improved. Still needs work on basic grammar.", 6.0m, 6.5m, 6.0m, 3, new DateTime(2024, 3, 28, 0, 0, 0, 0, DateTimeKind.Unspecified), "Assignment - Writing Practice", 6.3m, 6.8m },
                    { 8, 1, "Consistent high performance. Ready for advanced level.", 9.2m, 8.8m, 8.5m, 1, new DateTime(2024, 5, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Final Exam - Unit 2", 8.9m, 9.0m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Classes",
                keyColumn: "ClassId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Enrollments",
                keyColumn: "EnrollmentId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Enrollments",
                keyColumn: "EnrollmentId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Enrollments",
                keyColumn: "EnrollmentId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Payments",
                keyColumn: "PaymentId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Payments",
                keyColumn: "PaymentId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Payments",
                keyColumn: "PaymentId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Payments",
                keyColumn: "PaymentId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Payments",
                keyColumn: "PaymentId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Classes",
                keyColumn: "ClassId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Students",
                keyColumn: "StudentId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Students",
                keyColumn: "StudentId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Students",
                keyColumn: "StudentId",
                keyValue: 3);
        }
    }
}
