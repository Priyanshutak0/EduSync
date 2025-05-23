using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backendapi.Models;
using Backendapi.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Backendapi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<User>> Register(UserDto request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest("User already exists");
        }

        CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Role = request.Role ?? "User",
            PasswordHash = Convert.ToBase64String(passwordHash),
            PasswordSalt = Convert.ToBase64String(passwordSalt)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok("User registered successfully");
    }

    [HttpPost("login")]
    public async Task<ActionResult<object>> Login(UserDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            return BadRequest("User not found");
        }

        // Check if both hash and salt are null
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            return BadRequest("Invalid user account. Please register again.");
        }

        try
        {
            // Handle users with null password salt (old users)
            if (string.IsNullOrEmpty(user.PasswordSalt))
            {
                // For old users, verify password without salt
                if (!VerifyPasswordHashWithoutSalt(request.Password, Convert.FromBase64String(user.PasswordHash)))
                {
                    return BadRequest("Wrong password");
                }

                // Update user with new salt
                CreatePasswordHash(request.Password, out byte[] newHash, out byte[] newSalt);
                user.PasswordHash = Convert.ToBase64String(newHash);
                user.PasswordSalt = Convert.ToBase64String(newSalt);
                await _context.SaveChangesAsync();
            }
            else
            {
                // For new users, verify with salt
                if (!VerifyPasswordHash(request.Password, 
                    Convert.FromBase64String(user.PasswordHash), 
                    Convert.FromBase64String(user.PasswordSalt)))
                {
                    return BadRequest("Wrong password");
                }
            }

            string token = CreateToken(user);
            
            return Ok(new { 
                token = token,
                user = new {
                    userId = user.UserId,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role
                }
            });
        }
        catch (Exception ex)
        {
            // Log the exception details
            Console.WriteLine($"Login error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest("An error occurred during login. Please try again.");
        }
    }

    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512())
        {
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }

    private bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
    {
        using (var hmac = new HMACSHA512(storedSalt))
        {
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(storedHash);
        }
    }

    private bool VerifyPasswordHashWithoutSalt(string password, byte[] storedHash)
    {
        using (var hmac = new HMACSHA512())
        {
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(storedHash);
        }
    }
}

public class UserDto
{
    public string Name { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Role { get; set; }
} 