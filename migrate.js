// Script para migrar la base de datos en producción
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');
    
    // Crear un usuario admin por defecto si no existe
    const adminExists = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          email: 'admin@wisemotors.com',
          password: hashedPassword,
          username: 'admin',
          role: 'admin'
        }
      });
      
      console.log('✅ Usuario admin creado: admin@wisemotors.com / admin123');
    }
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
