using Backend.Domain.Enums;

namespace Backend.Domain
{
    public class FinanceCategory
    {
        public Guid Id { get; set; }
        
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
        
        public bool IsArchived { get; set; }
        
        public CategoryGroup Group { get; set; }
        public ICollection<FinanceOperation> Operations { get; set; } = new List<FinanceOperation>();
        
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}