using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HomomorphicEncryptionService
{
    /// <summary>
    /// Middleware para restringir el acceso a la aplicación basado en una lista blanca de IPs.
    /// </summary>
    public class IPWhitelistMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<IPWhitelistMiddleware> _logger;
        private readonly List<string> _whitelistedIPs;

        /// <summary>
        /// Inicializa una nueva instancia de <see cref="IPWhitelistMiddleware"/>.
        /// </summary>
        /// <param name="next">El siguiente delegado en el pipeline de solicitudes HTTP.</param>
        /// <param name="logger">El registrador de eventos para registrar la información.</param>
        /// <param name="configuration">La configuración de la aplicación donde se encuentra la lista blanca de IPs.</param>
        public IPWhitelistMiddleware(RequestDelegate next, ILogger<IPWhitelistMiddleware> logger, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            // Se asegura de que se obtenga una lista, incluso si la configuración devuelve nulo.
            _whitelistedIPs = configuration.GetSection("WhitelistedIPs").Get<List<string>>() ?? new List<string>();
        }

        /// <summary>
        /// Procesa una solicitud HTTP, permitiendo el paso solo si la IP de la solicitud se encuentra en la lista blanca.
        /// </summary>
        /// <param name="context">El contexto de la solicitud HTTP.</param>
        /// <returns>Una tarea que representa la operación asíncrona.</returns>
        public async Task Invoke(HttpContext context)
        {
            // Se verifica que la IP de la solicitud no sea nula antes de continuar.
            var requestIP = context.Connection.RemoteIpAddress?.ToString();
            if (requestIP != null && _whitelistedIPs.Contains(requestIP))
            {
                await _next(context);
            }
            else
            {
                _logger.LogWarning($"Acceso denegado a la IP: {requestIP}");
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Acceso denegado.");
            }
        }
    }
}
