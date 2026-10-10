using Backend.Domain.Enums;

namespace Backend.Domain
{
    public class MonthlyBudget
    {
        public Guid Id { get; set; }
        
        public int Year { get; set; }
        public int Month { get; set; }
       
        public decimal NetIncome { get; set; }
        public decimal NeedsPercentage { get; set; }
        public decimal WantsPercentage  { get; set; }
        public decimal SavingsPercentage { get; set; }
        
        public BudgetTemplate Template { get; set; }
        public ICollection<BudgetCategoryAllocation> BudgetCategoryAllocation { get; set; } = new List<BudgetCategoryAllocation>();

    }
}