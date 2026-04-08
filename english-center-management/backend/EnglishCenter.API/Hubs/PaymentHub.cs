using Microsoft.AspNetCore.SignalR;

namespace EnglishCenter.API.Hubs
{
    public class PaymentHub : Hub
    {
        public async Task JoinPaymentGroup(string paymentId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"payment_{paymentId}");
        }

        public async Task LeavePaymentGroup(string paymentId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"payment_{paymentId}");
        }
    }
}
