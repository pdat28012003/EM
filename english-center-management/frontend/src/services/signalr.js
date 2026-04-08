import * as signalR from '@microsoft/signalr';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';

const signalRService = {
  createHubConnection: () => {
    const hubUrl = API_URL.replace('/api', '') + '/paymentHub';
    
    return new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }
};

export { signalR as signalRService, signalRService as default };
