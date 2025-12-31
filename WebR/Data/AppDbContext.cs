using Microsoft.EntityFrameworkCore;
using WebR.Models;

namespace WebR.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TodoItem> Todos { get; set; }
}