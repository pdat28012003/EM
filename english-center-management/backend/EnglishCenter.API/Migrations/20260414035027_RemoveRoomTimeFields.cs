using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRoomTimeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Classes_ClassId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Classes_ClassId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_Classes_ClassId",
                table: "Enrollments");

            migrationBuilder.DropForeignKey(
                name: "FK_TestScores_Classes_ClassId",
                table: "TestScores");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropIndex(
                name: "IX_TestScores_ClassId",
                table: "TestScores");

            migrationBuilder.DropIndex(
                name: "IX_Documents_ClassId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_ClassId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "AvailableEndTime",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "AvailableStartTime",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "ClassId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ClassId",
                table: "Assignments");

            migrationBuilder.RenameColumn(
                name: "ClassId",
                table: "Enrollments",
                newName: "CurriculumId");

            migrationBuilder.RenameIndex(
                name: "IX_Enrollments_ClassId",
                table: "Enrollments",
                newName: "IX_Enrollments_CurriculumId");

            // Xóa dữ liệu lỗi trong Enrollments trước khi tạo khóa ngoại
            migrationBuilder.Sql("DELETE FROM [Enrollments] WHERE [CurriculumId] NOT IN (SELECT [CurriculumId] FROM [Curriculums])");

            migrationBuilder.AlterColumn<int>(
                name: "ClassId",
                table: "TestScores",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "CurriculumId",
                table: "TestScores",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 1,
                column: "CurriculumId",
                value: 0);

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 2,
                columns: new[] { "ClassId", "CurriculumId" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 3,
                columns: new[] { "ClassId", "CurriculumId" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 4,
                columns: new[] { "ClassId", "CurriculumId" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 5,
                column: "CurriculumId",
                value: 0);

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 6,
                column: "CurriculumId",
                value: 0);

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 7,
                column: "CurriculumId",
                value: 0);

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 8,
                column: "CurriculumId",
                value: 0);

            // Xóa TestScores có CurriculumId không tồn tại trong Curriculums
            migrationBuilder.Sql("DELETE FROM [TestScores] WHERE [CurriculumId] NOT IN (SELECT [CurriculumId] FROM [Curriculums])");

            migrationBuilder.CreateIndex(
                name: "IX_TestScores_CurriculumId",
                table: "TestScores",
                column: "CurriculumId");

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_Curriculums_CurriculumId",
                table: "Enrollments",
                column: "CurriculumId",
                principalTable: "Curriculums",
                principalColumn: "CurriculumId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TestScores_Curriculums_CurriculumId",
                table: "TestScores",
                column: "CurriculumId",
                principalTable: "Curriculums",
                principalColumn: "CurriculumId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_Curriculums_CurriculumId",
                table: "Enrollments");

            migrationBuilder.DropForeignKey(
                name: "FK_TestScores_Curriculums_CurriculumId",
                table: "TestScores");

            migrationBuilder.DropIndex(
                name: "IX_TestScores_CurriculumId",
                table: "TestScores");

            migrationBuilder.DropColumn(
                name: "CurriculumId",
                table: "TestScores");

            migrationBuilder.RenameColumn(
                name: "CurriculumId",
                table: "Enrollments",
                newName: "ClassId");

            migrationBuilder.RenameIndex(
                name: "IX_Enrollments_CurriculumId",
                table: "Enrollments",
                newName: "IX_Enrollments_ClassId");

            migrationBuilder.AlterColumn<int>(
                name: "ClassId",
                table: "TestScores",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "AvailableEndTime",
                table: "Rooms",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<TimeSpan>(
                name: "AvailableStartTime",
                table: "Rooms",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<int>(
                name: "ClassId",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ClassId",
                table: "Assignments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    ClassId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    CurriculumId = table.Column<int>(type: "int", nullable: true),
                    RoomId = table.Column<int>(type: "int", nullable: true),
                    TeacherId = table.Column<int>(type: "int", nullable: true),
                    ClassName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MaxStudents = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classes", x => x.ClassId);
                    table.ForeignKey(
                        name: "FK_Classes_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "CourseId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Classes_Curriculums_CurriculumId",
                        column: x => x.CurriculumId,
                        principalTable: "Curriculums",
                        principalColumn: "CurriculumId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Classes_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "RoomId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Classes_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Teachers",
                        principalColumn: "TeacherId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Classes",
                columns: new[] { "ClassId", "ClassName", "CourseId", "CurriculumId", "EndDate", "MaxStudents", "RoomId", "StartDate", "Status", "TeacherId" },
                values: new object[,]
                {
                    { 1, "test", 1, null, new DateTime(2024, 5, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 20, 1, new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", 1 },
                    { 2, "ENG101-A2", 1, null, new DateTime(2024, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), 15, 2, new DateTime(2024, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", 2 }
                });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 1,
                columns: new[] { "AvailableEndTime", "AvailableStartTime" },
                values: new object[] { new TimeSpan(0, 21, 0, 0, 0), new TimeSpan(0, 7, 0, 0, 0) });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 2,
                columns: new[] { "AvailableEndTime", "AvailableStartTime" },
                values: new object[] { new TimeSpan(0, 21, 0, 0, 0), new TimeSpan(0, 7, 0, 0, 0) });

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 2,
                column: "ClassId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 3,
                column: "ClassId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "TestScores",
                keyColumn: "TestScoreId",
                keyValue: 4,
                column: "ClassId",
                value: 1);

            migrationBuilder.CreateIndex(
                name: "IX_TestScores_ClassId",
                table: "TestScores",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ClassId",
                table: "Documents",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_ClassId",
                table: "Assignments",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_CourseId",
                table: "Classes",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_CurriculumId",
                table: "Classes",
                column: "CurriculumId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_RoomId",
                table: "Classes",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_TeacherId",
                table: "Classes",
                column: "TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Classes_ClassId",
                table: "Assignments",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "ClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Classes_ClassId",
                table: "Documents",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "ClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_Classes_ClassId",
                table: "Enrollments",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TestScores_Classes_ClassId",
                table: "TestScores",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
