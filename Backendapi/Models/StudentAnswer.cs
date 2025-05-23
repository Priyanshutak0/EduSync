using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backendapi.Models;

public class StudentAnswer
{
    [Key]
    public Guid AnswerId { get; set; }

    public Guid ResultId { get; set; }

    public Guid QuestionId { get; set; }

    public Guid SelectedOptionId { get; set; }

    // Navigation
    [ForeignKey("ResultId")]
    public virtual Result? Result { get; set; }

    [ForeignKey("QuestionId")]
    public virtual Question? Question { get; set; }

    [ForeignKey("SelectedOptionId")]
    public virtual Option? SelectedOption { get; set; }
} 