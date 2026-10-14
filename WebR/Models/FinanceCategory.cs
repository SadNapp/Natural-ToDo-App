using WebR.Models.Enums;

namespace WebR.Models
{
    public class FinanceCategory
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public CategoryGroup Group { get; set; }
        public ICollection<FinanceOperation> Operations { get; set; } = new List<FinanceOperation>();
        public string? Color { get; set; }
        public bool IsArchived { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}