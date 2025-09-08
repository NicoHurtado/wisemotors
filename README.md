# 🚗 WiseMotors

## ¿Qué es?

WiseMotors es una plataforma inteligente de búsqueda y recomendación de vehículos que utiliza inteligencia artificial para entender lo que buscas y encontrar los mejores carros para ti.

## ✨ Características Principales

- 🔍 **Búsqueda Inteligente** - Describe lo que quieres con tus palabras
- 🤖 **IA Avanzada** - Recomendaciones personalizadas basadas en tus necesidades
- 💖 **Sistema de Favoritos** - Guarda los vehículos que te gustan
- ⚖️ **Comparación** - Compara múltiples vehículos lado a lado
- 📱 **Diseño Responsive** - Funciona perfecto en cualquier dispositivo
- 🔐 **Sistema de Usuarios** - Guarda tus preferencias y favoritos
- 🛠️ **Panel de Administración** - Gestión completa de vehículos y concesionarios

## 🚀 Tecnologías

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** API Routes, Prisma ORM
- **Base de Datos:** SQLite
- **Autenticación:** JWT, bcrypt
- **IA:** OpenAI API para recomendaciones

## 🏃‍♂️ Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma db push

# Crear usuario administrador
node scripts/create-admin-user.js

# Ejecutar en desarrollo
npm run dev
```

## 🔑 Acceso Admin

- **Email:** `adminwise@wisemotors.co`
- **Contraseña:** `OlartePedroNico`

## 📱 Uso

1. **Busca vehículos** escribiendo lo que quieres (ej: "SUV familiar barato")
2. **Explora opciones** con filtros inteligentes
3. **Guarda favoritos** haciendo clic en el corazón
4. **Compara vehículos** para tomar la mejor decisión
5. **Accede a detalles** completos de especificaciones

## 📁 Estructura del Proyecto

```
wise/
├── app/              # Páginas y APIs
├── components/       # Componentes reutilizables
├── contexts/         # Estado global
├── hooks/            # Lógica personalizada
├── lib/              # Utilidades y configuraciones
└── prisma/           # Esquema de base de datos
```

## 🔒 Seguridad

- Autenticación JWT segura
- Contraseñas encriptadas con bcrypt
- Rutas protegidas por roles
- Validación de datos con Zod

## 📚 Documentación

Para información detallada sobre la arquitectura, componentes y funcionamiento interno, consulta `DOCUMENTACION_COMPLETA.md`.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

**Powered by real dealerships, for real customers.** 🚗✨
