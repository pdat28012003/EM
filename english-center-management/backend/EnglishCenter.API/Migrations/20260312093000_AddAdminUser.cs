using Microsoft.EntityFrameworkCore.Migrations;
using System.Security.Cryptography;
using System.Text;

#nullable disable

namespace EnglishCenter.API.Migrations
{
    public partial class AddAdminUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Insert Admin role first
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Admin')
                INSERT INTO Roles (RoleName, Description) 
                VALUES ('Admin', 'System Administrator');
            ");

            // Hash the password
            var password = "admin123";
            using var hmac = new HMACSHA512();
            var passwordHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(password)));
            var passwordSalt = Convert.ToBase64String(hmac.Key);

            // Insert admin user
            migrationBuilder.Sql($@"
                IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@englishcenter.com')
                INSERT INTO Users (Email, PasswordHash, PasswordSalt, FullName, PhoneNumber, RoleId, IsActive, CreatedAt)
                VALUES (
                    'admin@englishcenter.com',
                    '{passwordHash}',
                    '{passwordSalt}',
                    'System Administrator',
                    '0000000000',
                    (SELECT RoleId FROM Roles WHERE RoleName = 'Admin'),
                    1,
                    GETDATE()
                );
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM Users WHERE Email = 'admin@englishcenter.com'");
            migrationBuilder.Sql("DELETE FROM Roles WHERE RoleName = 'Admin'");
        }
    }
}
