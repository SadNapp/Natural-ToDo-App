using Backend.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore.Design;
using Backend.Infrastructure;
using Backend.Domain;
using Backend.Contracts;
using Backend.Domain.Enums;
using Serilog;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Setup Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Using Scoped for work DataBase
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TodoService>();
builder.Services.AddScoped<FileTodoStorage>();
builder.Services.AddScoped<ITodoService, FallbackTodoServiceProxy>();
builder.Services.AddScoped<IFinanceCategoryService, FinanceCategoryService>();

// Swagger/OpenAPI конфігурація
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy => {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173", "http://localhost:3000"];
        policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader().WithExposedHeaders("X-Fallback-Mode");
    });
});

builder.Services.AddControllers();
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var retries = 0;
    while (retries++ < 30 && !await context.Database.CanConnectAsync()) await Task.Delay(TimeSpan.FromSeconds(2));
    if (await context.Database.CanConnectAsync())
    {
        await context.Database.EnsureCreatedAsync();
        await using (var connection = new NpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection")))
        {
            await connection.OpenAsync();
            await using var check = new NpgsqlCommand("SELECT to_regclass('public.\"FinanceCategories\"') IS NOT NULL", connection);
            var financeExists = (bool)(await check.ExecuteScalarAsync() ?? false);
            if (!financeExists)
            {
                var sql = await File.ReadAllTextAsync(Path.Combine(app.Environment.ContentRootPath, "finance-schema.sql"));
                await using var create = new NpgsqlCommand(sql, connection);
                await create.ExecuteNonQueryAsync();
            }
        }
        if (!await context.FinanceCategories.AnyAsync())
        {
            context.FinanceCategories.AddRange(
                new FinanceCategory { Name = "Житло та комунальні", Group = CategoryGroup.Needs },
                new FinanceCategory { Name = "Продукти", Group = CategoryGroup.Needs },
                new FinanceCategory { Name = "Транспорт", Group = CategoryGroup.Needs },
                new FinanceCategory { Name = "Здоров’я", Group = CategoryGroup.Needs },
                new FinanceCategory { Name = "Зв’язок", Group = CategoryGroup.Needs },
                new FinanceCategory { Name = "Підписки", Group = CategoryGroup.Wants },
                new FinanceCategory { Name = "Одяг", Group = CategoryGroup.Wants },
                new FinanceCategory { Name = "Розваги", Group = CategoryGroup.Wants },
                new FinanceCategory { Name = "Навчання", Group = CategoryGroup.Wants },
                new FinanceCategory { Name = "Заощадження", Group = CategoryGroup.Savings },
                new FinanceCategory { Name = "Інше", Group = CategoryGroup.Wants });
            await context.SaveChangesAsync();
        }
        Log.Information("Database is ready.");
    }
    else
    {
        Log.Warning("Database is unavailable. The API will start with file storage fallback.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.Run();
