import documentedProblems from '../../problemas_revision_motores_252_documentado.json';
import type { ListingAnalysis } from '../shared/messages';

export type ChecklistPriority = 'Crítica' | 'Alta' | 'Normal';

export interface ChecklistItem {
  title: string;
  detail?: string;
  alert?: string;
  cost?: string;
  priority: ChecklistPriority;
}

export interface ChecklistSection {
  title: string;
  subtitle: string;
  items: ChecklistItem[];
}

export interface VehicleChecklist {
  title: string;
  reference: string;
  vehicleFacts: Array<[string, string]>;
  engineSummary: string;
  engineWarning?: string;
  sections: ChecklistSection[];
  sources: string[];
  disclaimer: string;
}

interface DocumentedProblem {
  componente: string;
  gravedad: string;
  coste_reparacion_estimado_eur: { min: number; max: number };
  revision_obligatoria: string;
  sintomas_alerta: string;
  consecuencia_si_se_ignora: string;
}

interface DocumentedEngineRecord {
  id_motor_referencia: string;
  marca: string;
  familia: string;
  potencia_cv_referencia: number[];
  problemas_conocidos_y_revisiones_obligatorias: DocumentedProblem[];
  fuentes_de_familia: string[];
  advertencia_matching: string;
}

const problemRecords = documentedProblems.registros as DocumentedEngineRecord[];
const normalized = (value?: string): string => value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '') ?? '';
const money = (amount: number): string => Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const field = (value: string | number | undefined, suffix = ''): string => value === undefined || value === '' ? 'No disponible' : `${value}${suffix}`;

function documentedEngineProfile(analysis: ListingAnalysis): DocumentedEngineRecord | undefined {
  const engine = analysis.engineAnalysis.motor_detectado;
  if (!engine) return undefined;
  const exact = problemRecords.find((record) => record.id_motor_referencia === engine.id_motor);
  if (exact) return exact;
  const sameFamily = problemRecords.filter((record) => normalized(record.marca) === normalized(engine.marca) && normalized(record.familia) === normalized(engine.familia));
  return sameFamily.find((record) => analysis.listing.powerCv?.value !== undefined && record.potencia_cv_referencia.includes(analysis.listing.powerCv.value)) ?? sameFamily[0];
}

function engineItems(analysis: ListingAnalysis, profile?: DocumentedEngineRecord): ChecklistItem[] {
  const documented = profile?.problemas_conocidos_y_revisiones_obligatorias.map((problem) => ({
    title: problem.componente,
    detail: problem.revision_obligatoria,
    alert: `Alerta: ${problem.sintomas_alerta}. Riesgo: ${problem.consecuencia_si_se_ignora}.`,
    cost: `Coste orientativo: ${money(problem.coste_reparacion_estimado_eur.min)}-${money(problem.coste_reparacion_estimado_eur.max)} EUR`,
    priority: /critic/i.test(problem.gravedad) ? 'Crítica' as const : 'Alta' as const,
  })) ?? [];
  const reliability = analysis.engineAnalysis.evaluacion_fiabilidad?.fallos_comunes.map((failure) => ({
    title: failure.componente,
    detail: `Comprobar específicamente: ${failure.sintomas}`,
    alert: `Aparición orientativa: ${failure.km_promedio_aparicion}`,
    cost: `Coste orientativo: ${money(failure.coste_estimado_reparacion_eur)} EUR`,
    priority: /critic/i.test(failure.gravedad) ? 'Crítica' as const : 'Alta' as const,
  })) ?? [];
  const seen = new Set<string>();
  return [...documented, ...reliability].filter((item) => { const key = normalized(item.title); if (seen.has(key)) return false; seen.add(key); return true; });
}

export function buildVehicleChecklist(analysis: ListingAnalysis): VehicleChecklist {
  const listing = analysis.listing;
  const engine = analysis.engineAnalysis.motor_detectado;
  const profile = documentedEngineProfile(analysis);
  const fuel = normalized(listing.fuel?.value);
  const transmission = normalized(listing.transmission?.value);
  const facts: Array<[string, string]> = [
    ['Vehículo', listing.title?.value ?? (`${listing.make?.value ?? ''} ${listing.model?.value ?? ''}`.trim() || 'No disponible')],
    ['Matriculación', listing.firstRegistration?.value ? `${listing.firstRegistration.value.month ? `${String(listing.firstRegistration.value.month).padStart(2, '0')}/` : ''}${listing.firstRegistration.value.year}` : 'No disponible'],
    ['Kilometraje', field(listing.mileageKm?.value?.toLocaleString('es-ES'), ' km')],
    ['Precio', listing.grossPrice?.value ? `${money(listing.grossPrice.value.amountMinor / 100)} ${listing.grossPrice.value.currency}` : 'No disponible'],
    ['Motor probable', engine ? `${engine.codigo_motor} · ${engine.confianza} · ${engine.puntuacion}/100` : 'No identificado'],
    ['Potencia / cilindrada', `${field(listing.powerKw?.value, ' kW')} · ${field(listing.displacementCc?.value, ' cc')}`],
    ['Combustible / cambio', `${field(listing.fuel?.value)} · ${field(listing.transmission?.value)}`],
    ['CO2', field(listing.co2Gkm?.value, ' g/km')],
  ];

  const documentation: ChecklistItem[] = [
    { title: 'Identidad y VIN', detail: 'Comparar VIN en chasis, parabrisas, permiso, factura y consulta del fabricante. Confirmar que no existan manipulaciones.', priority: 'Crítica' },
    { title: 'Titularidad y cargas', detail: 'Solicitar documentación original alemana, identidad del vendedor, contrato/factura y prueba de ausencia de cargas o reserva de dominio.', priority: 'Crítica' },
    { title: 'Historial verificable', detail: `Contrastar libro digital, facturas, inspecciones y kilometraje. El anuncio declara ${field(listing.mileageKm?.value?.toLocaleString('es-ES'), ' km')}.`, priority: 'Alta' },
    { title: 'Homologación para España', detail: 'Comprobar CoC, contraseña de homologación, ficha reducida si procede, reformas y compatibilidad de emisiones.', priority: 'Alta' },
    { title: 'Campañas y mantenimiento', detail: 'Consultar campañas abiertas por VIN y exigir justificantes de mantenimiento según fabricante.', priority: 'Alta' },
  ];

  const powertrain: ChecklistItem[] = [
    { title: 'Arranque completamente en frío', detail: 'Pedir que no arranquen el coche antes de llegar. Observar humo, ralentí, ruidos, vibraciones y testigos.', priority: 'Crítica' },
    { title: 'Diagnosis electrónica completa', detail: 'Leer todas las centralitas antes y después de la prueba; revisar errores borrados, readiness y valores en vivo.', priority: 'Crítica' },
    { title: 'Fluidos y fugas', detail: 'Revisar aceite, refrigerante, combustible y caja; buscar emulsión, olores, niveles anómalos y fugas recientes lavadas.', priority: 'Alta' },
  ];
  if (fuel.includes('diesel')) powertrain.push({ title: 'Sistema diésel y emisiones', detail: 'Comprobar inyectores, EGR, DPF, presión diferencial, regeneraciones, turbo y AdBlue/SCR si equipa.', priority: 'Alta' });
  if (fuel.includes('gasoline') || fuel.includes('petrol')) powertrain.push({ title: 'Encendido e inyección gasolina', detail: 'Revisar bujías, bobinas, correcciones de mezcla, inyección directa, carbonilla y presión de combustible.', priority: 'Alta' });
  if (fuel.includes('hybrid') || fuel.includes('electric')) powertrain.push({ title: 'Batería de alta tensión', detail: 'Solicitar informe de salud, capacidad útil, errores de aislamiento, refrigeración y funcionamiento de carga.', priority: 'Crítica' });

  const roadTest: ChecklistItem[] = [
    { title: 'Transmisión y embrague', detail: transmission.includes('automatic') || transmission.includes('automatik') ? 'Probar en frío y caliente: inserción D/R, cambios, kick-down, retenciones y vibraciones. Verificar servicio de aceite.' : 'Comprobar embrague, bimasa, sincronizados, punto de fricción y ruidos en todas las marchas.', priority: 'Alta' },
    { title: 'Dirección y suspensión', detail: 'Circular en firme irregular y recta: comprobar holguras, golpes, vibraciones, alineación y retorno del volante.', priority: 'Alta' },
    { title: 'Frenada', detail: 'Probar frenada progresiva y firme sin desvíos ni vibraciones; revisar discos, pastillas, latiguillos y freno de estacionamiento.', priority: 'Crítica' },
    { title: 'Temperatura de servicio', detail: 'Completar una prueba suficiente para comprobar temperatura estable, ventiladores, refrigeración y ausencia de avisos.', priority: 'Alta' },
  ];

  const bodyAndWear: ChecklistItem[] = [
    { title: 'Carrocería y estructura', detail: 'Medir pintura por paneles; revisar soldaduras, largueros, torretas, holguras, tornillos marcados y diferencias de tono.', priority: 'Crítica' },
    { title: 'Bajos y corrosión', detail: 'Inspeccionar en elevador subchasis, puntos de apoyo, escapes, protecciones, golpes y corrosión estructural.', priority: 'Crítica' },
    { title: 'Neumáticos', detail: 'Comprobar DOT, desgaste uniforme, profundidad, grietas, homologación y coincidencia por eje.', priority: 'Alta' },
    { title: 'Cristales, luces y estanqueidad', detail: 'Revisar fechas de cristales, faros, humedad, desagües, maletero y señales de entrada de agua.', priority: 'Normal' },
  ];

  const equipment = Object.entries(listing.features).filter(([, values]) => values.value?.length).map(([group, values]) => ({ title: group.replace('seller:', 'Descripción: '), detail: `Comprobar uno a uno: ${values.value?.join(' · ')}`, priority: 'Normal' as const }));
  const alerts = analysis.flags.map((flag) => ({ title: flag.category, detail: flag.excerpt, alert: `Severidad ${flag.severity}; verificar antes de pagar o reservar.`, priority: flag.severity === 'high' ? 'Crítica' as const : 'Alta' as const }));
  const importSteps: ChecklistItem[] = [
    { title: 'Presupuesto cerrado de importación', detail: 'Separar compra, transporte/matrículas temporales, seguro, ITV, tasas, gestoría e impuestos aplicables.', priority: 'Alta' },
    { title: 'Documentos antes del pago', detail: 'No completar el pago sin contrato/factura, documentos originales, VIN validado y condiciones de entrega por escrito.', priority: 'Crítica' },
    { title: 'Inspección independiente', detail: 'Condicionar la compra a diagnosis y revisión en elevador por un profesional independiente del vendedor.', priority: 'Crítica' },
    { title: 'Decisión final', detail: 'Anotar defectos, coste máximo probable y margen frente a una unidad equivalente ya matriculada en España.', priority: 'Alta' },
  ];

  const sections: ChecklistSection[] = [
    { title: '1. Identidad, historial y documentación', subtitle: 'Validaciones que deben completarse antes de entregar una señal.', items: documentation },
    { title: '2. Motor probable y puntos críticos', subtitle: engine ? `${engine.nivel_identificacion}: ${engine.codigo_motor}. No sustituye la confirmación por VIN.` : 'Motor no identificado: aplicar revisión mecánica completa sin asumir un código.', items: [...engineItems(analysis, profile), ...powertrain] },
    { title: '3. Prueba dinámica', subtitle: 'Realizar con el coche frío al inicio y llevarlo después a temperatura de servicio.', items: roadTest },
    { title: '4. Carrocería, bajos y elementos de desgaste', subtitle: 'Inspección visual, medición de pintura y elevador.', items: bodyAndWear },
  ];
  if (alerts.length) sections.push({ title: '5. Alertas específicas del anuncio', subtitle: 'Indicios extraídos del texto; requieren comprobación documental o física.', items: alerts });
  if (equipment.length) sections.push({ title: `${alerts.length ? '6' : '5'}. Equipamiento anunciado`, subtitle: 'Marcar únicamente después de comprobar su funcionamiento.', items: equipment });
  sections.push({ title: `${alerts.length ? equipment.length ? '7' : '6' : equipment.length ? '6' : '5'}. Importación y decisión de compra`, subtitle: 'Cierre económico, documental y de riesgos.', items: importSteps });

  return {
    title: listing.title?.value ?? `${listing.make?.value ?? 'Vehículo'} ${listing.model?.value ?? ''}`.trim(),
    reference: `Mobile.de ${listing.listingId?.value ?? 'sin ID'} · ${listing.url}`,
    vehicleFacts: facts,
    engineSummary: engine ? `${engine.nivel_identificacion}: ${engine.codigo_motor} (${engine.familia}), confianza ${engine.confianza} ${engine.puntuacion}/100.` : 'Motor no identificado con evidencia suficiente.',
    engineWarning: profile?.advertencia_matching,
    sections,
    sources: [...new Set(profile?.fuentes_de_familia ?? [])],
    disclaimer: 'Checklist de cribado basado en datos del anuncio y perfiles técnicos orientativos. No sustituye confirmación por VIN, diagnosis, inspección profesional, presupuesto ni asesoramiento fiscal/legal.',
  };
}
