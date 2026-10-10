using Microsoft.AspNetCore.Mvc;
using Backend.Domain;
using Backend.Application;
using System.Threading.Tasks;

namespace Backend.Controllers
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
        public async Task<IActionResult> Update(Guid id, TodoItem item)
        {
            if (id != item.Id) return BadRequest();
            if (!await _todoService.UpdateAsync(item)) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid Id)
        {
            if (!await _todoService.DeleteAsync(Id)) return NotFound();
            return NoContent();
        }

        [HttpGet("deleted")]
        public async Task<IActionResult> GetDeleted() => Ok(await _todoService.GetDeletedAsync());

        [HttpPut("{id}/restore")]
        public async Task<IActionResult> Restore(Guid Id)
        {
            if (!await _todoService.RestoreAsync(Id)) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}/hard")]
        public async Task<IActionResult> HardDelete(Guid Id)
        {
            if (!await _todoService.HardDeleteAsync(Id)) return NotFound();
            return NoContent();
        }
    }
}
