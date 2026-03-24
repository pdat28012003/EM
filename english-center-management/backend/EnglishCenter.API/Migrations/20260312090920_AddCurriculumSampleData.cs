using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCurriculumSampleData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Insert sample curriculums
            migrationBuilder.InsertData(
                table: "Curriculums",
                columns: new[] { "CurriculumId", "CurriculumName", "Status", "CreatedDate", "ModifiedDate", "ClassId", "StartDate", "EndDate", "Description" },
                values: new object[,]
                {
                    { 1, "IELTS Foundation", "Active", new DateTime(2024, 3, 12, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 3, 12, 0, 0, 0, DateTimeKind.Unspecified), 1, new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 5, 31, 0, 0, 0, DateTimeKind.Unspecified), "IELTS Foundation course for beginners" },
                    { 2, "Business English", "Active", new DateTime(2024, 3, 12, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 3, 12, 0, 0, 0, DateTimeKind.Unspecified), 2, new DateTime(2024, 3, 15, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 6, 15, 0, 0, 0, DateTimeKind.Unspecified), "Professional Business English course" }
                });

            // Insert curriculum days
            migrationBuilder.InsertData(
                table: "CurriculumDays",
                columns: new[] { "CurriculumDayId", "CurriculumId", "ScheduleDate", "Topic", "Description", "SessionCount" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2024, 3, 12, 0, 0, 0, DateTimeKind.Unspecified), "Speaking Skills", "Speaking skills development session", 1 },
                    { 2, 1, new DateTime(2024, 3, 13, 0, 0, 0, DateTimeKind.Unspecified), "Listening Skills", "Listening comprehension practice", 1 },
                    { 3, 1, new DateTime(2024, 3, 15, 0, 0, 0, DateTimeKind.Unspecified), "Reading Comprehension", "Reading skills and analysis", 1 },
                    { 4, 1, new DateTime(2024, 3, 17, 0, 0, 0, DateTimeKind.Unspecified), "Writing Skills", "Academic writing techniques", 1 },
                    { 5, 2, new DateTime(2024, 3, 14, 0, 0, 0, DateTimeKind.Unspecified), "Professional Communication", "Business communication skills", 1 },
                    { 6, 2, new DateTime(2024, 3, 16, 0, 0, 0, DateTimeKind.Unspecified), "Presentation Skills", "Business presentation techniques", 1 },
                    { 7, 2, new DateTime(2024, 3, 18, 0, 0, 0, DateTimeKind.Unspecified), "Negotiation Skills", "Business negotiation strategies", 1 }
                });

            // Insert curriculum sessions
            migrationBuilder.InsertData(
                table: "CurriculumSessions",
                columns: new[] { "CurriculumSessionId", "CurriculumDayId", "SessionNumber", "SessionName", "StartTime", "EndTime", "RoomId", "TeacherId", "SessionDescription" },
                values: new object[,]
                {
                    { 1, 1, 1, "Introduction & Ice Breaking", new TimeSpan(9, 0, 0), new TimeSpan(11, 0, 0), 1, 1, "First session - getting to know each other" },
                    { 2, 2, 2, "Audio Comprehension", new TimeSpan(14, 0, 0), new TimeSpan(16, 0, 0), 2, 1, "Listening practice with audio materials" },
                    { 3, 3, 1, "Text Analysis", new TimeSpan(10, 0, 0), new TimeSpan(12, 0, 0), 1, 1, "Analyzing academic texts and articles" },
                    { 4, 4, 1, "Essay Writing", new TimeSpan(14, 0, 0), new TimeSpan(16, 0, 0), 3, 1, "Academic essay structure and writing" },
                    { 5, 5, 1, "Email Writing", new TimeSpan(10, 0, 0), new TimeSpan(12, 0, 0), 3, 1, "Writing professional emails" },
                    { 6, 6, 1, "Business Presentations", new TimeSpan(15, 0, 0), new TimeSpan(17, 0, 0), 2, 1, "Creating and delivering business presentations" },
                    { 7, 7, 1, "Negotiation Tactics", new TimeSpan(9, 0, 0), new TimeSpan(11, 0, 0), 1, 1, "Business negotiation strategies and practice" }
                });

            // Insert lessons
            migrationBuilder.InsertData(
                table: "Lessons",
                columns: new[] { "LessonId", "CurriculumSessionId", "LessonNumber", "LessonTitle", "Duration", "Content", "Resources", "Notes" },
                values: new object[,]
                {
                    { 1, 1, 1, "Self Introduction", new TimeSpan(0, 30, 0), "Introduction and self-presentation skills", "Whiteboard, markers", "Focus on confidence building" },
                    { 2, 1, 2, "Basic Vocabulary", new TimeSpan(0, 45, 0), "Essential vocabulary for IELTS speaking", "Vocabulary handouts", "Practice pronunciation" },
                    { 3, 1, 3, "Practice Activity", new TimeSpan(0, 45, 0), "Interactive speaking exercises", "Conversation cards", "Pair work activities" },
                    { 4, 2, 1, "Listening for Gist", new TimeSpan(0, 30, 0), "Understanding main ideas in audio", "Audio recordings, headphones", "Note-taking strategies" },
                    { 5, 2, 2, "Note Taking", new TimeSpan(0, 45, 0), "Effective note-taking techniques", "Notebook, pen", "Structured note formats" },
                    { 6, 2, 3, "Comprehension Test", new TimeSpan(0, 45, 0), "Listening comprehension assessment", "Test papers, audio files", "Individual assessment" },
                    { 7, 3, 1, "Skimming & Scanning", new TimeSpan(0, 30, 0), "Fast reading techniques for academic texts", "Academic articles, highlighters", "Speed reading practice" },
                    { 8, 3, 2, "Vocabulary in Context", new TimeSpan(0, 45, 0), "Understanding vocabulary from context clues", "Dictionary, context worksheets", "Context analysis skills" },
                    { 9, 3, 3, "Comprehension Questions", new TimeSpan(0, 45, 0), "Answering comprehension questions effectively", "Question sheets, answer keys", "Test-taking strategies" },
                    { 10, 4, 1, "Essay Structure", new TimeSpan(0, 30, 0), "Introduction, body, and conclusion structure", "Essay templates, outline guides", "Academic writing format" },
                    { 11, 4, 2, "Thesis Statements", new TimeSpan(0, 45, 0), "Writing strong thesis statements", "Thesis examples, practice sheets", "Argument development" },
                    { 12, 4, 3, "Supporting Evidence", new TimeSpan(0, 45, 0), "Finding and using supporting evidence", "Research materials, citation guides", "Evidence integration" },
                    { 13, 5, 1, "Email Structure", new TimeSpan(0, 30, 0), "Professional email format", "Email templates", "Formal vs informal" },
                    { 14, 5, 2, "Formal Language", new TimeSpan(0, 45, 0), "Business writing vocabulary", "Business phrasebook", "Professional tone" },
                    { 15, 5, 3, "Practice Writing", new TimeSpan(0, 45, 0), "Writing business emails", "Laptops, email client", "Peer review exercise" },
                    { 16, 6, 1, "Presentation Structure", new TimeSpan(0, 30, 0), "Organizing business presentations", "Presentation templates", "Logical flow" },
                    { 17, 6, 2, "Visual Aids", new TimeSpan(0, 45, 0), "Creating effective slides and visual materials", "PowerPoint, design software", "Visual communication" },
                    { 18, 6, 3, "Delivery Practice", new TimeSpan(0, 45, 0), "Practicing presentation delivery", "Video recorder, feedback forms", "Public speaking skills" },
                    { 19, 7, 1, "Negotiation Types", new TimeSpan(0, 30, 0), "Understanding different negotiation approaches", "Case studies, negotiation models", "Strategy selection" },
                    { 20, 7, 2, "Bargaining Techniques", new TimeSpan(0, 45, 0), "Effective bargaining and persuasion skills", "Role-play scenarios", "Win-win solutions" },
                    { 21, 7, 3, "Practice Negotiation", new TimeSpan(0, 45, 0), "Mock negotiation exercises", "Negotiation worksheets", "Real-world application" }
                });

            // Insert curriculum-teacher relationships (many-to-many)
            migrationBuilder.InsertData(
                table: "CurriculumTeacher",
                columns: new[] { "ParticipatedCurriculumsCurriculumId", "ParticipantTeachersTeacherId" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 2, 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove curriculum-teacher relationships
            migrationBuilder.DeleteData(
                table: "CurriculumTeacher",
                keyColumns: new[] { "ParticipatedCurriculumsCurriculumId", "ParticipantTeachersTeacherId" },
                keyValues: new object[,]
                {
                    { 1, 1 },
                    { 2, 1 }
                });

            // Remove lessons
            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValues: new object[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21 });

            // Remove curriculum sessions
            migrationBuilder.DeleteData(
                table: "CurriculumSessions",
                keyColumn: "CurriculumSessionId",
                keyValues: new object[] { 1, 2, 3, 4, 5, 6, 7 });

            // Remove curriculum days
            migrationBuilder.DeleteData(
                table: "CurriculumDays",
                keyColumn: "CurriculumDayId",
                keyValues: new object[] { 1, 2, 3, 4, 5, 6, 7 });

            // Remove curriculums
            migrationBuilder.DeleteData(
                table: "Curriculums",
                keyColumn: "CurriculumId",
                keyValues: new object[] { 1, 2 });
        }
    }
}
