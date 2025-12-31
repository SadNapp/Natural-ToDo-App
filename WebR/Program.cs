using WebR.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore.Design;
using WebR.Data;
using WebR.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ITodoService, TodoService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Також переконайтеся, що сервіс тепер Scoped (для роботи з БД)
builder.Services.AddScoped<ITodoService, TodoService>();
// 1. Додай сервіс
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddControllers();
var app = builder.Build();

// 2. Використай політику
app.UseCors("AllowReact");

app.MapControllers();
app.Run();