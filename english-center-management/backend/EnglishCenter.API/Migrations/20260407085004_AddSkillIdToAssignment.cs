using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSkillIdToAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
/*
            migrationBuilder.AddColumn<int>(
                name: "SkillId",
                table: "Assignments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_SkillId",
                table: "Assignments",
                column: "SkillId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Skills_SkillId",
                table: "Assignments",
                column: "SkillId",
                principalTable: "Skills",
                principalColumn: "SkillId");
*/
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Skills_SkillId",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_SkillId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "SkillId",
                table: "Assignments");
        }
    }
}
