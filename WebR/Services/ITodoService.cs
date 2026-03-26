using WebR.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebR.Services
{
    public interface ITodoService
    {
        Task<IEnumerable<TodoItem>> GetAllAsync();
        Task<TodoItem?> GetByIdAsync(int id);
        Task<TodoItem> AddAsync(TodoItem item);
        Task<bool> UpdateAsync(TodoItem item);
        Task<bool> DeleteAsync(int id); // This will be soft delete
        Task<IEnumerable<TodoItem>> GetDeletedAsync();
        Task<bool> RestoreAsync(int id);
        Task<bool> HardDeleteAsync(int id);
    }
}