using Backend.Contracts;
using Backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application;

public class FinanceCategoryService(AppDbContext db) : IFinanceCategoryService
{
    public async Task<List<FinanceCategoryResponseDto>> GetAllAsync(CancellationToken cancellationToken) => await db.FinanceCategories.AsNoTracking().OrderBy(x => x.Name).Select(x => new FinanceCategoryResponseDto { Id = x.Id, Name = x.Name, Color = x.Color, Group = x.Group }).ToListAsync(cancellationToken);
}
