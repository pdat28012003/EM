using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCurriculumIdToDocumentsOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurriculumId",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CurriculumId",
                table: "Documents",
                column: "CurriculumId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Curriculums_CurriculumId",
                table: "Documents",
                column: "CurriculumId",
                principalTable: "Curriculums",
                principalColumn: "CurriculumId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Curriculums_CurriculumId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_CurriculumId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CurriculumId",
                table: "Documents");
        }
    }
}
