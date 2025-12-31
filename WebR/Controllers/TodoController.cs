using Microsoft.AspNetCore.Mvc;
using WebR.Models;
using WebR.Services;

namespace WebR.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TodoController : ControllerBase
    {
        private readonly ITodoService _todoService;
        
        public TodoController(ITodoService todoService)
        {
            _todoService = todoService;
        }

        [HttpGet]
        public IActionResult GetAll() => Ok(_todoService.GetAll());

        [HttpPost]
        public IActionResult Create(TodoItem item)
        {
            var createdItem = _todoService.Add(item);
            return CreatedAtAction(nameof(GetAll), new { id = createdItem.Id }, createdItem);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, TodoItem item)
        {
            if (id != item.Id) return BadRequest();
            if (!_todoService.Update(item)) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            if (!_todoService.Delete(id)) return NotFound();
            return NoContent();
        }
    }
}
        
