#!/bin/bash
cd /home/que/EM/english-center-management/backend
unset PM2_HOME
dotnet run --project EnglishCenter.API/EnglishCenter.API.csproj
