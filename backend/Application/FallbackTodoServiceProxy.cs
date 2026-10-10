using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Backend.Infrastructure;
using Backend.Domain;

namespace Backend.Application
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

        public async Task<TodoItem?> GetByIdAsync(Guid Id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.GetByIdAsync(Id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.GetByIdAsync(Id);
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

        public async Task<bool> DeleteAsync(Guid Id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.DeleteAsync(Id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.DeleteAsync(Id);
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

        public async Task<bool> RestoreAsync(Guid Id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.RestoreAsync(Id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.RestoreAsync(Id);
        }

        public async Task<bool> HardDeleteAsync(Guid Id)
        {
            if (await IsDatabaseAvailableAsync())
            {
                await EnsureSyncAsync();
                return await _primaryService.HardDeleteAsync(Id);
            }

            _logger.LogWarning("Warning: Database unavailable. Using local file storage fallback.");
            SetFallbackHeader();
            return await _fallbackStorage.HardDeleteAsync(Id);
        }
    }
}
