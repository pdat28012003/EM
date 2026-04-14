# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["EnglishCenter.API.csproj", "./"]
RUN dotnet restore "./EnglishCenter.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "EnglishCenter.API.csproj" -c Release -o /app/build

# Publish
RUN dotnet publish "EnglishCenter.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "EnglishCenter.API.dll"]
