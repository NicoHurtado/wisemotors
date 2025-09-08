'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { registerSchema, type RegisterInput } from '@/lib/schemas/auth';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterInput>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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
      const validatedData = registerSchema.parse(formData);
      
      // Enviar registro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (response.ok) {
        // Registro exitoso
        alert('Usuario registrado exitosamente!');
        router.push('/login');
      } else {
        setError(data.error || 'Error al registrar usuario');
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        setError(error.errors[0]?.message || 'Datos inválidos');
      } else {
        setError('Error al registrar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1"
            placeholder="Tu nombre completo"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1"
            placeholder="tu@email.com"
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
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="mt-1"
            placeholder="Repite tu contraseña"
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
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </Button>
      </form>
    </div>
  );
}
