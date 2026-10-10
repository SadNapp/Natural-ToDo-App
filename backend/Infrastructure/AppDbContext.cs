using Microsoft.EntityFrameworkCore;
using Backend.Domain;
using Backend.Infrastructure.EntityConfigurations;

namespace Backend.Infrastructure;

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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new BudgetCategoryAllocationConfiguration());
        modelBuilder.Entity<FinanceOperation>().Property(x => x.Amount).HasPrecision(18, 2);
        modelBuilder.Entity<FinanceOperation>().Property(x => x.Type).HasConversion<string>();
        modelBuilder.Entity<FinanceOperation>().Property(x => x.Status).HasConversion<string>();
        modelBuilder.Entity<FinanceOperation>().Property(x => x.Frequency).HasConversion<string>();
        modelBuilder.Entity<FinanceCategory>().Property(x => x.Group).HasConversion<string>();
        modelBuilder.Entity<FinanceCategory>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<FinanceOperation>().HasOne(x => x.Category).WithMany(x => x.Operations).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<MonthlyBudget>().HasIndex(x => new { x.Year, x.Month }).IsUnique();
        modelBuilder.Entity<MonthlyBudget>().Property(x => x.NetIncome).HasPrecision(18, 2);
        modelBuilder.Entity<MonthlyBudget>().Property(x => x.NeedsPercentage).HasPrecision(7, 2);
        modelBuilder.Entity<MonthlyBudget>().Property(x => x.WantsPercentage).HasPrecision(7, 2);
        modelBuilder.Entity<MonthlyBudget>().Property(x => x.SavingsPercentage).HasPrecision(7, 2);
        modelBuilder.Entity<MonthlyBudget>().Property(x => x.Template).HasConversion<string>();
        modelBuilder.Entity<BudgetCategoryAllocation>().Property(x => x.PlannedAmount).HasPrecision(18, 2);
        modelBuilder.Entity<BudgetCategoryAllocation>().HasOne<MonthlyBudget>().WithMany(x => x.BudgetCategoryAllocation).HasForeignKey(x => x.MonthlyBudgetId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<BudgetCategoryAllocation>().HasIndex(x => new { x.MonthlyBudgetId, x.CategoryId }).IsUnique();
        modelBuilder.Entity<SavingsGoal>().Property(x => x.TargetAmount).HasPrecision(18, 2);
        modelBuilder.Entity<SavingsGoal>().Property(x => x.InitialSavedAmount).HasPrecision(18, 2);
        modelBuilder.Entity<SavingsGoal>().Property(x => x.Priority).HasConversion<string>();
        modelBuilder.Entity<GoalContribution>().Property(x => x.Amount).HasPrecision(18, 2);
        modelBuilder.Entity<GoalContribution>().HasOne(x => x.SavingsGoal).WithMany(x => x.Contributions).HasForeignKey(x => x.GoalId).OnDelete(DeleteBehavior.Cascade);
    }
}

