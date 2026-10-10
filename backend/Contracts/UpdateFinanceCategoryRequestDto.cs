using System.ComponentModel.DataAnnotations;
using Backend.Domain.Enums;

namespace Backend.Contracts;

public class UpdateFinanceCategoryRequestDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public CategoryGroup Group { get; set; }
    public string? Color { get; set; }
}