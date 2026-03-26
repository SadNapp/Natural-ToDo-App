using WebR.Models;
using WebR.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace WebR.Services
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
            return await _context.Todos.Where(t => !t.IsDeleted).ToListAsync();
        }

        public async Task<IEnumerable<TodoItem>> GetDeletedAsync()
        {
            _logger.LogInformation("Getting all deleted todo items");
            return await _context.Todos.Where(t => t.IsDeleted).ToListAsync();
        }

        public async Task<TodoItem?> GetByIdAsync(int id)
        {
            _logger.LogInformation("Getting todo item by ID: {Id}", id);
            return await _context.Todos.FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TodoItem> AddAsync(TodoItem item)
        {
            _logger.LogInformation("Adding new todo item: {Title}", item.Title);
            item.CreatedAt = DateTime.UtcNow;
            _context.Todos.Add(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<bool> UpdateAsync(TodoItem item)
        {
            _logger.LogInformation("Updating todo item: {Id}", item.Id);
            var existingItem = await _context.Todos.FindAsync(item.Id);
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

        public async Task<bool> DeleteAsync(int id)
        {
            _logger.LogInformation("Soft deleting todo item: {Id}", id);
            var item = await _context.Todos.FindAsync(id);
            if (item == null || item.IsDeleted) 
            {
                _logger.LogWarning("Todo item not found or already deleted: {Id}", id);
                return false;
            }
            
            item.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreAsync(int id)
        {
            _logger.LogInformation("Restoring todo item: {Id}", id);
            var item = await _context.Todos.FindAsync(id);
            if (item == null || !item.IsDeleted) return false;

            item.IsDeleted = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HardDeleteAsync(int id)
        {
            _logger.LogInformation("Hard deleting todo item: {Id}", id);
            var item = await _context.Todos.FindAsync(id);
            if (item == null) return false;

            _context.Todos.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}