using Microsoft.EntityFrameworkCore;
using WebR.Models;

namespace WebR.Data;

public class AppDbContext : DbContext
{
    public  AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {}
    
    public DbSet<BudgetCategoryAllocation>  BudgetCategoryAllocations { get; set; }
    public DbSet<FinanceCategory>  FinanceCategories { get; set; }
    public DbSet<FinanceOperation>   FinanceOperations { get; set; }
    public DbSet<GoalContribution>   GoalContributions { get; set; }
    public DbSet<MonthlyBudget>   MonthlyBudgets { get; set; }
    public DbSet<SavingsGoal>   SavingsGoals { get; set; }
    public DbSet<TodoItem>    TodoItems { get; set; }
}