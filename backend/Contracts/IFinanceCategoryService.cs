using Backend.Contracts;
using Backend.Domain;

namespace Backend.Contracts;

public interface IFinanceCategoryService
{
    public Task<List<FinanceCategoryResponseDto>> GetAllAsync(CancellationToken cancellationToken);
    
}
