using WebR.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebR.Services
{
    public interface ITodoService
    {
        Task<IEnumerable<TodoItem>> GetAllAsync();
        Task<TodoItem?> GetByIdAsync(Guid Id);
        Task<TodoItem> AddAsync(TodoItem item);
        Task<bool> UpdateAsync(TodoItem item);
        Task<bool> DeleteAsync(Guid Id); // This will be soft delete
        Task<IEnumerable<TodoItem>> GetDeletedAsync();
        Task<bool> RestoreAsync(Guid Id);
        Task<bool> HardDeleteAsync(Guid Id);
    }
}