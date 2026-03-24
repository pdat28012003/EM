namespace EnglishCenter.API.DTOs
{
    public class DocumentDto
    {
        public int DocumentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadDate { get; set; }
        public int DownloadCount { get; set; }
        public int TeacherId { get; set; }
        public int? ClassId { get; set; }
        public string? ClassName { get; set; }
        public string? TeacherName { get; set; }
    }

    public class CreateDocumentDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public int? ClassId { get; set; }
    }

    public class UpdateDocumentDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? ClassId { get; set; }
    }
}
