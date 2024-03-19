namespace HomomorphicEncryptionService.Models
{
    /// <summary>
    /// Modelo de solicitud para encriptar texto.
    /// </summary>
    public class EncryptRequest
    {
        /// <summary>
        /// El texto plano que será cifrado.
        /// </summary>
        public string PlainText { get; set; } = default!;
    }
}
