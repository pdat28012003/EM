using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class DropDocumentTeacherId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Teachers_TeacherId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_TeacherId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "TeacherId",
                table: "Documents");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TeacherId",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_TeacherId",
                table: "Documents",
                column: "TeacherId");
        }
    }
}
