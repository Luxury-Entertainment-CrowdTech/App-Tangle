namespace HomomorphicEncryptionService.Models
{
    /// <summary>
    /// Modelo de solicitud para desencriptar texto.
    /// </summary>
    public class DecryptRequest
    {
        /// <summary>
        /// El texto cifrado en formato de cadena, esperado en base64.
        /// </summary>
        public string CipherTextString { get; set; } = default!;
    }
}
