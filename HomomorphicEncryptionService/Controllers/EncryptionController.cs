using HomomorphicEncryptionService.Models;
using HomomorphicEncryptionService.Services;
using HomomorphicEncryptionService.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Research.SEAL;
using System.Numerics;
using System.Text;

namespace HomomorphicEncryptionService.Controllers
{

    /// <summary>
    /// Controlador para operaciones de cifrado homomórfico.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class EncryptionController : ControllerBase
    {
        private readonly IHomomorphicEncryptionService _homomorphicEncryptionService;
        private readonly ILogger<EncryptionController> _logger;

        /// <summary>
        /// Inicializa una nueva instancia del controlador EncryptionController.
        /// </summary>
        /// <param name="homomorphicEncryptionService">El servicio de cifrado homomórfico.</param>
        /// <param name="logger">El registrador de eventos.</param>
        public EncryptionController(
            IHomomorphicEncryptionService homomorphicEncryptionService,
            ILogger<EncryptionController> logger)
        {
            _homomorphicEncryptionService = homomorphicEncryptionService;
            _logger = logger;
        }

        /// <summary>
        /// Acción que indica si el servicio está en ejecución.
        /// </summary>
        /// <returns>Un mensaje que confirma que el servicio está funcionando.</returns>
        [HttpGet("/")]
        public IActionResult Index()
        {
            _logger.LogInformation("Accessing the index route of Homomorphic Encryption Service.");
            return Ok("Homomorphic Encryption Service is running.");
        }

        /// <summary>
        /// Encripta el texto proporcionado en el cuerpo de la solicitud.
        /// </summary>
        /// <param name="request">La solicitud que contiene el texto a cifrar.</param>
        /// <returns>El texto cifrado en formato base64.</returns>
        [HttpPost("encrypt")]
        public ActionResult<string> Encrypt([FromBody] EncryptRequest request)
        {
            _logger.LogInformation("Attempting to encrypt data.");
            var cipherText = _homomorphicEncryptionService.EncryptText(request.PlainText);
            _logger.LogInformation("Data encrypted successfully.");
            return Ok(cipherText);
        }

        /// <summary>
        /// Desencripta el texto cifrado proporcionado en el cuerpo de la solicitud.
        /// </summary>
        /// <param name="request">La solicitud que contiene el texto cifrado a descifrar.</param>
        /// <returns>El texto plano descifrado.</returns>
        [HttpPost("decrypt")]
        public ActionResult<string> Decrypt([FromBody] DecryptRequest request)
        {
            _logger.LogInformation("Attempting to decrypt data.");
            var plainText = _homomorphicEncryptionService.DecryptText(request.CipherTextString);
            _logger.LogInformation("Data decrypted successfully.");
            return Ok(plainText);
        }
    }
}
