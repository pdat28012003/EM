using System.Collections.Concurrent;
using System.Threading.Channels;
using System.Text.Json;

namespace EnglishCenter.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ConcurrentDictionary<string, List<Channel<string>>> _subscriptions = new();

        public Channel<string> Subscribe(int userId, int? teacherId, int? studentId)
        {
            var channel = Channel.CreateUnbounded<string>();
            var keys = GetKeys(userId, teacherId, studentId);
            
            foreach (var key in keys)
            {
                _subscriptions.AddOrUpdate(key, 
                    new List<Channel<string>> { channel }, 
                    (_, list) => { list.Add(channel); return list; });
            }
            
            return channel;
        }

        public async Task NotifyAsync(int userId, int? teacherId, int? studentId, object notification)
        {
            var keys = GetKeys(userId, teacherId, studentId);
            var json = JsonSerializer.Serialize(notification);
            var message = $"event: notification\ndata: {json}\n\n";

            // Track channels that already received this message to avoid duplicates
            var notifiedChannels = new HashSet<Channel<string>>();

            foreach (var key in keys)
            {
                if (_subscriptions.TryGetValue(key, out var channels))
                {
                    foreach (var channel in channels.ToList())
                    {
                        // Skip if this channel already received the message
                        if (notifiedChannels.Contains(channel))
                            continue;

                        try
                        {
                            await channel.Writer.WriteAsync(message);
                            notifiedChannels.Add(channel);
                        }
                        catch
                        {
                            // Channel closed, remove it
                            channels.Remove(channel);
                        }
                    }
                }
            }
        }

        private List<string> GetKeys(int userId, int? teacherId, int? studentId)
        {
            var keys = new List<string> { $"user:{userId}" };
            if (teacherId.HasValue) keys.Add($"teacher:{teacherId}");
            if (studentId.HasValue) keys.Add($"student:{studentId}");
            return keys;
        }
    }
}
