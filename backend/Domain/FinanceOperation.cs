using Backend.Domain.Enums;

namespace Backend.Domain
{
    public class FinanceOperation
    {
        public Guid Id { get; set; }
        public Guid CategoryId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string? Account { get; set; }
        public string? Note { get; set; }
        public decimal Amount { get; set; }

        public bool IsDeleted { get; set; } = false;
        public bool Recurring { get; set; }

        public OperationType Type { get; set; } // Income or Expense
        public OperationStatus Status { get; set; } // Planned, Completed
        public FinanceCategory Category { get; set; } = null!;
        public RecurrenceFrequency? Frequency { get; set; } // Daily, Weekly, Monthly, Yearly

        public DateOnly Date { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAtUtc { get; set; } = null;
    }
}