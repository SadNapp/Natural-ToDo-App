using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebR.Data;
using WebR.Models;

namespace WebR.Services
{
    public class FileTodoStorage : ITodoService
    {
        private readonly string _storageDir;
        private readonly string _storageFile;

        public FileTodoStorage()
        {
            _storageDir = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "Saves");
            _storageFile = Path.Combine(_storageDir, "todos.json");
            EnsureStorageExists();
        }

        private void EnsureStorageExists()
        {
            if (!Directory.Exists(_storageDir))
            {
                Directory.CreateDirectory(_storageDir);
            }
            if (!File.Exists(_storageFile))
            {
                File.WriteAllText(_storageFile, "[]");
            }
        }

        private async Task<List<TodoItem>> ReadItemsAsync()
        {
            try
            {
                var json = await File.ReadAllTextAsync(_storageFile);
                return JsonSerializer.Deserialize<List<TodoItem>>(json) ?? new List<TodoItem>();
            }
            catch
            {
                return new List<TodoItem>();
            }
        }

        private async Task WriteItemsAsync(List<TodoItem> items)
        {
            var json = JsonSerializer.Serialize(items, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_storageFile, json);
        }

        public async Task<IEnumerable<TodoItem>> GetAllAsync()
        {
            var items = await ReadItemsAsync();
            return items.Where(t => !t.IsDeleted);
        }

        public async Task<IEnumerable<TodoItem>> GetDeletedAsync()
        {
            var items = await ReadItemsAsync();
            return items.Where(t => t.IsDeleted);
        }

        public async Task<TodoItem?> GetByIdAsync(int id)
        {
            var items = await ReadItemsAsync();
            return items.FirstOrDefault(t => t.Id == id);
        }

        public async Task<TodoItem> AddAsync(TodoItem item)
        {
            var items = await ReadItemsAsync();
            item.Id = items.Any() ? items.Max(t => t.Id) + 1 : 1;
            item.CreatedAt = DateTime.UtcNow;
            // Also negative ID to indicate it's local only? Or just normal ID.
            // When syncing we can reset the ID to 0 so DB generates new ones.
            items.Add(item);
            await WriteItemsAsync(items);
            return item;
        }

        public async Task<bool> UpdateAsync(TodoItem item)
        {
            var items = await ReadItemsAsync();
            var index = items.FindIndex(t => t.Id == item.Id);
            if (index == -1) return false;

            var existingItem = items[index];
            existingItem.Title = item.Title;
            existingItem.IsCompleted = item.IsCompleted;
            existingItem.Deadline = item.Deadline;
            existingItem.Priority = item.Priority;
            existingItem.Category = item.Category;

            await WriteItemsAsync(items);
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var items = await ReadItemsAsync();
            var index = items.FindIndex(t => t.Id == id);
            if (index == -1 || items[index].IsDeleted) return false;

            items[index].IsDeleted = true;
            await WriteItemsAsync(items);
            return true;
        }

        public async Task<bool> RestoreAsync(int id)
        {
            var items = await ReadItemsAsync();
            var index = items.FindIndex(t => t.Id == id);
            if (index == -1 || !items[index].IsDeleted) return false;

            items[index].IsDeleted = false;
            await WriteItemsAsync(items);
            return true;
        }

        public async Task<bool> HardDeleteAsync(int id)
        {
            var items = await ReadItemsAsync();
            var count = items.RemoveAll(t => t.Id == id);
            if (count > 0)
            {
                await WriteItemsAsync(items);
                return true;
            }
            return false;
        }

        public async Task SyncToDatabaseAsync(AppDbContext context)
        {
            var localItems = await ReadItemsAsync();
            if (!localItems.Any()) return;

            // Simple one-way sync: Add local items to DB as new items
            foreach (var item in localItems)
            {
                // Reset ID so PostgreSQL auto-generates a new one
                item.Id = 0; 
                context.Todos.Add(item);
            }

            await context.SaveChangesAsync();

            // Clear local storage after successful sync
            await WriteItemsAsync(new List<TodoItem>());
        }
    }
}
