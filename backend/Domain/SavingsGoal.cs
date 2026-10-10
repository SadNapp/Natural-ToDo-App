using Backend.Domain.Enums;

namespace Backend.Domain
{
    public class SavingsGoal
    {
      public Guid Id { get; set; }
      
      public string Name { get; set; } = string.Empty;
      public string? Note {get; set; }
      
      public decimal TargetAmount { get; set; } 
      public decimal InitialSavedAmount { get; set; }
      
      public bool IsArchived  { get; set; }
      
      public GoalPriority Priority  { get; set; }
      public ICollection<GoalContribution> Contributions { get; set; } = new List<GoalContribution>();
      
      public DateOnly? TargetDate { get; set; }
      public DateTime CreatedAtUtc  { get; set; } =  DateTime.UtcNow;

    }
}
