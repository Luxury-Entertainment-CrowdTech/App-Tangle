using HomomorphicEncryptionService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Research.SEAL;
using System.Numerics;
using System.Text;

namespace HomomorphicEncryptionService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EncryptionController : Controller
    {
        private readonly ILogger<EncryptionController> _logger;
        private Encryptor encryptor;
        private Decryptor decryptor;
        private KeyGenerator keyGenerator;
        private SecretKey secretKey;
        private PublicKey publicKey;
        private SEALContext context;
        private EncryptionParameters parms;
        private IntegerEncoder encoder;
        private static object instance;

        public EncryptionController(ILogger<EncryptionController> logger)
        {
            _logger = logger;
            // Configurar los parámetros del cifrado homomórfico
            parms = new EncryptionParameters(SchemeType.BFV);
            parms.PolyModulusDegree = 4096;
            parms.CoeffModulus = CoeffModulus.BFVDefault(4096);
            parms.PlainModulus = PlainModulus.Batching(4096, 20);

            context = new SEALContext(parms);
            DotNetEnv.Env.Load();

            // Comprobar si las claves ya están en las variables de entorno
            string publicKeyString = Environment.GetEnvironmentVariable("PUBLIC_KEY");
            string secretKeyString = Environment.GetEnvironmentVariable("SECRET_KEY");

            if (!string.IsNullOrEmpty(publicKeyString) && !string.IsNullOrEmpty(secretKeyString))
            {
                publicKey = LoadPublicKeyFromString(publicKeyString);
                secretKey = LoadSecretKeyFromString(secretKeyString);

                // Ahora, puedes usar publicKey y secretKey para configurar el cifrado
                SetupCifrado(publicKey, secretKey);
            }
            else
            {
                // Si las claves no existen en las variables de entorno, genera y guarda nuevas claves
                GenerarYGuardarClaves();
            }
            encoder = new IntegerEncoder(context);
        }

        private void SetupCifrado(PublicKey publicKey, SecretKey secretKey)
        {
            encryptor = new Encryptor(context, publicKey);
            decryptor = new Decryptor(context, secretKey);
        }
        private PublicKey LoadPublicKeyFromString(string publicKeyString)
        {
            byte[] publicKeyBytes = Convert.FromBase64String(publicKeyString);
            using (MemoryStream publicKeyStream = new MemoryStream(publicKeyBytes))
            {
                PublicKey publicKey = new PublicKey();
                publicKey.Load(context, publicKeyStream);
                return publicKey;
            }
        }

        private SecretKey LoadSecretKeyFromString(string secretKeyString)
        {
            byte[] secretKeyBytes = Convert.FromBase64String(secretKeyString);
            using (MemoryStream secretKeyStream = new MemoryStream(secretKeyBytes))
            {
                SecretKey secretKey = new SecretKey();
                secretKey.Load(context, secretKeyStream);
                return secretKey;
            }
        }
        private void GenerarYGuardarClaves()
        {
            keyGenerator = new KeyGenerator(context);

            publicKey = keyGenerator.PublicKey;
            secretKey = keyGenerator.SecretKey;

            // Convertir las claves en cadenas Base64
            string publicKeyString = PublicKeyToString(publicKey);
            string secretKeyString = SecretKeyToString(secretKey);

            // Guardar las cadenas en las variables de entorno
            Environment.SetEnvironmentVariable("PUBLIC_KEY", publicKeyString);
            Environment.SetEnvironmentVariable("SECRET_KEY", secretKeyString);

            SetupCifrado(publicKey, secretKey);
        }
        private string PublicKeyToString(PublicKey publicKey)
        {
            using (MemoryStream publicKeyStream = new MemoryStream())
            {
                publicKey.Save(publicKeyStream);
                return Convert.ToBase64String(publicKeyStream.ToArray());
            }
        }
        private string SecretKeyToString(SecretKey secretKey)
        {
            using (MemoryStream secretKeyStream = new MemoryStream())
            {
                secretKey.Save(secretKeyStream);
                return Convert.ToBase64String(secretKeyStream.ToArray());
            }
        }
        // public static EncryptionController GetInstance()
        // {
        //     if (instance == null)
        //     {
        //         instance = new EncryptionController();
        //     }
        //     return (EncryptionController)instance;
        // }

        [HttpGet("/")]
        public IActionResult Index()
        {
            _logger.LogInformation("Accessing the index route of Homomorphic Encryption Service.");
            return Ok("Homomorphic Encryption Service is running.");
        }

        public class EncryptRequest
{
    public string PlainText { get; set; }
}

        [HttpPost("encrypt")]
        public ActionResult<string> Encrypt([FromBody] EncryptRequest request)
        {
            try
            {
                var plainText = request.PlainText;
                _logger.LogInformation($"Attempting to encrypt data: {plainText}");
                
                byte[] bytes = Encoding.UTF8.GetBytes(plainText);

                // Asegúrate de que los datos sean del tamaño adecuado
                if (bytes.Length % 8 != 0)
                {
                    Array.Resize(ref bytes, bytes.Length + (8 - bytes.Length % 8));
                }

                StringBuilder encryptedString = new StringBuilder();

                for (int i = 0; i < bytes.Length; i += 8)
                {
                    long valorNumerico = BitConverter.ToInt64(bytes, i);
                    var textoplano = new Plaintext();
                    encoder.Encode(valorNumerico, textoplano);
                    var cipherText = new Ciphertext();
                    encryptor.Encrypt(textoplano, cipherText);

                    using (MemoryStream stream = new MemoryStream())
                    {
                        cipherText.Save(stream);
                        encryptedString.Append(Convert.ToBase64String(stream.ToArray()) + "|");
                    }
                }

                _logger.LogInformation("Data encrypted successfully.");
                // return encryptedString.ToString().TrimEnd('|');
                var result = new { encryptedText = encryptedString.ToString().TrimEnd('|') };
                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error while encrypting data.");
                Console.WriteLine(e.ToString());
                return StatusCode(500, "Error en la encriptación");
            }
        }

public class DecryptRequest
{
    public string CipherTextString { get; set; }
}

        [HttpPost("decrypt")]
        public ActionResult<string> Decrypt([FromBody] DecryptRequest request)
        {
            try
            {
                var cipherTextString = request.CipherTextString;
                _logger.LogInformation($"Attempting to decrypt data: {cipherTextString}");
                string[] encryptedBlocks = cipherTextString.Split('|');
                byte[] decryptedBytes = new byte[encryptedBlocks.Length * 8];

                for (int i = 0; i < encryptedBlocks.Length; i++)
                {
                    byte[] cipherBytes = Convert.FromBase64String(encryptedBlocks[i]);
                    using (MemoryStream stream = new MemoryStream(cipherBytes))
                    {
                        var cipherText = new Ciphertext();
                        cipherText.Load(context, stream);
                        var plainText = new Plaintext();
                        decryptor.Decrypt(cipherText, plainText);
                        long valorNumerico = encoder.DecodeInt64(plainText);
                        BitConverter.GetBytes(valorNumerico).CopyTo(decryptedBytes, i * 8);
                    }
                }

                // Elimina el relleno al final
                int nullIndex = Array.IndexOf(decryptedBytes, (byte)0);
                if (nullIndex >= 0)
                {
                    Array.Resize(ref decryptedBytes, nullIndex);
                }

                _logger.LogInformation("Data decrypted successfully.");
                // return Encoding.UTF8.GetString(decryptedBytes);
                var result = new { plainText = Encoding.UTF8.GetString(decryptedBytes) };
                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error while decrypting data.");
                Console.WriteLine($"Error al desencriptar texto: {e.ToString()}");
                return StatusCode(500, "Error en el descifrado");
            }
        }
        

    }
}
