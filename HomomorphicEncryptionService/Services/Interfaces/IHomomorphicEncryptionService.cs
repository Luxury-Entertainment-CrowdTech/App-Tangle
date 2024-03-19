namespace HomomorphicEncryptionService.Services.Interfaces
{
    /// <summary>
    /// Define un servicio para operaciones de cifrado homomórfico.
    /// </summary>
    public interface IHomomorphicEncryptionService
    {
        /// <summary>
        /// Encripta el texto plano proporcionado.
        /// </summary>
        /// <param name="plainText">El texto plano a encriptar.</param>
        /// <returns>El texto cifrado como una cadena en formato base64.</returns>
        string EncryptText(string plainText);

        /// <summary>
        /// Desencripta el texto cifrado proporcionado.
        /// </summary>
        /// <param name="cipherTextBase64">El texto cifrado en formato base64.</param>
        /// <returns>El texto plano desencriptado.</returns>
        string DecryptText(string cipherTextBase64);
    }
}
