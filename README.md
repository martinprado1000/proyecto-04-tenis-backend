<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Stack usado

*Nest

*MongoDb


# Ejecutar en desarrollo
1. Clonar el repositorio y asignamos al nuevo repo ya creado en git
```bash
git clone https://github.com/martinprado1000/proyecto_02-nest_rect_material-plantilla_backendServer_v2.git nuevoNombre

git remote set-url origin https://github.com/martinprado1000/nuevoNombre.git
```

2. Tener Nest CLI instalado:
```bash
npm i -g @nest/cli
```

3. Levantar la base de datos. Esta solo dockerizada la base de datos, no la app.
```bash
docker-compose up -d
```

4. Renombrar el archivo __.env.template__ por __.env__ y llenar las variables de entorno e instalar las dependencias:
```bash
#Instalar dependencias
npm install
```

5. Ejecutar en desarrollo
```bash
# Esto ejecuta el archivo docker.compose.yml
$ npm run start:dev

# Ejecutar seed de Usuarios,inserta multiples datos.
http://localhost:3000/api/seed/executeSeed
```


# Construir y ejecutar para producción
```bash
# Construir
$ npm run build

# Ejecutar
$ npm run start:prod
```

# Construir y ejecutar para producción la app y la base en mongo DOCKERIZADO

1. Renombrar el archivo __.env.template__ por __.env.prod__ y llenar las variables de entorno.

2. Crear las imagenes
```bash
# Usamos el docker-compose.prod.yaml y el .env.prod que son los de produccón.

docker-compose -f docker-compose.prod.yaml --env-file .env.prod up --build

# Si las imagenes ya fueron creadas y solo necesitamos levantar ejecutar:
docker-compose -f docker-compose.prod.yaml --env-file .env.prod up -d
```
##
### OpenApi-Documentación Swagger:
 
Endpoints, entities, dto.

http://localhost:3000/api#

#
#
¿QUE HACE ESTA App?

Configuraciones:

* Entidades: User, Auth, Logger, AuditLog, sendEmail

* Entidad Auth. Recibe roles, string o arreglo: SUPERADMIN, ADMIN, OPERATOR, USER.<br>
-Decorar el controller con: @Auth(ValidRoles.XXX, ValidRoles.XXX)

* Para usar el decorador @GetUser(), antes tiene que pasar por el decorador @Auth(ValidRoles.XXX) Para poder obtener el usuario registrado.

* AuditLog. Esta creada la entidad pero no esta implementado el sistema de auditoria, eso esta en la plantilla 12.

* .env  .env.template  .env.prod.

* ConfigModule,ConfigService,Joi.

* Logger Winston.

* CorrelationId.

* Swagger.

* Patrón repository implementado en la entidad de users. Si por .env pasamos el valor 'mongo' en persistence usa el repository de mongo, de lo contrario usa el repository sql (No esta configurado como db sql)

* Si ejecuto en mode dev solo esta dockerizada la db. 

* En prod usamos el archivo docker-compose.prod.yml donde esta dockerizada la app y la db.

###########################################################################################

## Documentacion con respecto al sistema complete de tenis:

Este es un sistema de administracion de torneos de tenis. Donde los usuarios ven sus torneos, fechas, estadisticas, etc.
Contexto con respecto al sistema SaaS Multi-tenant. Este se encuentra en la carpeta PROYECTO-04-TENIS, donde dentro de esta esta la carpeta proyecto-04-tenis-frontend la cual esta el frontend del sistema hecho con react/vite. Y en la cartpeta proyecto-04-tenis-backend esta el el backend hecho con Nest.
Las url que comienzan con http://localhost:5173/SystemMP/ son para la administracion del SaaS Multi-tenant donde el usuario superadmin@gmail.com (superadmin) es el administrador del sistema completo. Desde http://localhost:5173/SystemMP/admin/organizaciones es desde donde se crean las organizaciones.
El usuario administrador (admin) de cada organizacion tiene acceso a las url de la organizacion a la cual pertenece, que empiezan con: http://localhost:5173/"organizacion"/admin/ que seria para administrar los torneos, fechas, equipos, usuarios, gestion-cuotas, etc, de dicha organizacion. Importante: /"organizacion"/ es la variable de la organizacion a la que pertenece el usuario.

Resumen:
- proyecto-04-tenis-frontend: React + Vite.
- proyecto-04-tenis-backend: NestJS.

### Tipos de acceso:

#### Superadministrador
Rutas bajo: 
http://localhost:5173/SystemMP/
El superadmin administra todo el sistema, por ejemplo:
- Crear y administrar organizaciones.
- Gestionar la configuración general del SaaS.
- Administrar los tenants.

#### Usuarios de una organización
Las rutas utilizan dinámicamente dependiendo del  nombre de la organización:
http://localhost:5173/{organizacion} (No requiere autenticacion, muestra resumenen de los torneos actuales)
http://localhost:5173/{organizacion}/perfil
http://localhost:5173/{organizacion}/mis-fechas
http://localhost:5173/{organizacion}/resultados
http://localhost:5173/{organizacion}/estadisticas
http://localhost:5173/{organizacion}/analisis-deportivo
Desde allí, los usuarios pueden:
- Ver sus próximas fechas de juego.
- Consultar torneos en los que participan.
- Ver resultados.
- Participar en modalidades individuales o dobles.

#### Administradores de una organización
Los administradores acceden a:
http://localhost:5173/{organizacion}/admin/
Desde esas rutas pueden administrar únicamente su organización, las rutas utilizadas son:
http://localhost:5173/"nombre-de-la-organizacion"/admin/usuarios
http://localhost:5173/"nombre-de-la-organizacion"/admin/fechas
http://localhost:5173/"nombre-de-la-organizacion"/admin/torneos
http://localhost:5173/"nombre-de-la-organizacion"/admin/importar-usuarios
http://localhost:5173/"nombre-de-la-organizacion"/admin/analisis-deportivo
http://localhost:5173/"nombre-de-la-organizacion"/admin/gestion-cuotas

La parte importante es que {organizacion} identifica el tenant actual, y los permisos determinan si el usuario puede acceder al panel general de la organización, al panel administrativo de su organización o al panel global de superadministrador.