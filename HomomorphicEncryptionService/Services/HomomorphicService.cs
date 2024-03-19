using HomomorphicEncryptionService.Services.Interfaces;
using Microsoft.Research.SEAL;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using Microsoft.Extensions.Logging;

namespace HomomorphicEncryptionService.Services
{
    /// <summary>
    /// Servicio para realizar cifrado y descifrado homomórfico.
    /// </summary>
    public class HomomorphicService : IHomomorphicEncryptionService
    {
        private const string PublicKeyPath = "publicKey.json";
        private const string SecretKeyPath = "secretKey.json";
        private readonly ILogger<HomomorphicService> _logger;

        private SEALContext _context;
        private Encryptor _encryptor;
        private Decryptor _decryptor;
        private Evaluator _evaluator;
        private BatchEncoder _batchEncoder;
        private PublicKey _publicKey;
        private SecretKey _secretKey;

        /// <summary>
        /// Constructor del servicio HomomorphicService.
        /// </summary>
        /// <param name="logger">Registrador de eventos utilizado por este servicio.</param>
#pragma warning disable CS8618 // Un campo que no acepta valores NULL debe contener un valor distinto de NULL al salir del constructor. Considere la posibilidad de declararlo como que admite un valor NULL.
        public HomomorphicService(
#pragma warning restore CS8618 // Un campo que no acepta valores NULL debe contener un valor distinto de NULL al salir del constructor. Considere la posibilidad de declararlo como que admite un valor NULL.
            ILogger<HomomorphicService> logger)
        {
            _logger = logger;
            InitializeSEAL();
            LoadOrCreateKeys();
        }

        /// <summary>
        /// Inicializa el contexto SEAL y las herramientas de cifrado.
        /// </summary>
        private void InitializeSEAL()
        {
            var parms = new EncryptionParameters(SchemeType.BFV)
            {
                PolyModulusDegree = 4096,
                CoeffModulus = CoeffModulus.BFVDefault(4096),
                PlainModulus = PlainModulus.Batching(4096, 20)
            };
            _context = new SEALContext(parms);
            _evaluator = new Evaluator(_context);
            _batchEncoder = new BatchEncoder(_context);
        }

        /// <summary>
        /// Carga o crea las claves necesarias para el cifrado/descifrado.
        /// </summary>
        private void LoadOrCreateKeys()
        {
            if (System.IO.File.Exists(PublicKeyPath) && System.IO.File.Exists(SecretKeyPath))
            {
                _logger.LogInformation("Loading existing keys.");
                LoadKeys();
            }
            else
            {
                _logger.LogInformation("Generating and saving new keys.");
                GenerateAndSaveKeys();
            }
        }

        /// <summary>
        /// Carga las claves desde el sistema de archivos.
        /// </summary>
        private void LoadKeys()
        {
            using (var stream = new FileStream(PublicKeyPath, FileMode.Open))
            {
                _publicKey = new PublicKey();
                _publicKey.Load(_context, stream);
            }

            using (var stream = new FileStream(SecretKeyPath, FileMode.Open))
            {
                _secretKey = new SecretKey();
                _secretKey.Load(_context, stream);
            }

            _encryptor = new Encryptor(_context, _publicKey);
            _decryptor = new Decryptor(_context, _secretKey);
        }

        /// <summary>
        /// Genera y guarda las claves de cifrado.
        /// </summary>
        private void GenerateAndSaveKeys()
        {
            var keyGen = new KeyGenerator(_context);
            // Usar CreatePublicKey para generar la clave pública
            _publicKey = new PublicKey();
            keyGen.CreatePublicKey(out _publicKey);
            _secretKey = keyGen.SecretKey;

            // Crear el Encryptor y Decryptor con las claves generadas
            _encryptor = new Encryptor(_context, _publicKey);
            _decryptor = new Decryptor(_context, _secretKey);

            // Guardar las claves en archivos
            SaveKeys();
        }

        private void SaveKeys()
        {
            // Guardar la clave pública
            using (var stream = new FileStream(PublicKeyPath, FileMode.Create))
            {
                _publicKey.Save(stream);
            }

            // Guardar la clave secreta
            using (var stream = new FileStream(SecretKeyPath, FileMode.Create))
            {
                _secretKey.Save(stream);
            }
        }

        /// <summary>
        /// Cifra el texto proporcionado.
        /// </summary>
        /// <param name="text">El texto a cifrar.</param>
        /// <returns>El texto cifrado en formato base64.</returns>
        public string EncryptText(string text)
        {
            var valuesToEncode = TextToNumbers(text);
            var plaintext = new Plaintext();
            _batchEncoder.Encode(valuesToEncode, plaintext);

            var ciphertext = new Ciphertext();
            _encryptor.Encrypt(plaintext, ciphertext);

            byte[] ciphertextBytes;
            using (var ms = new System.IO.MemoryStream())
            {
                ciphertext.Save(ms);
                ciphertextBytes = ms.ToArray();
            }

            string ciphertextBase64 = Convert.ToBase64String(ciphertextBytes);
            _logger.LogInformation("Text encrypted successfully.");
            return ciphertextBase64;
        }

        /// <summary>
        /// Descifra el texto proporcionado.
        /// </summary>
        /// <param name="cipherTextBase64">El texto cifrado en formato base64.</param>
        /// <returns>El texto descifrado.</returns>
        public string DecryptText(string cipherTextBase64)
        {
            byte[] ciphertextBytes = Convert.FromBase64String(cipherTextBase64);
            Ciphertext ciphertext = new Ciphertext();
            using (var ms = new System.IO.MemoryStream(ciphertextBytes))
            {
                ciphertext.Load(_context, ms);
            }

            var plaintext = new Plaintext();
            _decryptor.Decrypt(ciphertext, plaintext);

            var decodedValues = new List<ulong>();
            _batchEncoder.Decode(plaintext, decodedValues);

            var text = NumbersToText(decodedValues);
            _logger.LogInformation("Text decrypted successfully.");
            return text;
        }

        /// <summary>
        /// Convierte un texto a una lista de números.
        /// </summary>
        /// <param name="text">El texto a convertir.</param>
        /// <returns>Una lista de números representando el texto.</returns>
        private List<ulong> TextToNumbers(string text)
        {
            return text.Select(c => (ulong)c).ToList();
        }

        /// <summary>
        /// Convierte una lista de números a texto.
        /// </summary>
        /// <param name="numbers">La lista de números a convertir.</param>
        /// <returns>El texto convertido.</returns>
        private string NumbersToText(List<ulong> numbers)
        {
            // Filtrar los valores cero antes de convertir a caracteres.
            var chars = numbers.Where(n => n != 0).Select(n => (char)n).ToArray();
            return new string(chars);

        }
    }
}