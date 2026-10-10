using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Backend.Domain;

namespace Backend.Infrastructure.EntityConfigurations;

public class BudgetCategoryAllocationConfiguration : IEntityTypeConfiguration<BudgetCategoryAllocation>
{
    public void Configure(EntityTypeBuilder<BudgetCategoryAllocation> builder)
    {
        builder.ToTable("BudgetCategoryAllocations");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PlannedAmount).HasPrecision(18, 2);
        builder.HasOne<MonthlyBudget>()
            .WithMany(x => x.BudgetCategoryAllocation)
            .HasForeignKey(x => x.MonthlyBudgetId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.MonthlyBudgetId, x.CategoryId }).IsUnique();
    }
}
