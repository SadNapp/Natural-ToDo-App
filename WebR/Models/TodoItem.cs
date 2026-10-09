using System;
using System.ComponentModel.DataAnnotations;
using WebR.Models.Enums;

namespace WebR.Models;



public class TodoItem 
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? Deadline { get; set; }
    public TodoItemPriority Priority { get; set; } 
    public string Category { get; set; } = "Other";
    public bool IsDeleted { get; set; } = false;
}