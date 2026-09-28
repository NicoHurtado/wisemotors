import { AddDealershipForm } from '@/components/admin/AddDealershipForm';

export default function NewDealershipPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 md:px-8 md:pt-14">
      <div>
        <a href="/admin" className="text-[14px] text-tinta-2 hover:text-tinta">← Panel</a>
        <div className="mb-8">
          <h1 className="t-titulo mt-4 text-[40px] md:text-[64px]">
            Nuevo concesionario
          </h1>
          <p className="mt-2 text-tinta-2">
            Completa todos los campos para agregar un nuevo concesionario
          </p>
        </div>

        <AddDealershipForm />
      </div>
    </div>
  );
}
