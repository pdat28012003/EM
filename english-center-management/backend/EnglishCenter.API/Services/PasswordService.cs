using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace EnglishCenter.API.Services
{
    public class PasswordService : IPasswordService
    {
        private const int SaltSize = 16;
        private const int HashSize = 32;
        private const int Iterations = 10000;

        public string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = new byte[SaltSize];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password
            byte[] hash = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: Iterations,
                numBytesRequested: HashSize
            );

            // Combine salt and hash
            byte[] hashBytes = new byte[SaltSize + HashSize];
            Array.Copy(salt, 0, hashBytes, 0, SaltSize);
            Array.Copy(hash, 0, hashBytes, SaltSize, HashSize);

            // Convert to base64
            return Convert.ToBase64String(hashBytes);
        }

        public bool VerifyPassword(string password, string hash)
        {
            try
            {
                // Convert base64 string to bytes
                byte[] hashBytes = Convert.FromBase64String(hash);
                
                // Extract salt
                byte[] salt = new byte[SaltSize];
                Array.Copy(hashBytes, 0, salt, 0, SaltSize);
                
                // Compute hash of the provided password
                byte[] computedHash = KeyDerivation.Pbkdf2(
                    password: password,
                    salt: salt,
                    prf: KeyDerivationPrf.HMACSHA256,
                    iterationCount: Iterations,
                    numBytesRequested: HashSize
                );
                
                // Compare the computed hash with the stored hash
                for (int i = 0; i < HashSize; i++)
                {
                    if (hashBytes[SaltSize + i] != computedHash[i])
                    {
                        return false;
                    }
                }
                
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
