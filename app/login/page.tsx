import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wise/5 to-wise/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-gray-600">
              Accede a tu cuenta de WiseMotors
            </p>
          </div>

          {/* Form */}
          <LoginForm />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="text-wise hover:text-wise-dark font-medium transition-colors">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
