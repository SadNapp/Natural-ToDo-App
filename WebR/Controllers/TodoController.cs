using Microsoft.AspNetCore.Mvc;
using WebR.Models;
using WebR.Services;
using System.Threading.Tasks;

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
        public async Task<IActionResult> GetAll() => Ok(await _todoService.GetAllAsync());

        [HttpPost]
        public async Task<IActionResult> Create(TodoItem item)
        {
            var createdItem = await _todoService.AddAsync(item);
            return CreatedAtAction(nameof(GetAll), new { id = createdItem.Id }, createdItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, TodoItem item)
        {
            if (id != item.Id) return BadRequest();
            if (!await _todoService.UpdateAsync(item)) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!await _todoService.DeleteAsync(id)) return NotFound();
            return NoContent();
        }

        [HttpGet("deleted")]
        public async Task<IActionResult> GetDeleted() => Ok(await _todoService.GetDeletedAsync());

        [HttpPut("{id}/restore")]
        public async Task<IActionResult> Restore(int id)
        {
            if (!await _todoService.RestoreAsync(id)) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}/hard")]
        public async Task<IActionResult> HardDelete(int id)
        {
            if (!await _todoService.HardDeleteAsync(id)) return NotFound();
            return NoContent();
        }
    }
}
