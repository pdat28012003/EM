using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.SqlServer;

using EnglishCenter.API.Data;

using EnglishCenter.API.Services;

using EnglishCenter.API.Hubs;

using EnglishCenter.API.Converters;

using System.Text.Json;

using System.Text.Json.Serialization;

using Microsoft.AspNetCore.HttpOverrides;

using Microsoft.Extensions.FileProviders;

using Npgsql;



var builder = WebApplication.CreateBuilder(args);



var port = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrWhiteSpace(port))

{

    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

}



// Add services to the container

builder.Services.AddControllers()

    .AddJsonOptions(options =>

    {

        options.JsonSerializerOptions.Converters.Add(new TimeSpanJsonConverter());

        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // Change to CamelCase

    });



builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>

{

    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo

    {

        Title = "English Center Management API",

        Version = "v1",

        Description = "API for English Center Management System, including teacher, student, course, and attendance management."

    });



    // Configure JWT Authorization for Swagger

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme

    {

        Name = "Authorization",

        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,

        Scheme = "Bearer",

        BearerFormat = "JWT",

        In = Microsoft.OpenApi.Models.ParameterLocation.Header,

        Description = "Enter 'Bearer' [space] + your token.\nExample: Bearer eyJhbGciOiJIUzI1Ni..."

    });



    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement

    {

        {

            new Microsoft.OpenApi.Models.OpenApiSecurityScheme

            {

                Reference = new Microsoft.OpenApi.Models.OpenApiReference

                {

                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,

                    Id = "Bearer"

                }

            },

            Array.Empty<string>()

        }

    });



    // Read XML file for API documentation

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";

    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

    options.IncludeXmlComments(xmlPath);

});



// Configure AppSettings

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IEmailService, EmailService>();



// Register CAPTCHA service

builder.Services.AddHttpClient<ICaptchaService, CaptchaService>();



// Register SePay service with timeout

builder.Services.AddHttpClient<ISePayService, SePayService>(client =>

{

    client.Timeout = TimeSpan.FromSeconds(10);

});



// Add SignalR

builder.Services.AddSignalR();



// Configure Database

var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

string connectionString;

bool isPostgres = rawConnectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
    rawConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);



if (isPostgres)

{

    var uri = new Uri(rawConnectionString);

    var userInfo = uri.UserInfo.Split(':', 2);

    var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty;

    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;

    var database = uri.AbsolutePath.Trim('/');



    var csb = new NpgsqlConnectionStringBuilder

    {

        Host = uri.Host,

        Port = uri.IsDefaultPort ? 5432 : uri.Port,

        Username = username,

        Password = password,

        Database = database,

        SslMode = SslMode.Require

    };



    connectionString = csb.ConnectionString;

}

else

{

    connectionString = rawConnectionString;

}



if (isPostgres)

{

    builder.Services.AddDbContext<ApplicationDbContext>(options =>

        options.UseNpgsql(

            connectionString,

            sqlOptions => sqlOptions.EnableRetryOnFailure()));

}

else

{

    builder.Services.AddDbContext<ApplicationDbContext>(options =>

        options.UseSqlServer(

            connectionString,

            sqlOptions => sqlOptions.EnableRetryOnFailure()));

}



// Register custom services

builder.Services.AddScoped<IMappingService, MappingService>();

builder.Services.AddScoped<IPasswordService, PasswordService>();

builder.Services.AddSingleton<INotificationService, NotificationService>();

builder.Services.AddScoped<IActivityLogService, ActivityLogService>();



// Configure JWT Authentication

var tokenKey = builder.Configuration.GetSection("AppSettings:Token").Value;

if (string.IsNullOrEmpty(tokenKey))

{

    tokenKey = "super secret key for testing purpose only - please change in production";

}



builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)

    .AddJwtBearer(options =>

    {

        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters

        {

            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(tokenKey)),

            ValidateIssuer = false,

            ValidateAudience = false,

            ClockSkew = TimeSpan.Zero

        };

    });



// Configure CORS
builder.Services.AddCors(options =>

{

    options.AddPolicy("AllowAll",

        policy =>

        {

            policy.SetIsOriginAllowed(_ => true)

                  .AllowAnyMethod()

                  .AllowAnyHeader()

                  .AllowCredentials();

        });

});

builder.Services.Configure<ForwardedHeadersOptions>(options =>

{

    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    options.KnownNetworks.Clear();

    options.KnownProxies.Clear();
});

var app = builder.Build();

// Auto-migrate database on startup (for Render deployment)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        db.Database.Migrate();
        app.Logger.LogInformation("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database migration failed");
    }
}

app.Logger.LogInformation("Or: https://localhost:5001/swagger (if using HTTPS)");

app.UseForwardedHeaders();



if (!app.Environment.IsDevelopment())

{

    app.UseHttpsRedirection();

}



app.UseCors("AllowAll");



app.UseAuthentication();

app.UseAuthorization();

// Enable static file serving for uploads
app.UseStaticFiles();

// Enable Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "English Center Management API V1");
    c.RoutePrefix = "swagger";
});

app.MapControllers();



// Map SignalR hubs

app.MapHub<PaymentHub>("/paymentHub");


app.Run();
