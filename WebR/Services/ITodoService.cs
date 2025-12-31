using WebR.Models;

namespace WebR.Services
{
    public interface ITodoService
    {
        IEnumerable<TodoItem> GetAll();
        TodoItem GetById(int id);
        TodoItem Add(TodoItem item);
        bool Update(TodoItem item);
        bool Delete(int id);
    }
}