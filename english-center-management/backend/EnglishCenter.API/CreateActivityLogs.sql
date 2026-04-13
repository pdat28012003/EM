BEGIN TRANSACTION;
GO

ALTER TABLE [ActivityLogs] DROP CONSTRAINT [FK_ActivityLogs_Students_StudentId];
GO

ALTER TABLE [ActivityLogs] DROP CONSTRAINT [FK_ActivityLogs_Teachers_TeacherId];
GO

ALTER TABLE [ActivityLogs] DROP CONSTRAINT [FK_ActivityLogs_Users_UserId];
GO

ALTER TABLE [ActivityLogs] ADD CONSTRAINT [FK_ActivityLogs_Students_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Students] ([StudentId]) ON DELETE SET NULL;
GO

ALTER TABLE [ActivityLogs] ADD CONSTRAINT [FK_ActivityLogs_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teachers] ([TeacherId]) ON DELETE SET NULL;
GO

ALTER TABLE [ActivityLogs] ADD CONSTRAINT [FK_ActivityLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260401161408_CreateActivityLogsTable', N'8.0.0');
GO

COMMIT;
GO

