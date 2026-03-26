using System;
using System.ComponentModel.DataAnnotations;

namespace WebR.Models;

public enum Priority
{
    Low,
    Mid,
    High
}

public class TodoItem 
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? Deadline { get; set; }
    public Priority Priority { get; set; } = Priority.Low;
    public string Category { get; set; } = "Other";
    public bool IsDeleted { get; set; } = false;
}