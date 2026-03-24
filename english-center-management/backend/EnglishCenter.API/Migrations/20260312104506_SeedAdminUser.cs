using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Seed Admin role
            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleId", "RoleName", "Description" },
                values: new object[] { 1, "Admin", "System administrator" }
            );

            // Seed default admin user: admin@example.com / admin
            const string defaultAdminEmail = "admin@example.com";
            const string defaultAdminPassword = "admin";

            using var hmac = new HMACSHA512();
            var passwordSalt = hmac.Key;
            var passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(defaultAdminPassword));

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[]
                {
                    "UserId", "Email", "PasswordHash", "PasswordSalt",
                    "FullName", "PhoneNumber", "RoleId", "IsActive",
                    "CreatedAt", "LastLogin"
                },
                values: new object[]
                {
                    1,
                    defaultAdminEmail,
                    passwordHash,
                    passwordSalt,
                    "Default Admin",
                    null,
                    1,
                    true,
                    DateTime.Now,
                    null
                }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1
            );

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 1
            );
        }
    }
}
