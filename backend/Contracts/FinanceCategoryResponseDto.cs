using Backend.Domain.Enums;

namespace Backend.Contracts;

public class FinanceCategoryResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public CategoryGroup Group { get; set; }
    public string? Color { get; set; }
    public bool IsArchived { get; set; }

}