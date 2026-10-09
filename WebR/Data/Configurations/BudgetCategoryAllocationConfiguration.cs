using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebR.Models;

namespace WebR.Data.Configurations;

public class BudgetCategoryAllocationConfiguration : IEntityTypeConfiguration<BudgetCategoryAllocation>
{
    public void Configure(EntityTypeBuilder<BudgetCategoryAllocation> builder)
    {
        builder.ToTable("BudgetCategoryAllocation");
    }
}