# 🚀 Guía de Configuración - WiseMotors

## ⚠️ Problema Actual

Estás experimentando errores de conexión a la base de datos:

1. **Error P5010**: "Cannot fetch data from service: fetch failed"
2. **Error P1010**: "User `` was denied access on the database `postgres.public`"

Estos errores indican que:
- La variable `DATABASE_URL` no está configurada correctamente
- El formato de la conexión está mal (falta el username)
- La base de datos no está corriendo o no es accesible

## ✅ Solución

### Paso 1: Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto `wisemotors/` con el siguiente contenido:

```env
# Database Configuration
# IMPORTANTE: Reemplaza los valores con tus credenciales reales
DATABASE_URL="postgresql://usuario:password@localhost:51213/wisemotors?schema=public"

# JWT Secret para autenticación
JWT_SECRET="tu-clave-secreta-jwt-min-32-caracteres-cambiar-en-produccion"

# OpenAI API Key para funciones de IA
OPENAI_API_KEY="sk-tu-openai-api-key-aqui"

# Node Environment
NODE_ENV="development"
```

### Paso 2: Configurar DATABASE_URL Correctamente

El formato de `DATABASE_URL` debe ser:

```
postgresql://username:password@host:port/database?schema=public
```

#### Si usas PostgreSQL local:

```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/wisemotors?schema=public"
```

#### Si usas el puerto 51213 (como aparece en tu error):

```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:51213/wisemotors?schema=public"
```

**⚠️ IMPORTANTE:**
- Reemplaza `postgres` con tu usuario de PostgreSQL
- Reemplaza `tu_password` con tu contraseña real
- Reemplaza `51213` con el puerto correcto (o `5432` si es el estándar)
- Reemplaza `wisemotors` con el nombre de tu base de datos

### Paso 3: Verificar que PostgreSQL esté corriendo

Asegúrate de que tu servidor PostgreSQL esté corriendo:

```bash
# En Windows, verifica el servicio PostgreSQL
# O intenta conectarte con:
psql -h localhost -p 51213 -U postgres -d wisemotors
```

### Paso 4: Crear la base de datos (si no existe)

```bash
# Conectarte a PostgreSQL
psql -h localhost -p 51213 -U postgres

# Crear la base de datos
CREATE DATABASE wisemotors;

# Salir
\q
```

### Paso 5: Ejecutar las migraciones

```bash
# Generar el cliente de Prisma
npx prisma generate

# Aplicar el schema a la base de datos
npx prisma db push

# (Opcional) Abrir Prisma Studio para ver los datos
npx prisma studio
```

### Paso 6: Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## 🔍 Solución de Problemas

### Error: "User `` was denied access"

**Causa:** El username en `DATABASE_URL` está vacío o el formato es incorrecto.

**Solución:** Verifica que tu `DATABASE_URL` tenga el formato correcto:
```
postgresql://usuario:password@host:port/database
```

### Error: "Cannot fetch data from service: fetch failed"

**Causa:** 
- La base de datos no está corriendo
- El puerto es incorrecto
- Las credenciales son incorrectas
- El firewall está bloqueando la conexión

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Verifica que el puerto sea correcto
3. Verifica las credenciales (usuario y contraseña)
4. Prueba conectarte manualmente con `psql`

### Error: "database does not exist"

**Causa:** La base de datos no existe.

**Solución:** Crea la base de datos:
```sql
CREATE DATABASE wisemotors;
```

## 📝 Ejemplo de .env completo

```env
# Database - PostgreSQL local
DATABASE_URL="postgresql://postgres:mipassword123@localhost:5432/wisemotors?schema=public"

# JWT Secret (genera uno seguro)
JWT_SECRET="mi-super-secreto-jwt-key-que-debe-ser-muy-largo-y-seguro-123456789"

# OpenAI API Key
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Environment
NODE_ENV="development"
```

## 🚨 Notas de Seguridad

- **NUNCA** subas el archivo `.env` a Git (ya está en `.gitignore`)
- **NUNCA** compartas tus credenciales de base de datos
- Usa variables de entorno diferentes para desarrollo y producción
- En producción, usa un servicio de gestión de secretos (como Vercel Environment Variables)

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

