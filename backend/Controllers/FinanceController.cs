using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Infrastructure;
using Backend.Domain;
using Backend.Domain.Enums;

namespace Backend.Controllers;

[ApiController]
[Route("api/finance")]
public class FinanceController(AppDbContext db) : ControllerBase
{
    private static readonly string[] TemplateNames = ["50-30-20", "60-30-10", "70-20-10", "80-20", "zero-based"];
    private static string EnumName<T>(T value) where T : struct, Enum => value.ToString().ToLowerInvariant();
    private static string TemplateName(BudgetTemplate value) => value switch { BudgetTemplate._50_30_20 => "50-30-20", BudgetTemplate._60_30_10 => "60-30-10", BudgetTemplate._70_20_10 => "70-20-10", BudgetTemplate._80_20 => "80-20", _ => "zero-based" };
    private static BudgetTemplate ParseTemplate(string? value) => value?.ToLowerInvariant() switch { "50-30-20" => BudgetTemplate._50_30_20, "60-30-10" => BudgetTemplate._60_30_10, "70-20-10" => BudgetTemplate._70_20_10, "80-20" => BudgetTemplate._80_20, "zero-based" => BudgetTemplate.ZeroBased, _ => throw new ArgumentException("Unknown budget template.") };
    private static bool TryEnum<T>(string? value, out T result) where T : struct, Enum => Enum.TryParse(value, true, out result);
    private static object CategoryDto(FinanceCategory c) => new { id = c.Id, name = c.Name, group = EnumName(c.Group), color = c.Color, isArchived = c.IsArchived };
    private static object OperationDto(FinanceOperation o) => new { id = o.Id, title = o.Title, amount = o.Amount, type = EnumName(o.Type), categoryId = o.CategoryId, date = o.Date.ToString("yyyy-MM-dd"), status = EnumName(o.Status), account = o.Account, note = o.Note, recurring = o.Recurring, frequency = o.Frequency is null ? null : EnumName(o.Frequency.Value), isDeleted = o.IsDeleted, createdAt = o.CreatedAtUtc, updatedAt = o.UpdatedAtUtc };
    private static object ContributionDto(GoalContribution c) => new { id = c.Id, goalId = c.GoalId, amount = c.Amount, date = c.Date.ToString("yyyy-MM-dd"), note = c.Note ?? "", createdAt = c.CreatedAtUtc };
    private static object GoalDto(SavingsGoal g, decimal contributed)
    {
        var saved = g.InitialSavedAmount + contributed; var remaining = Math.Max(0, g.TargetAmount - saved); var days = g.TargetDate is null ? 0 : g.TargetDate.Value.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
        return new { id = g.Id, name = g.Name, targetAmount = g.TargetAmount, savedAmount = saved, contributedAmount = contributed, remainingAmount = remaining, progressPercent = Math.Min(100, saved / g.TargetAmount * 100), targetDate = g.TargetDate?.ToString("yyyy-MM-dd"), priority = EnumName(g.Priority), note = g.Note ?? "", createdAt = g.CreatedAtUtc, recommendedMonthly = remaining == 0 || days <= 0 ? 0 : decimal.Round(remaining / Math.Max(1, (decimal)Math.Ceiling(days / 30.4375)), 2), recommendedWeekly = remaining == 0 || days <= 0 ? 0 : decimal.Round(remaining / Math.Max(1, (decimal)Math.Ceiling(days / 7m)), 2), status = remaining == 0 ? "achieved" : days < 0 ? "pastDue" : "active" };
    }
    private async Task<object> BudgetDto(MonthlyBudget b)
    {
        var allocations = await db.BudgetCategoryAllocations.Where(x => x.MonthlyBudgetId == b.Id).ToListAsync();
        var groups = await db.FinanceCategories.ToDictionaryAsync(x => x.Id.ToString(), x => EnumName(x.Group));
        var categoryAmounts = allocations.ToDictionary(x => x.CategoryId.ToString(), x => x.PlannedAmount);
        var actuals = await db.FinanceOperations.Where(x => !x.IsDeleted && x.Status == OperationStatus.Completed && x.Type == OperationType.Expense && x.Date.Year == b.Year && x.Date.Month == b.Month).GroupBy(x => x.Category.Group).Select(g => new { Group = g.Key, Amount = g.Sum(x => x.Amount) }).ToDictionaryAsync(x => EnumName(x.Group), x => x.Amount);
        var plans = new Dictionary<string, decimal>();
        if (b.Template == BudgetTemplate.ZeroBased) foreach (var a in allocations) { var group = groups.GetValueOrDefault(a.CategoryId.ToString(), "wants"); plans[group] = plans.GetValueOrDefault(group) + a.PlannedAmount; }
        else { plans["needs"] = b.NetIncome * b.NeedsPercentage / 100; plans["wants"] = b.NetIncome * b.WantsPercentage / 100; plans["savings"] = b.NetIncome * b.SavingsPercentage / 100; }
        var keys = new[] { "needs", "wants", "savings" };
        return new { month = $"{b.Year:D4}-{b.Month:D2}", template = TemplateName(b.Template), netIncome = b.NetIncome, allocations = new { needs = b.NeedsPercentage, wants = b.WantsPercentage, savings = b.SavingsPercentage }, categoryGroups = groups, categoryAmounts, lines = keys.Select(k => new { key = k, planned = plans.GetValueOrDefault(k), actual = actuals.GetValueOrDefault(k), remaining = plans.GetValueOrDefault(k) - actuals.GetValueOrDefault(k), overLimit = actuals.GetValueOrDefault(k) > plans.GetValueOrDefault(k) }) };
    }

    [HttpGet("categories")] public async Task<IActionResult> Categories() => Ok(await db.FinanceCategories.OrderBy(x => x.Name).Select(x => new { id = x.Id, name = x.Name, group = x.Group.ToString().ToLower(), color = x.Color, isArchived = x.IsArchived }).ToListAsync());
    [HttpPut("categories")] public async Task<IActionResult> SaveCategories([FromBody] List<CategoryWrite> values)
    {
        if (values.Any(x => string.IsNullOrWhiteSpace(x.Name) || !TryEnum(x.Group, out CategoryGroup _))) return BadRequest(new { title = "Each category needs a name and a valid group." });
        if (values.Select(x => x.Name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Count) return Conflict(new { title = "Category names must be unique." });
        await using var tx = await db.Database.BeginTransactionAsync();
        var current = await db.FinanceCategories.ToListAsync(); var incomingIds = values.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();
        foreach (var item in values) { var category = item.Id.HasValue ? current.FirstOrDefault(x => x.Id == item.Id) : null; if (item.Id.HasValue && category is null) return NotFound(); if (category is null) { category = new FinanceCategory(); db.FinanceCategories.Add(category); } category.Name = item.Name.Trim(); category.Group = Enum.Parse<CategoryGroup>(item.Group!, true); category.Color = item.Color; category.IsArchived = item.IsArchived; }
        foreach (var category in current.Where(x => !incomingIds.Contains(x.Id) && values.All(v => v.Id != x.Id))) { if (await db.FinanceOperations.AnyAsync(x => x.CategoryId == category.Id)) category.IsArchived = true; else db.FinanceCategories.Remove(category); }
        try { await db.SaveChangesAsync(); await tx.CommitAsync(); } catch (DbUpdateException) { return Conflict(new { title = "Category names must be unique." }); }
        return Ok(new { items = (await db.FinanceCategories.OrderBy(x => x.Name).ToListAsync()).Select(CategoryDto) });
    }

    [HttpGet("operations")] public async Task<IActionResult> Operations([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] string? type, [FromQuery] Guid? categoryId, [FromQuery] string? status, [FromQuery] string? search, [FromQuery] bool includeDeleted = false)
    {
        var q = db.FinanceOperations.AsNoTracking().AsQueryable(); if (!includeDeleted) q = q.Where(x => !x.IsDeleted); if (from.HasValue) q = q.Where(x => x.Date >= from); if (to.HasValue) q = q.Where(x => x.Date <= to);
        if (!string.IsNullOrWhiteSpace(type)) { if (!TryEnum(type, out OperationType parsed)) return BadRequest(); q = q.Where(x => x.Type == parsed); }
        if (!string.IsNullOrWhiteSpace(status)) { if (!TryEnum(status, out OperationStatus parsed)) return BadRequest(); q = q.Where(x => x.Status == parsed); }
        if (categoryId.HasValue) q = q.Where(x => x.CategoryId == categoryId); if (!string.IsNullOrWhiteSpace(search)) q = q.Where(x => x.Title.Contains(search) || (x.Note != null && x.Note.Contains(search)));
        return Ok((await q.OrderByDescending(x => x.Date).ThenByDescending(x => x.CreatedAtUtc).ToListAsync()).Select(OperationDto));
    }
    [HttpPost("operations")] public async Task<IActionResult> CreateOperation(OperationWrite w) { var error = await ValidateOperation(w); if (error is not null) return error; var entity = new FinanceOperation(); Apply(entity, w); db.FinanceOperations.Add(entity); await db.SaveChangesAsync(); return Created($"{Request.Path}/{entity.Id}", OperationDto(entity)); }
    [HttpGet("operations/{id:guid}")] public async Task<IActionResult> GetOperation(Guid id) { var x = await db.FinanceOperations.FindAsync(id); return x is null ? NotFound() : Ok(OperationDto(x)); }
    [HttpPut("operations/{id:guid}")] public async Task<IActionResult> UpdateOperation(Guid id, OperationWrite w) { var x = await db.FinanceOperations.FindAsync(id); if (x is null) return NotFound(); var error = await ValidateOperation(w); if (error is not null) return error; Apply(x, w); x.UpdatedAtUtc = DateTime.UtcNow; await db.SaveChangesAsync(); return Ok(OperationDto(x)); }
    [HttpDelete("operations/{id:guid}")] public async Task<IActionResult> DeleteOperation(Guid id) { var x = await db.FinanceOperations.FindAsync(id); if (x is null) return NotFound(); x.IsDeleted = true; await db.SaveChangesAsync(); return NoContent(); }
    [HttpPut("operations/{id:guid}/restore")] public async Task<IActionResult> RestoreOperation(Guid id) { var x = await db.FinanceOperations.FindAsync(id); if (x is null) return NotFound(); x.IsDeleted = false; await db.SaveChangesAsync(); return NoContent(); }
    [HttpDelete("operations/{id:guid}/hard")] public async Task<IActionResult> HardDeleteOperation(Guid id) { var x = await db.FinanceOperations.FindAsync(id); if (x is null) return NotFound(); db.Remove(x); await db.SaveChangesAsync(); return NoContent(); }

    [HttpGet("budgets/templates")] public IActionResult Templates() => Ok(TemplateNames);
    [HttpGet("budgets")] public async Task<IActionResult> Budgets([FromQuery] string? month) { var q = db.MonthlyBudgets.AsNoTracking().OrderBy(x => x.Year).ThenBy(x => x.Month); if (month is not null) { if (!DateOnly.TryParseExact(month + "-01", "yyyy-MM-dd", out var date)) return BadRequest(); var b = await q.FirstOrDefaultAsync(x => x.Year == date.Year && x.Month == date.Month); return b is null ? NotFound() : Ok(await BudgetDto(b)); } return Ok(await Task.WhenAll((await q.ToListAsync()).Select(BudgetDto))); }
    [HttpPut("budgets/{month}")] public async Task<IActionResult> SaveBudget(string month, BudgetWrite w)
    {
        if (!DateOnly.TryParseExact(month + "-01", "yyyy-MM-dd", out var date) || w.Month != month || w.NetIncome < 0) return BadRequest(new { title = "Invalid budget month or income." });
        BudgetTemplate template; try { template = ParseTemplate(w.Template); } catch { return BadRequest(new { title = "Unknown budget template." }); }
        if (template != BudgetTemplate.ZeroBased && (w.Allocations is null || w.Allocations.Needs < 0 || w.Allocations.Wants < 0 || w.Allocations.Savings < 0 || w.Allocations.Needs + w.Allocations.Wants + w.Allocations.Savings != 100)) return BadRequest(new { title = "Budget percentages must be non-negative and total 100." });
        var amounts = w.CategoryAmounts ?? new(); if (amounts.Values.Any(x => x < 0) || amounts.Values.Sum() > w.NetIncome) return BadRequest(new { title = "Category allocations cannot exceed net income." });
        if (amounts.Keys.Any(k => !Guid.TryParse(k, out _)) || !await db.FinanceCategories.Where(x => amounts.Keys.Contains(x.Id.ToString())).CountAsync().ContinueWith(t => t.Result == amounts.Count)) return BadRequest(new { title = "A category allocation refers to an unknown category." });
        var b = await db.MonthlyBudgets.Include(x => x.BudgetCategoryAllocation).FirstOrDefaultAsync(x => x.Year == date.Year && x.Month == date.Month); if (b is null) { b = new MonthlyBudget { Year = date.Year, Month = date.Month }; db.MonthlyBudgets.Add(b); }
        b.Template = template; b.NetIncome = w.NetIncome; b.NeedsPercentage = w.Allocations?.Needs ?? 0; b.WantsPercentage = w.Allocations?.Wants ?? 0; b.SavingsPercentage = w.Allocations?.Savings ?? 0;
        db.BudgetCategoryAllocations.RemoveRange(b.BudgetCategoryAllocation); foreach (var (key, value) in amounts) b.BudgetCategoryAllocation.Add(new BudgetCategoryAllocation { CategoryId = Guid.Parse(key), PlannedAmount = value }); await db.SaveChangesAsync(); return Ok(await BudgetDto(b));
    }

    [HttpGet("goals")] public async Task<IActionResult> Goals([FromQuery] bool includeArchived = false) { var q = db.SavingsGoals.AsNoTracking().AsQueryable(); if (!includeArchived) q = q.Where(x => !x.IsArchived); var goals = await q.OrderBy(x => x.CreatedAtUtc).ToListAsync(); var totals = await db.GoalContributions.GroupBy(x => x.GoalId).Select(x => new { Id = x.Key, Total = x.Sum(y => y.Amount) }).ToDictionaryAsync(x => x.Id, x => x.Total); return Ok(goals.Select(g => GoalDto(g, totals.GetValueOrDefault(g.Id)))); }
    [HttpPost("goals")] public async Task<IActionResult> CreateGoal(GoalWrite w) { var invalid = ValidateGoal(w); if (invalid is not null) return invalid; var g = new SavingsGoal(); Apply(g, w); db.SavingsGoals.Add(g); await db.SaveChangesAsync(); return Created($"{Request.Path}/{g.Id}", GoalDto(g, 0)); }
    [HttpGet("goals/{id:guid}")] public async Task<IActionResult> GetGoal(Guid id) { var g = await db.SavingsGoals.FindAsync(id); if (g is null) return NotFound(); var c = await db.GoalContributions.Where(x => x.GoalId == id).OrderByDescending(x => x.Date).ToListAsync(); return Ok(new { goal = GoalDto(g, c.Sum(x => x.Amount)), contributions = c.Select(ContributionDto) }); }
    [HttpPut("goals/{id:guid}")] public async Task<IActionResult> UpdateGoal(Guid id, GoalWrite w) { var g = await db.SavingsGoals.FindAsync(id); if (g is null) return NotFound(); var invalid = ValidateGoal(w); if (invalid is not null) return invalid; Apply(g, w); await db.SaveChangesAsync(); var sum = await db.GoalContributions.Where(x => x.GoalId == id).SumAsync(x => (decimal?)x.Amount) ?? 0; return Ok(GoalDto(g, sum)); }
    [HttpDelete("goals/{id:guid}")] public async Task<IActionResult> DeleteGoal(Guid id) { var g = await db.SavingsGoals.FindAsync(id); if (g is null) return NotFound(); g.IsArchived = true; await db.SaveChangesAsync(); return NoContent(); }
    [HttpGet("goal-contributions")] public async Task<IActionResult> Contributions() => Ok((await db.GoalContributions.AsNoTracking().OrderByDescending(x => x.Date).ToListAsync()).Select(ContributionDto));
    [HttpPost("goal-contributions")] public async Task<IActionResult> AddContribution(ContributionWrite w) => await CreateContribution(w.GoalId, w);
    [HttpGet("goals/{goalId:guid}/contributions")] public async Task<IActionResult> GoalContributions(Guid goalId) => !await db.SavingsGoals.AnyAsync(x => x.Id == goalId) ? NotFound() : Ok((await db.GoalContributions.Where(x => x.GoalId == goalId).OrderByDescending(x => x.Date).ToListAsync()).Select(ContributionDto));
    [HttpPost("goals/{goalId:guid}/contributions")] public async Task<IActionResult> AddGoalContribution(Guid goalId, ContributionWrite w) => await CreateContribution(goalId, w);
    [HttpDelete("goals/{goalId:guid}/contributions/{id:guid}")] public async Task<IActionResult> DeleteContribution(Guid goalId, Guid id) { var c = await db.GoalContributions.FirstOrDefaultAsync(x => x.Id == id && x.GoalId == goalId); if (c is null) return NotFound(); db.Remove(c); await db.SaveChangesAsync(); return NoContent(); }

    [HttpGet("overview")] public async Task<IActionResult> Overview([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        if (from > to) return BadRequest(); var ops = await db.FinanceOperations.Include(x => x.Category).Where(x => !x.IsDeleted && x.Date >= from && x.Date <= to).ToListAsync(); var completed = ops.Where(x => x.Status == OperationStatus.Completed).ToList(); var income = completed.Where(x => x.Type == OperationType.Income).Sum(x => x.Amount); var expenses = completed.Where(x => x.Type == OperationType.Expense).Sum(x => x.Amount); var contributions = await db.GoalContributions.Where(x => x.Date >= from && x.Date <= to).SumAsync(x => (decimal?)x.Amount) ?? 0;
        return Ok(new { currency = "UAH", actualIncome = income, actualExpenses = expenses, balance = income - expenses, plannedIncome = ops.Where(x => x.Status == OperationStatus.Planned && x.Type == OperationType.Income).Sum(x => x.Amount), plannedExpenses = ops.Where(x => x.Status == OperationStatus.Planned && x.Type == OperationType.Expense).Sum(x => x.Amount), goalContributions = contributions, expensesByDay = completed.Where(x => x.Type == OperationType.Expense).GroupBy(x => x.Date).Select(x => new { date = x.Key.ToString("yyyy-MM-dd"), amount = x.Sum(y => y.Amount) }), expensesByCategory = completed.Where(x => x.Type == OperationType.Expense).GroupBy(x => new { x.CategoryId, x.Category.Name }).Select(x => new { categoryId = x.Key.CategoryId, name = x.Key.Name, amount = x.Sum(y => y.Amount) }), upcomingPayments = ops.Where(x => x.Status == OperationStatus.Planned && x.Type == OperationType.Expense).OrderBy(x => x.Date).Select(x => new { operationId = x.Id, title = x.Title, date = x.Date.ToString("yyyy-MM-dd"), amount = x.Amount }) });
    }

    private async Task<IActionResult?> ValidateOperation(OperationWrite w) { if (string.IsNullOrWhiteSpace(w.Title) || w.Amount <= 0 || !DateOnly.TryParseExact(w.Date, "yyyy-MM-dd", out _) || !TryEnum(w.Type, out OperationType _) || !TryEnum(w.Status, out OperationStatus _) || (w.Recurring && !TryEnum(w.Frequency, out RecurrenceFrequency _))) return BadRequest(new { title = "Operation fields are invalid." }); if (w.Recurring && string.IsNullOrWhiteSpace(w.Frequency)) return BadRequest(new { title = "Recurring operations require a frequency." }); if (!await db.FinanceCategories.AnyAsync(x => x.Id == w.CategoryId && !x.IsArchived)) return BadRequest(new { title = "Choose an active category." }); return null; }
    private static void Apply(FinanceOperation x, OperationWrite w) { x.Title = w.Title.Trim(); x.Amount = w.Amount; x.Type = Enum.Parse<OperationType>(w.Type!, true); x.CategoryId = w.CategoryId; x.Date = DateOnly.ParseExact(w.Date!, "yyyy-MM-dd"); x.Status = Enum.Parse<OperationStatus>(w.Status!, true); x.Account = w.Account; x.Note = w.Note; x.Recurring = w.Recurring; x.Frequency = string.IsNullOrWhiteSpace(w.Frequency) ? null : Enum.Parse<RecurrenceFrequency>(w.Frequency, true); }
    private static IActionResult? ValidateGoal(GoalWrite w) => string.IsNullOrWhiteSpace(w.Name) || w.TargetAmount <= 0 || w.SavedAmount < 0 || (w.TargetDate is not null && !DateOnly.TryParseExact(w.TargetDate, "yyyy-MM-dd", out _)) || !TryEnum(w.Priority, out GoalPriority _) ? new BadRequestObjectResult(new { title = "Goal fields are invalid." }) : null;
    private static void Apply(SavingsGoal g, GoalWrite w) { g.Name = w.Name.Trim(); g.TargetAmount = w.TargetAmount; g.InitialSavedAmount = w.SavedAmount; g.TargetDate = w.TargetDate is null ? null : DateOnly.ParseExact(w.TargetDate, "yyyy-MM-dd"); g.Priority = Enum.Parse<GoalPriority>(w.Priority!, true); g.Note = w.Note; }
    private async Task<IActionResult> CreateContribution(Guid? goalId, ContributionWrite w) { var id = goalId ?? w.GoalId; if (w.Amount <= 0 || !DateOnly.TryParseExact(w.Date, "yyyy-MM-dd", out _)) return BadRequest(new { title = "Contribution fields are invalid." }); if (!await db.SavingsGoals.AnyAsync(x => x.Id == id && !x.IsArchived)) return NotFound(); var c = new GoalContribution { GoalId = id!.Value, Amount = w.Amount, Date = DateOnly.ParseExact(w.Date!, "yyyy-MM-dd"), Note = w.Note }; db.GoalContributions.Add(c); await db.SaveChangesAsync(); return Created($"/api/finance/goals/{id}/contributions/{c.Id}", ContributionDto(c)); }
}

public record CategoryWrite(Guid? Id, string? Name, string? Group, string? Color, bool IsArchived = false);
public record OperationWrite(string? Title, decimal Amount, string? Type, Guid CategoryId, string? Date, string? Status, string? Account, string? Note, bool Recurring, string? Frequency);
public record AllocationWrite(decimal Needs, decimal Wants, decimal Savings);
public record BudgetWrite(string? Month, string? Template, decimal NetIncome, AllocationWrite? Allocations, Dictionary<string, decimal>? CategoryAmounts, Dictionary<string, string>? CategoryGroups);
public record GoalWrite(string? Name, decimal TargetAmount, decimal SavedAmount, string? TargetDate, string? Priority, string? Note);
public record ContributionWrite(Guid? GoalId, decimal Amount, string? Date, string? Note);
