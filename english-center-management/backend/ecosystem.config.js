module.exports = {
  apps: [{
    name: 'english-center-api',
    script: 'dotnet',
    args: 'EnglishCenter.API.dll --urls http://0.0.0.0:5000',
    cwd: '/home/que/EM/english-center-management/backend/EnglishCenter.API/publish',
    env_production: { ASPNETCORE_ENVIRONMENT: 'Production' }
  }]
};
