using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using WebR.Data;
using WebR.Models;

namespace WebR.Services
{
    public class FallbackTodoServiceProxy : ITodoService
    {
        private readonly TodoService _primaryService;
        private readonly FileTodoStorage _fallbackStorage;
        private readonly AppDbContext _context;
        private readonly ILogger<FallbackTodoServiceProxy> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public FallbackTodoServiceProxy(
            TodoService primaryService,
            FileTodoStorage fallbackStorage,
            AppDbContext context,
            ILogger<FallbackTodoServiceProxy> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _primaryService = primaryService;
            _fallbackStorage = fallbackStorage;
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private async Task<bool> IsDatabaseAvailableAsync()
        {
            try
            {
                return await _context.Database.CanConnectAsync();
            }
            catch
            {
                return false;
            }
        }

        private void SetFallbackHeader()
        {
            if (_httpContextAccessor.HttpContext != null)
            {
                _httpContextAccessor.HttpContext.Response.Headers["X-Fallback-Mode"] = "true";
                // Also add an Access-Control-Expose-Headers so frontend can read it
                _httpContextAccessor.HttpContext.Response.Headers["Access-Control-Expose-Headers"] = "X-Fallback-Mode";
            }
        }

        private async Task EnsureSyncAsync()
        {
            try
            {
                await _fallbackStorage.SyncToDatabaseAsync(_context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to synchronize fallback storage with database.");
            }
        }

        public async Task<IEnumerable<TodoItem>> GetAllAsync()
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.GetAllAsync();
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.GetAllAsync();
        }

        public async Task<TodoItem?> GetByIdAsync(int id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.GetByIdAsync(id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.GetByIdAsync(id);
        }

        public async Task<TodoItem> AddAsync(TodoItem item)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.AddAsync(item);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.AddAsync(item);
        }

        public async Task<bool> UpdateAsync(TodoItem item)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.UpdateAsync(item);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.UpdateAsync(item);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.DeleteAsync(id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.DeleteAsync(id);
        }

        public async Task<IEnumerable<TodoItem>> GetDeletedAsync()
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.GetDeletedAsync();
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.GetDeletedAsync();
        }

        public async Task<bool> RestoreAsync(int id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.RestoreAsync(id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.RestoreAsync(id);
        }

        public async Task<bool> HardDeleteAsync(int id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.HardDeleteAsync(id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.HardDeleteAsync(id);
        }
    }
}
