using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backendapi.Data;
using finalpracticeproject.DTOs;
using Backendapi.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace finalpracticeproject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ResultsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ResultsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Results
        [HttpGet]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<IEnumerable<Result>>> GetResults()
        {
            return await _context.Results.ToListAsync();
        }

        // GET: api/Results/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Result>> GetResult(Guid? id)
        {
            var result = await _context.Results.FindAsync(id);

            if (result == null)
            {
                return NotFound();
            }

            // Check if user is authorized to view this result
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != result.UserId.ToString() && !User.IsInRole("Instructor"))
            {
                return Forbid();
            }

            return result;
        }

        // PUT: api/Results/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutResult(Guid id, ResultCreateDto resultDto)
        {
            if (id != resultDto.ResultId)
            {
                return BadRequest();
            }

            var result = await _context.Results.FindAsync(id);
            if (result == null)
            {
                return NotFound();
            }

            result.Score = (int)resultDto.Score;
            result.UserId = (Guid)resultDto.UserId;
            result.AssessmentId = (Guid)resultDto.AssessmentId;
            result.AttemptDate = resultDto.AttemptDate;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Results
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Result>> PostResult(ResultCreateDto resultDto)
        {
            var result = new Result
            {
                ResultId = resultDto.ResultId,
                AssessmentId = (Guid)resultDto.AssessmentId,
                UserId = (Guid)resultDto.UserId,
                Score = (int)resultDto.Score,
                AttemptDate = resultDto.AttemptDate
            };

            _context.Results.Add(result);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetResult", new { id = result.ResultId }, result);
        }

        // POST: api/Results/submit
        [HttpPost("submit")]
        public async Task<ActionResult<object>> SubmitAssessment([FromBody] AssessmentSubmissionDto submission)
        {
            // Validate assessment and user
            var assessment = await _context.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(a => a.AssessmentId == submission.AssessmentId);
            if (assessment == null)
                return NotFound("Assessment not found");

            var user = await _context.Users.FindAsync(submission.UserId);
            if (user == null)
                return NotFound("User not found");

            // Create Result
            var result = new Result
            {
                ResultId = Guid.NewGuid(),
                AssessmentId = assessment.AssessmentId,
                UserId = user.UserId,
                AttemptDate = DateTime.UtcNow,
                StudentAnswers = new List<StudentAnswer>()
            };

            int score = 0;
            foreach (var answer in submission.Answers)
            {
                var question = assessment.Questions.FirstOrDefault(q => q.QuestionId == answer.QuestionId);
                if (question == null) continue;
                var selectedOption = question.Options.FirstOrDefault(o => o.OptionId == answer.SelectedOptionId);
                if (selectedOption == null) continue;

                // Check if correct
                if (selectedOption.IsCorrect)
                    score++;

                result.StudentAnswers.Add(new StudentAnswer
                {
                    AnswerId = Guid.NewGuid(),
                    ResultId = result.ResultId,
                    QuestionId = question.QuestionId,
                    SelectedOptionId = selectedOption.OptionId
                });
            }
            result.Score = score;

            _context.Results.Add(result);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                ResultId = result.ResultId,
                Score = result.Score,
                AttemptDate = result.AttemptDate,
                StudentAnswers = result.StudentAnswers.Select(sa => new
                {
                    sa.QuestionId,
                    sa.SelectedOptionId
                })
            });
        }

        // DELETE: api/Results/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResult(Guid id)
        {
            var result = await _context.Results.FindAsync(id);
            if (result == null)
            {
                return NotFound();
            }

            _context.Results.Remove(result);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Results/student/{userId}/assessment/{assessmentId}
        [HttpGet("student/{userId}/assessment/{assessmentId}")]
        public async Task<ActionResult<object>> GetStudentAssessmentResult(Guid userId, Guid assessmentId)
        {
            // Check if user is authorized to view this result
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId != userId.ToString() && !User.IsInRole("Instructor"))
            {
                return Forbid();
            }

            var result = await _context.Results
                .Include(r => r.StudentAnswers)
                .Include(r => r.Assessment)
                    .ThenInclude(a => a.Questions)
                        .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(r => r.UserId == userId && r.AssessmentId == assessmentId);

            if (result == null)
                return NotFound("No submission found for this assessment");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            return Ok(new
            {
                ResultId = result.ResultId,
                UserName = user.Name,
                AssessmentTitle = result.Assessment?.Title,
                Score = result.Score,
                MaxScore = result.Assessment?.Questions.Count ?? 0,
                AttemptDate = result.AttemptDate,
                Answers = result.StudentAnswers.Select(sa => new
                {
                    QuestionId = sa.QuestionId,
                    QuestionText = result.Assessment?.Questions
                        .FirstOrDefault(q => q.QuestionId == sa.QuestionId)?.QuestionText,
                    SelectedOptionId = sa.SelectedOptionId,
                    SelectedOptionText = result.Assessment?.Questions
                        .SelectMany(q => q.Options)
                        .FirstOrDefault(o => o.OptionId == sa.SelectedOptionId)?.Text,
                    IsCorrect = result.Assessment?.Questions
                        .SelectMany(q => q.Options)
                        .FirstOrDefault(o => o.OptionId == sa.SelectedOptionId)?.IsCorrect ?? false
                })
            });
        }

        // GET: api/Results/assessment/{assessmentId}/submissions
        [HttpGet("assessment/{assessmentId}/submissions")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssessmentSubmissions(Guid assessmentId)
        {
            var assessment = await _context.Assessments
                .Include(a => a.Questions)
                .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

            if (assessment == null)
                return NotFound("Assessment not found");

            var submissions = await _context.Results
                .Include(r => r.StudentAnswers)
                .Include(r => r.User)
                .Where(r => r.AssessmentId == assessmentId)
                .OrderByDescending(r => r.AttemptDate)
                .ToListAsync();

            return Ok(submissions.Select(s => new
            {
                ResultId = s.ResultId,
                UserId = s.UserId,
                UserName = s.User?.Name,
                Score = s.Score,
                MaxScore = assessment.Questions.Count,
                AttemptDate = s.AttemptDate,
                AnswerCount = s.StudentAnswers.Count,
                Percentage = assessment.Questions.Count > 0 
                    ? Math.Round((double)s.Score / assessment.Questions.Count * 100, 2) 
                    : 0
            }));
        }

        // GET: api/Results/assessment/{assessmentId}/submission/{resultId}
        [HttpGet("assessment/{assessmentId}/submission/{resultId}")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<object>> GetDetailedSubmission(Guid assessmentId, Guid resultId)
        {
            var submission = await _context.Results
                .Include(r => r.StudentAnswers)
                .Include(r => r.User)
                .Include(r => r.Assessment)
                    .ThenInclude(a => a.Questions)
                        .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(r => r.ResultId == resultId && r.AssessmentId == assessmentId);

            if (submission == null)
                return NotFound("Submission not found");

            return Ok(new
            {
                ResultId = submission.ResultId,
                UserId = submission.UserId,
                UserName = submission.User?.Name,
                AssessmentTitle = submission.Assessment?.Title,
                Score = submission.Score,
                MaxScore = submission.Assessment?.Questions.Count ?? 0,
                Percentage = submission.Assessment?.Questions.Count > 0 
                    ? Math.Round((double)submission.Score / submission.Assessment.Questions.Count * 100, 2) 
                    : 0,
                AttemptDate = submission.AttemptDate,
                Answers = submission.StudentAnswers.Select(sa => new
                {
                    QuestionId = sa.QuestionId,
                    QuestionText = submission.Assessment?.Questions
                        .FirstOrDefault(q => q.QuestionId == sa.QuestionId)?.QuestionText,
                    SelectedOptionId = sa.SelectedOptionId,
                    SelectedOptionText = submission.Assessment?.Questions
                        .SelectMany(q => q.Options)
                        .FirstOrDefault(o => o.OptionId == sa.SelectedOptionId)?.Text,
                    IsCorrect = submission.Assessment?.Questions
                        .SelectMany(q => q.Options)
                        .FirstOrDefault(o => o.OptionId == sa.SelectedOptionId)?.IsCorrect ?? false,
                    AllOptions = submission.Assessment?.Questions
                        .FirstOrDefault(q => q.QuestionId == sa.QuestionId)?.Options
                        .Select(o => new
                        {
                            OptionId = o.OptionId,
                            Text = o.Text,
                            IsCorrect = o.IsCorrect
                        })
                })
            });
        }

        private bool ResultExists(Guid? id)
        {
            return _context.Results.Any(e => e.ResultId == id);
        }
    }
}
