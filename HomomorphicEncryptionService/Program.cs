using HomomorphicEncryptionService.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Configurar el logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddEventSourceLogger();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Registra tu servicio EncryptionService y cualquier otro servicio aquí
builder.Services.AddScoped<EncryptionService>();
// Agrega soporte para ILogger en tu aplicación
builder.Services.AddLogging();

// Configure forwarded headers middleware to accept forwarded headers from a reverse proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Si confías en el proxy inverso y estás detrás de uno, puedes descomentar la siguiente línea
    // options.KnownProxies.Add(IPAddress.Parse("IP_DEL_PROXY"));
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

var url = "http://0.0.0.0:5190";
app.Run(url);
