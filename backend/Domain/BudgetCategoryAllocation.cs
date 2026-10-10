namespace Backend.Domain;

public class BudgetCategoryAllocation
{
    public Guid Id { get; set; }
    public Guid MonthlyBudgetId  { get; set; }
    public Guid CategoryId { get; set; }
    public decimal PlannedAmount { get; set; }
}