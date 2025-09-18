# Guía de Despliegue - WiseMotors

## 🚀 Despliegue en Vercel + Dominio Hostinger

### 📋 Requisitos Previos

1. **Cuenta en Vercel**: https://vercel.com
2. **Cuenta en Hostinger**: https://hostinger.com
3. **Base de datos PostgreSQL**: Recomendado usar Vercel Postgres o PlanetScale
4. **API Key de OpenAI**: https://platform.openai.com/api-keys

### 🔧 Paso 1: Preparar Base de Datos

#### Opción A: Vercel Postgres (Recomendado)
1. Ve a tu dashboard de Vercel
2. Crea un nuevo proyecto
3. En la pestaña "Storage", crea una base de datos Postgres
4. Copia la URL de conexión

#### Opción B: PlanetScale
1. Crea cuenta en https://planetscale.com
2. Crea una nueva base de datos
3. Copia la URL de conexión

### 🔑 Paso 2: Variables de Entorno

Necesitarás configurar estas variables en Vercel:

```bash
DATABASE_URL="postgresql://username:password@host:5432/wisemotors"
JWT_SECRET="tu-clave-secreta-jwt-min-32-caracteres"
OPENAI_API_KEY="sk-tu-openai-api-key"
NEXTAUTH_URL="https://tudominio.com"
NEXTAUTH_SECRET="tu-nextauth-secret"
NODE_ENV="production"
```

### 📦 Paso 3: Desplegar en Vercel

1. **Subir código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tuusuario/wisemotors.git
   git push -u origin main
   ```

2. **Conectar con Vercel**:
   - Ve a https://vercel.com/new
   - Conecta tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configurar variables de entorno**:
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables del paso 2

4. **Desplegar**:
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu aplicación

### 🌐 Paso 4: Configurar Dominio en Hostinger

#### En Hostinger:
1. Ve a tu panel de control de Hostinger
2. Busca la sección "DNS" o "Zona DNS"
3. Agrega estos registros:

```
Tipo: CNAME
Nombre: @
Valor: cname.vercel-dns.com

Tipo: CNAME  
Nombre: www
Valor: cname.vercel-dns.com
```

#### En Vercel:
1. Ve a tu proyecto en Vercel
2. Ve a Settings > Domains
3. Agrega tu dominio: `tudominio.com`
4. Agrega también: `www.tudominio.com`
5. Vercel te dará registros DNS específicos
6. Actualiza los registros en Hostinger con los valores que te da Vercel

### 🗄️ Paso 5: Migrar Base de Datos

1. **Instalar Prisma CLI globalmente**:
   ```bash
   npm install -g prisma
   ```

2. **Ejecutar migraciones**:
   ```bash
   npx prisma db push --schema=./prisma/schema.prisma
   ```

3. **Verificar conexión**:
   ```bash
   npx prisma studio
   ```

### 🔧 Paso 6: Configuración Final

1. **Actualizar schema de Prisma** para PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Regenerar cliente Prisma**:
   ```bash
   npx prisma generate
   ```

3. **Redesplegar en Vercel**

### ✅ Paso 7: Verificación

1. Visita tu dominio
2. Verifica que todas las funcionalidades funcionen:
   - Búsqueda de vehículos
   - Sistema de autenticación
   - Comparaciones
   - Favoritos
   - Panel de administración

### 🚨 Solución de Problemas

#### Error de base de datos:
- Verifica que DATABASE_URL sea correcta
- Asegúrate de que la base de datos esté accesible desde Vercel

#### Error de OpenAI:
- Verifica que OPENAI_API_KEY sea válida
- Revisa los límites de tu cuenta de OpenAI

#### Error de dominio:
- Los cambios DNS pueden tardar hasta 48 horas
- Verifica que los registros DNS sean correctos

#### Error de build:
- Revisa los logs en Vercel
- Asegúrate de que todas las dependencias estén en package.json

### 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Comprueba la conectividad de la base de datos

¡Tu aplicación WiseMotors estará lista para producción! 🎉
