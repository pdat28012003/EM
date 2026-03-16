using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.API.Helpers
{
    public class Violation
    {
        public ViolationMessage Message { get; set; } = new();
        public string Type { get; set; } = string.Empty;
        public int Code { get; set; }
        public string? Field { get; set; }
    }

    public class ViolationMessage
    {
        public string En { get; set; } = string.Empty;
        public string Vi { get; set; } = string.Empty;
    }

    public class ApiResponse<T>
    {
        public string Message { get; set; } = string.Empty;
        public string Message_en { get; set; } = string.Empty;
        public T? Data { get; set; }
        public string Status { get; set; } = string.Empty; // "success", "fail", "error"
        public string TimeStamp { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        public List<Violation>? Violations { get; set; }
        public bool? LimitReached { get; set; }
        public int? DownloadCount { get; set; }
        public int? RemainingTime { get; set; }
    }

    public static class ResponseHelper
    {
        public static ObjectResult CreateResponse<T>(int statusCode, string message, string messageEn, T? data, string status = "success", List<Violation>? violations = null)
        {
            var response = new ApiResponse<T>
            {
                Message = message,
                Message_en = messageEn,
                Data = data,
                Status = status,
                Violations = violations
            };

            return new ObjectResult(response) { StatusCode = statusCode };
        }

        // Helper for when there is no data
        private static ObjectResult CreateBaseResponse(int statusCode, string message, string messageEn, string status = "success", List<Violation>? violations = null)
        {
            return CreateResponse<object>(statusCode, message, messageEn, null, status, violations);
        }

        public static ObjectResult Success<T>(string message, T data, string? messageEn = null)
        {
            return CreateResponse(200, message, messageEn ?? message, data, "success");
        }

        public static ObjectResult Success(string message, string? messageEn = null)
        {
            return CreateBaseResponse(200, message, messageEn ?? message);
        }

        public static ObjectResult Created<T>(string message, T data, string? messageEn = null)
        {
            return CreateResponse(201, message, messageEn ?? message, data, "success");
        }

        public static ObjectResult Created(string message, string? messageEn = null)
        {
            return CreateBaseResponse(201, message, messageEn ?? message);
        }

        public static ObjectResult BadRequest(string message = "Yêu cầu không hợp lệ", string messageEn = "Bad request", List<Violation>? violations = null)
        {
            return CreateBaseResponse(400, message, messageEn, "fail", violations);
        }

        public static ObjectResult Unauthorized(string message = "Phiên làm việc hết hạn hoặc không hợp lệ", string messageEn = "Unauthorized")
        {
            return CreateBaseResponse(401, message, messageEn, "fail");
        }

        public static ObjectResult Forbidden(string message = "Bạn không có quyền thực hiện hành động này", string messageEn = "Forbidden")
        {
            return CreateBaseResponse(403, message, messageEn, "fail");
        }

        public static ObjectResult NotFound(string message = "Không tìm thấy tài nguyên yêu cầu", string messageEn = "Resource not found")
        {
            return CreateBaseResponse(404, message, messageEn, "fail");
        }

        public static ObjectResult Conflict(string message = "Xung đột dữ liệu", string messageEn = "Conflict", string? field = null)
        {
            List<Violation>? violations = null;
            if (field != null)
            {
                violations = new List<Violation>
                {
                    new Violation
                    {
                        Message = new ViolationMessage { Vi = message, En = messageEn },
                        Type = "Conflict",
                        Code = 409,
                        Field = field
                    }
                };
            }
            return CreateBaseResponse(409, message, messageEn, "fail", violations);
        }

        public static ObjectResult InternalServerError(Exception? ex = null, bool isDev = false)
        {
            var details = isDev && ex != null ? new { stack = ex.StackTrace, details = ex.Message } : null;
            return CreateResponse<object>(500, "Lỗi hệ thống, vui lòng thử lại sau", "Internal server error", (object?)details, "error");
        }
    }
}
