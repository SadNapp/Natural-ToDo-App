using System;
using System.ComponentModel.DataAnnotations;
using Backend.Domain.Enums;

namespace Backend.Domain;



public class TodoItem 
{
    public Guid Id { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";
    
    public bool IsCompleted { get; set; }
    public bool IsDeleted { get; set; } = false;
    
    public TodoItemPriority Priority { get; set; } 
    
    public DateTime CreatedAt { get; set; }
    public DateTime? Deadline { get; set; }
}