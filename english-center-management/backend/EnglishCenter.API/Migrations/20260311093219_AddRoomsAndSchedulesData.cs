using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnglishCenter.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomsAndSchedulesData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Rooms",
                columns: new[] { "RoomId", "Capacity", "Description", "IsActive", "RoomName", "AvailableStartTime", "AvailableEndTime" },
                values: new object[,]
                {
                    { 1, 20, "Projector, Whiteboard, Air Conditioning", true, "Main Classroom", new TimeSpan(8, 0, 0), new TimeSpan(22, 0, 0) },
                    { 2, 15, "Whiteboard, Air Conditioning", true, "Small Classroom", new TimeSpan(8, 0, 0), new TimeSpan(22, 0, 0) },
                    { 3, 25, "Projector, Smart Board, Air Conditioning, Sound System", true, "Large Classroom", new TimeSpan(8, 0, 0), new TimeSpan(22, 0, 0) },
                    { 4, 10, "Computer Lab, 10 PCs, Air Conditioning", true, "Computer Lab", new TimeSpan(8, 0, 0), new TimeSpan(22, 0, 0) },
                    { 5, 30, "Projector, Whiteboard, Air Conditioning, Sound System", true, "Conference Room", new TimeSpan(8, 0, 0), new TimeSpan(22, 0, 0) }
                });

            migrationBuilder.InsertData(
                table: "Schedules",
                columns: new[] { "ScheduleId", "ClassId", "DayOfWeek", "EndTime", "Room", "StartTime", "TeacherId" },
                values: new object[,]
                {
                    { 1, 1, "Monday", new TimeSpan(18, 0, 0), "Room 101", new TimeSpan(16, 0, 0), 1 },
                    { 2, 1, "Wednesday", new TimeSpan(18, 0, 0), "Room 101", new TimeSpan(16, 0, 0), 1 },
                    { 3, 1, "Friday", new TimeSpan(18, 0, 0), "Room 101", new TimeSpan(16, 0, 0), 1 },
                    { 4, 2, "Tuesday", new TimeSpan(17, 0, 0), "Room 102", new TimeSpan(15, 0, 0), 2 },
                    { 5, 2, "Thursday", new TimeSpan(17, 0, 0), "Room 102", new TimeSpan(15, 0, 0), 2 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Schedules",
                keyColumn: "ScheduleId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Schedules",
                keyColumn: "ScheduleId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Schedules",
                keyColumn: "ScheduleId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Schedules",
                keyColumn: "ScheduleId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Schedules",
                keyColumn: "ScheduleId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 1);
        }
    }
}
