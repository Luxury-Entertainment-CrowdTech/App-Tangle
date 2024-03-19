using HomomorphicEncryptionService;
using HomomorphicEncryptionService.Services;
using HomomorphicEncryptionService.Services.Interfaces;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Logging;
using System;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

// Extrae los orígenes permitidos de la configuración
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

// Verifica que allowedOrigins no sea null o esté vacío
if (allowedOrigins == null || allowedOrigins.Length == 0)
{
    throw new InvalidOperationException("No se han configurado los orígenes permitidos para CORS en appsettings.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Registro del servicio de cifrado homomórfico
builder.Services.AddSingleton<IHomomorphicEncryptionService, HomomorphicService>();

// Configura el logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddEventSourceLogger();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Añade servicios al contenedor
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure forwarded headers middleware to accept forwarded headers from a reverse proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Asumiendo que NGINX se ejecuta en la misma máquina, se puede dejar así o configurar la IP del proxy si es diferente
    // Por ejemplo, si tu proxy tiene una IP estática conocida, descomenta y ajusta la línea siguiente
    // options.KnownProxies.Add(IPAddress.Parse("IP_DEL_PROXY"));
});

var app = builder.Build();

app.UseMiddleware<IPWhitelistMiddleware>();

// Usa CORS con la política especificada
app.UseCors("AllowSpecificOrigin");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

//var url = "http://0.0.0.0:5190";
//app.Run(url);
app.Run();
