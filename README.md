
<p align="center">
  <a href="http://tangleapp.luxen.club/login" target="_blank"><img src="https://raw.githubusercontent.com/Luxury-Entertainment-CrowdTech/my-app/196acd9ca1fc9180f26d2f21aa38bc9d8dd2ee18/public/LOGO_PAIP.ico?token=GHSAT0AAAAAACMWD4TNIBQI6TC5LITJP6K4ZPGUG5Q" width="200" alt="Logo de Luxen" /></a>
</p>

<p align="center">
  Documentación de microservicios para el ecosistema Luxen.
</p>

<p align="center">
<a href="#" target="_blank"><img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0" /></a>
<a href="#" target="_blank"><img src="https://img.shields.io/badge/estado-en%20desarrollo-yellow.svg" alt="Estado: en desarrollo" /></a>
<a href="#" target="_blank"><img src="https://img.shields.io/badge/docker-compatible-blue.svg" alt="Compatible con Docker" /></a>
<a href="#" target="_blank"><img src="https://img.shields.io/badge/tests-unitarios%20pasados-brightgreen.svg" alt="Tests Unitarias" /></a>
</p>

## Descripción General

Tangle-Microservicios es una colección de servicios diseñados para ofrecer una arquitectura robusta y escalable para el ecosistema Luxen. Cada microservicio cumple una función específica, desde la autenticación de usuarios hasta el procesamiento de transacciones en blockchain.

## Servicios en Desarrollo Inicial

- **AppAuthMiddleware**: Middleware de autenticación para las aplicaciones dentro del ecosistema Luxen.
- **AppMigracionDB**: Servicio encargado de la migración y gestión de bases de datos.
- **FrontendMovilService**: Aplicación nativa de React Native para móviles, en etapa inicial.

## Servicios en Producción
- **FrontendService (my-app)**: Aplicación principal desarrollada en Vue3.

## Microservicios Actuales

A continuación, se detalla cada microservicio en uso activo dentro del proyecto, excluyendo `EncryptionService` que ha sido descontinuado.

## AuthService

Gestiona la autenticación y autorización de usuarios, proporcionando JWTs para el acceso seguro a los demás microservicios.

## BlockchainService

Servicio encargado de la interacción con tecnologías de blockchain.

## EmailService

Servicio para el envío de correos electrónicos a usuarios. Este servicio necesita de una clave API de "https://login.sendgrid.com" para lo cual se debe crear una clave previamente y crear un .env.development.secrets

## StorageService

Servicio de almacenamiento y gestión de archivos.

## UserService

Gestión de usuarios, incluyendo registro, actualización y eliminación.

## Tecnologías Utilizadas en AuthService - BlockchainService - EmailService - StorageService - UserService

- Node.js

#### Instalación

```bash
npm install
npm install cross-env --save-dev
```

#### Ejecutando el servicio

```bash
# desarrollo
npm run start

# modo observación
npm run start:dev

# modo producción
npm run start:prod
```

## FaceRecognitionService

Servicio de reconocimiento facial para la verificación de identidad.

## Tecnologías Utilizadas

- Python con Flask

#### Instalación

Crea un entorno virtual de Python (asegúrate de que Python 3 está instalado en tu sistema)

```bash
python -m venv venv
En Windows: .\venv\Scripts\activate
En Unix o MacOS: source venv/bin/activate
pip install -r requirements.txt
```

#### Ejecutando el servicio

```bash
# desarrollo
.\start_dev.bat

# modo observación
.\start_dev.bat

# modo producción
Aun en desarrollo
```

### HomomorphicEncryptionService

#### Descripción

Ofrece servicios de cifrado homomórfico para operaciones en datos cifrados.

#### Tecnologías Utilizadas

- .NET 7

#### Instalación

Solo tener .NET 7 instalado en la laptop o pc.

#### Ejecutando el servicio

```bash
# desarrollo
dotnet run

# modo observación
dotnet run

# modo producción
Aun en desarrollo
```

## FrontendService

El `FrontendService` es la interfaz de usuario principal para el ecosistema Luxen, facilitando la gestión de autenticación y autorización de usuarios. Provee un acceso seguro a los demás microservicios mediante JWTs.

### Tecnologías Utilizadas

- Vue.js 3
- Node.js para el entorno de ejecución
- npm o yarn como gestor de paquetes

### Instalación

Antes de iniciar el servicio, necesitas instalar las dependencias necesarias. Asegúrate de tener Node.js instalado en tu sistema.

1. Navega al directorio del proyecto:
    ```bash
    cd path/to/FrontendService/my-app
    ```
2. Instala las dependencias del proyecto utilizando npm o yarn:
    ```bash
    npm install
    o
    yarn install
    ```

Ejecutando el servicio en modo de desarrollo
Para correr el servicio en modo de desarrollo, donde podrás ver los cambios en tiempo real, ejecuta:
```bash
npm run serve
o
yarn serve
```

## Mantente en Contacto

- Autores:
  - [Renzo Di Paola Jara](https://github.com/Kreutzer2000)
  - [Michael Soler](https://github.com/mcsoler)
  - [Rogger Garcia Diaz](https://github.com/0xffset)
  - [Carlos Alfredo Lopez Lopez](https://github.com/carlos25u)
  - [Daniel Ureta Espinal](https://github.com/Daniel349167)
- Sitio web - [https://luxen.club/](https://luxen.club/)
