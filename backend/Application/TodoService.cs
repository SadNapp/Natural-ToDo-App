using Backend.Domain;
using Backend.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace Backend.Application
{
    public class TodoService : ITodoService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TodoService> _logger;

        public TodoService(AppDbContext context, ILogger<TodoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<TodoItem>> GetAllAsync()
        {
            _logger.LogInformation("Getting all active todo items");
            return await _context.TodoItems.Where(t => !t.IsDeleted).ToListAsync();
        }

        public async Task<IEnumerable<TodoItem>> GetDeletedAsync()
        {
            _logger.LogInformation("Getting all deleted todo items");
            return await _context.TodoItems.Where(t => t.IsDeleted).ToListAsync();
        }

        public async Task<TodoItem?> GetByIdAsync(Guid Id)
        {
            _logger.LogInformation("Getting todo item by ID: {Id}", Id);
            return await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == Id);
        }

        public async Task<TodoItem> AddAsync(TodoItem item)
        {
            _logger.LogInformation("Adding new todo item: {Title}", item.Title);
            item.CreatedAt = DateTime.UtcNow;
            _context.TodoItems.Add(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<bool> UpdateAsync(TodoItem item)
        {
            _logger.LogInformation("Updating todo item: {Id}", item.Id);
            var existingItem = await _context.TodoItems.FindAsync(item.Id);
            if (existingItem == null) 
            {
                _logger.LogWarning("Todo item not found for update: {Id}", item.Id);
                return false;
            }
            
            existingItem.Title = item.Title;
            existingItem.IsCompleted = item.IsCompleted;
            existingItem.Deadline = item.Deadline;
            existingItem.Priority = item.Priority;
            existingItem.Category = item.Category;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(Guid Id)
        {
            _logger.LogInformation("Soft deleting todo item: {Id}", Id);
            var item = await _context.TodoItems.FindAsync(Id);
            if (item == null || item.IsDeleted) 
            {
                _logger.LogWarning("Todo item not found or already deleted: {Id}", Id);
                return false;
            }
            
            item.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreAsync(Guid Id)
        {
            _logger.LogInformation("Restoring todo item: {Id}", Id);
            var item = await _context.TodoItems.FindAsync(Id);
            if (item == null || !item.IsDeleted) return false;

            item.IsDeleted = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HardDeleteAsync(Guid Id)
        {
            _logger.LogInformation("Hard deleting todo item: {Id}", Id);
            var item = await _context.TodoItems.FindAsync(Id);
            if (item == null) return false;

            _context.TodoItems.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}