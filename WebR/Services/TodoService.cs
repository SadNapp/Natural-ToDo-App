using WebR.Models;

namespace WebR.Services
{
    public class TodoService : ITodoService
    {
        private static readonly List<TodoItem> _todoItems = new();
        private static int _nextId = 1;

        public IEnumerable<TodoItem> GetAll() => _todoItems;

        public TodoItem GetById(int id) => _todoItems.FirstOrDefault(t => t.Id == id);

        public TodoItem Add(TodoItem item)
        {
            item.Id = _nextId++;
            item.CreatedAt = DateTime.Now;
            _todoItems.Add(item);
            return item;
        }

        public bool Update(TodoItem item)
        {
            var index = _todoItems.FindIndex(t => t.Id == item.Id);
            if (index == -1) return false;
            
            _todoItems[index] = item;
            return true;
        }

        public bool Delete(int id)
        {
            var item = GetById(id);
            if (item == null) return false;
            
            _todoItems.Remove(item);
            return true;
        }
    }
}