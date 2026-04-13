using System.Threading.Channels;

namespace EnglishCenter.API.Services
{
    public interface INotificationService
    {
        Channel<string> Subscribe(int userId, int? teacherId, int? studentId);
        Task NotifyAsync(int userId, int? teacherId, int? studentId, object notification);
    }
}
