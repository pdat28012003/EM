#!/bin/bash
cd /home/que/EM/english-center-management/backend
unset PM2_HOME
dotnet EnglishCenter.API/bin/Release/net8.0/EnglishCenter.API.dll
