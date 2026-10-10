namespace Backend.Domain
{
    public class GoalContribution
    {
     public Guid Id { get; set; }
     public Guid GoalId { get; set; }
    
     public string? Note { get; set; }
     
     public decimal Amount { get; set; }
     
     public SavingsGoal SavingsGoal { get; set; } = null!;
     
     public DateOnly Date { get; set; }
     public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}