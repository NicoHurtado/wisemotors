'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { useAuth } from '@/contexts/AuthContext';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginInput>({
    emailOrUsername: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar datos
      const validatedData = loginSchema.parse(formData);
      
      // Enviar login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso
        
        // Asignar rol según el email
        const userWithRole = {
          ...data.user,
          role: data.user.email === 'adminwise@wisemotors.co' ? 'admin' : 'user'
        };
        
        // Si es admin, guardar la contraseña para verificación posterior
        if (userWithRole.email === 'adminwise@wisemotors.co') {
          localStorage.setItem('adminPassword', formData.password);
        }
        
        // Actualizar el estado de autenticación
        login(userWithRole, data.token);
        
        // Esperar a que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 50));
        
        
        // Usar window.location.href para asegurar que la página se recargue
        // y el estado se sincronice correctamente
        window.location.href = '/';
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        setError(error.errors[0]?.message || 'Datos inválidos');
      } else {
        setError('Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="emailOrUsername">Email o Nombre de usuario</Label>
          <Input
            id="emailOrUsername"
            name="emailOrUsername"
            type="text"
            value={formData.emailOrUsername}
            onChange={handleChange}
            required
            className="mt-1"
            placeholder="tu@email.com o tu_usuario"
          />
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="mt-1"
            placeholder="Tu contraseña"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>
    </div>
  );
}
