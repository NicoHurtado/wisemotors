import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { demandaCsv } from '@/lib/demanda';
import { demandaDelPeriodo } from '@/lib/demanda-servidor';

export const dynamic = 'force-dynamic';

// GET /api/admin/demanda?dias=30            — resumen para el panel
// GET /api/admin/demanda?dias=30&formato=csv — informe por intención (solo agregados)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const dias = Math.min(365, Math.max(1, parseInt(request.nextUrl.searchParams.get('dias') ?? '30') || 30));
  const r = await demandaDelPeriodo(dias);
  if (request.nextUrl.searchParams.get('formato') === 'csv') {
    const hoy = new Date().toISOString().slice(0, 10);
    // BOM para que Excel abra bien las tildes
    return new NextResponse(`﻿${demandaCsv(r)}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="demanda-wisemotors-${dias}d-${hoy}.csv"`,
      },
    });
  }
  return NextResponse.json(r);
}
