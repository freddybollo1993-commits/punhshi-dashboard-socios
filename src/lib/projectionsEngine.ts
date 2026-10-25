import { VentaDiaria, ProyeccionVentas } from '@/types';

export function calculateSalesProjection(
  ventas: VentaDiaria[],
  periodoStr: string = '2025-05',
  metaMes: number = 40000 // Meta referencial para PUNHSHI S.A.C.
): ProyeccionVentas {
  const [yearStr, monthStr] = periodoStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed (1 to 12)

  // Total de días en el mes
  const diasTotalesMes = new Date(year, month, 0).getDate();

  // Filtrar ventas del mes
  const ventasDelMes = ventas
    .filter(v => v.fecha.startsWith(periodoStr))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const diasTranscurridos = ventasDelMes.length;
  const diasRestantes = Math.max(0, diasTotalesMes - diasTranscurridos);

  const ventaRealAcumulada = ventasDelMes.reduce((acc, v) => acc + Number(v.totalVenta || 0), 0);

  // Clasificar ventas por día de la semana (0: Domingo, 1: Lunes, ..., 5: Viernes, 6: Sábado)
  const ventasSemana: number[] = []; // Lunes a Jueves (1, 2, 3, 4)
  const ventasFinDeSemana: number[] = []; // Viernes a Domingo (5, 6, 0)

  ventasDelMes.forEach(v => {
    // Parse date safely
    const [y, m, d] = v.fecha.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      ventasSemana.push(Number(v.totalVenta || 0));
    } else {
      ventasFinDeSemana.push(Number(v.totalVenta || 0));
    }
  });

  const promedioDiarioSemana = ventasSemana.length > 0 
    ? ventasSemana.reduce((a, b) => a + b, 0) / ventasSemana.length 
    : (diasTranscurridos > 0 ? ventaRealAcumulada / diasTranscurridos : 1000);

  const promedioDiarioFinDeSemana = ventasFinDeSemana.length > 0
    ? ventasFinDeSemana.reduce((a, b) => a + b, 0) / ventasFinDeSemana.length
    : promedioDiarioSemana * 1.5; // Fines de semana suelen ser ~50% más altos

  // Contar días restantes según tipo de día
  let diasSemanaRestantes = 0;
  let diasFinDeSemanaRestantes = 0;

  for (let day = diasTranscurridos + 1; day <= diasTotalesMes; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      diasSemanaRestantes++;
    } else {
      diasFinDeSemanaRestantes++;
    }
  }

  // Si no hay días transcurridos todavía en este mes
  let ventaProyectadaCierre = ventaRealAcumulada;
  if (diasTranscurridos > 0 && diasRestantes > 0) {
    const proyeccionRestante = (diasSemanaRestantes * promedioDiarioSemana) + (diasFinDeSemanaRestantes * promedioDiarioFinDeSemana);
    ventaProyectadaCierre = ventaRealAcumulada + proyeccionRestante;
  } else if (diasTranscurridos === 0) {
    ventaProyectadaCierre = metaMes;
  }

  const cumplimientoMetaPct = metaMes > 0 ? (ventaProyectadaCierre / metaMes) * 100 : 100;

  return {
    diasTranscurridos,
    diasTotalesMes,
    diasRestantes,
    ventaRealAcumulada,
    promedioDiarioSemana,
    promedioDiarioFinDeSemana,
    diasSemanaRestantes,
    diasFinDeSemanaRestantes,
    ventaProyectadaCierre,
    metaMes,
    cumplimientoMetaPct
  };
}
