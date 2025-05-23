using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using finalpracticeproject.DTOs;
using Backendapi.Data;
using Backendapi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace Backendapi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AssessmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AssessmentsController> _logger;

        public AssessmentsController(AppDbContext context, ILogger<AssessmentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Assessments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Assessment>>> GetAssessments()
        {
            return await _context.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Options)
                .ToListAsync();
        }

        // GET: api/Assessments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Assessment>> GetAssessment(Guid id)
        {
            var assessment = await _context.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(a => a.AssessmentId == id);

            if (assessment == null)
            {
                return NotFound();
            }

            return assessment;
        }

        // PUT: api/Assessments/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAssessment(Guid id, AssessmentCreateDto assessmentDto)
        {
            if (id != assessmentDto.AssessmentId)
            {
                return BadRequest();
            }

            var assessment = await _context.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(a => a.AssessmentId == id);

            if (assessment == null)
            {
                return NotFound();
            }

            // Update basic properties
            assessment.Title = assessmentDto.Title;
            assessment.MaxScore = assessmentDto.MaxScore;
            assessment.CourseId = assessmentDto.CourseId;

            // Remove existing questions and options
            _context.Options.RemoveRange(assessment.Questions.SelectMany(q => q.Options));
            _context.Questions.RemoveRange(assessment.Questions);

            // Add new questions and options
            foreach (var questionDto in assessmentDto.Questions)
            {
                var question = new Question
                {
                    QuestionId = questionDto.QuestionId,
                    AssessmentId = assessment.AssessmentId,
                    QuestionText = questionDto.QuestionText
                };

                // Add options to the question
                foreach (var optionDto in questionDto.Options)
                {
                    question.Options.Add(new Option
                    {
                        OptionId = optionDto.OptionId,
                        Text = optionDto.Text,
                        IsCorrect = optionDto.IsCorrect
                    });
                }

                assessment.Questions.Add(question);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AssessmentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Assessments
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Assessment>> PostAssessment(AssessmentCreateDto assessmentDto)
        {
            try
            {
                var assessment = new Assessment
                {
                    AssessmentId = assessmentDto.AssessmentId,
                    CourseId = assessmentDto.CourseId,
                    Title = assessmentDto.Title,
                    MaxScore = assessmentDto.MaxScore
                };

                // Add questions and options
                foreach (var questionDto in assessmentDto.Questions)
                {
                    var question = new Question
                    {
                        QuestionId = questionDto.QuestionId,
                        AssessmentId = assessment.AssessmentId,
                        QuestionText = questionDto.QuestionText
                    };

                    // Add options to the question
                    foreach (var optionDto in questionDto.Options)
                    {
                        question.Options.Add(new Option
                        {
                            OptionId = optionDto.OptionId,
                            Text = optionDto.Text,
                            IsCorrect = optionDto.IsCorrect
                        });
                    }

                    assessment.Questions.Add(question);
                }

                _context.Assessments.Add(assessment);
                await _context.SaveChangesAsync();

                // Return a simplified version of the created assessment without circular references
                return CreatedAtAction("GetAssessment", new { id = assessment.AssessmentId }, new
                {
                    assessment.AssessmentId,
                    assessment.CourseId,
                    assessment.Title,
                    assessment.MaxScore,
                    Questions = assessment.Questions.Select(q => new
                    {
                        q.QuestionId,
                        q.QuestionText,
                        Options = q.Options.Select(o => new
                        {
                            o.OptionId,
                            o.Text,
                            o.IsCorrect
                        })
                    })
                });
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.WriteLine($"Error creating assessment: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while creating the assessment", details = ex.Message });
            }
        }

        // DELETE: api/Assessments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssessment(Guid id)
        {
            try
            {
                _logger.LogInformation($"Attempting to delete assessment with ID: {id}");

                var assessment = await _context.Assessments
                    .Include(a => a.Results)
                    .Include(a => a.Questions)
                    .FirstOrDefaultAsync(a => a.AssessmentId == id);

                if (assessment == null)
                {
                    _logger.LogWarning($"Assessment with ID {id} not found");
                    return NotFound(new { message = "Assessment not found" });
                }

                // Log the related entities that will be deleted
                _logger.LogInformation($"Found {assessment.Results.Count} results and {assessment.Questions.Count} questions to delete");

                // Remove the assessment and all related entities
                _context.Assessments.Remove(assessment);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Successfully deleted assessment with ID: {id}");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting assessment with ID: {id}");
                return StatusCode(500, new { 
                    message = "Error deleting assessment",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        private bool AssessmentExists(Guid id)
        {
            return _context.Assessments.Any(e => e.AssessmentId == id);
        }

        // GET: api/Assessments/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssessmentsByCourse(Guid courseId)
        {
            try
            {
                _logger.LogInformation($"Fetching assessments for course {courseId}");

                // First verify the course exists
                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == courseId);
                if (!courseExists)
                {
                    _logger.LogWarning($"Course {courseId} not found");
                    return NotFound(new { message = "Course not found" });
                }

                var assessments = await _context.Assessments
                    .Include(a => a.Questions)
                    .Where(a => a.CourseId == courseId)
                    .Select(a => new
                    {
                        a.AssessmentId,
                        a.Title,
                        a.MaxScore,
                        QuestionCount = a.Questions.Count
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {assessments.Count} assessments for course {courseId}");

                // Return empty list if no assessments found
                return Ok(assessments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching assessments for course {courseId}");
                return StatusCode(500, new { 
                    message = "An error occurred while fetching assessments", 
                    details = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}
