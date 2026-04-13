using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCurriculumStudents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CurriculumStudent",
                columns: table => new
                {
                    CurriculumsCurriculumId = table.Column<int>(type: "int", nullable: false),
                    ParticipantStudentsStudentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CurriculumStudent", x => new { x.CurriculumsCurriculumId, x.ParticipantStudentsStudentId });
                    table.ForeignKey(
                        name: "FK_CurriculumStudent_Curriculums_CurriculumsCurriculumId",
                        column: x => x.CurriculumsCurriculumId,
                        principalTable: "Curriculums",
                        principalColumn: "CurriculumId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CurriculumStudent_Students_ParticipantStudentsStudentId",
                        column: x => x.ParticipantStudentsStudentId,
                        principalTable: "Students",
                        principalColumn: "StudentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CurriculumStudent_ParticipantStudentsStudentId",
                table: "CurriculumStudent",
                column: "ParticipantStudentsStudentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CurriculumStudent");
        }
    }
}
