namespace EnglishCenter.API.DTOs
{
    public class DocumentDto
    {
        public int DocumentId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadDate { get; set; }
        public int DownloadCount { get; set; }
        public int? CurriculumId { get; set; }
        public string? CurriculumName { get; set; }
    }

    public class CreateDocumentDto
    {
        public string Type { get; set; } = string.Empty;
        public int? CurriculumId { get; set; }
    }

    public class UpdateDocumentDto
    {
        public string Type { get; set; } = string.Empty;
        public int? CurriculumId { get; set; }
    }
}
