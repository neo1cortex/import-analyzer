import curatedEngineDatabase from '../../bbdd_german_cars.json';
import expandedEngineDatabase from '../../bbdd_german_cars_252_motores.json';
import type { VehicleListing } from '../shared/listing';

export type EngineConfidence = 'Alta' | 'Media' | 'Baja';

export interface CommonEngineFailure {
  componente: string;
  gravedad: string;
  km_promedio_aparicion: string;
  sintomas: string;
  coste_estimado_reparacion_eur: number;
}

export interface ReliabilityEvaluation {
  categoria_fiabilidad: string;
  puntuacion_riesgo: string;
  veredicto_compra: string;
  fallos_comunes: CommonEngineFailure[];
}

interface MobileDeMatchCriteria {
  marca_mobile: string[];
  modelos_compatibles: string[];
  generaciones_chasis: string[];
  cilindrada_cc: number[];
  potencia_kw: number[];
  potencia_cv: number[];
  combustible: string[];
  cilindros: number;
  ano_matriculacion_inicio: number;
  ano_matriculacion_fin: number;
}

interface RawMobileDeMatchCriteria extends Omit<MobileDeMatchCriteria, 'cilindrada_cc'> {
  cilindrada_cc: number | number[];
}

interface EngineDatabaseRecord {
  id_motor: string;
  codigo_motor: string;
  familia: string;
  marca: string;
  criterios_coincidencia_mobile_de: MobileDeMatchCriteria;
  diagnostico_fiabilidad: ReliabilityEvaluation;
  dataQuality: 'curated' | 'family-only';
}

interface RawEngineDatabaseRecord extends Omit<EngineDatabaseRecord, 'criterios_coincidencia_mobile_de' | 'dataQuality'> {
  criterios_coincidencia_mobile_de: RawMobileDeMatchCriteria;
}

export interface DetectedEngine {
  id_motor: string;
  codigo_motor: string;
  familia: string;
  marca: string;
  confianza: EngineConfidence;
  puntuacion: number;
  motivo_coincidencia: string[];
  confirmado: false;
  nivel_identificacion: 'Código probable' | 'Familia probable';
}

export interface ProbableEngineResult {
  motor_detectado: DetectedEngine | null;
  evaluacion_fiabilidad: ReliabilityEvaluation | null;
  confianza: EngineConfidence;
  puntuacion: number;
  motivo_coincidencia: string[];
}

interface ScoredEngine {
  record: EngineDatabaseRecord;
  score: number;
  exactDisplacement: boolean;
  explicitCodeMatch: boolean;
  reasons: string[];
}

const normalizeRecord = (record: RawEngineDatabaseRecord, dataQuality: EngineDatabaseRecord['dataQuality']): EngineDatabaseRecord => ({
  ...record,
  criterios_coincidencia_mobile_de: {
    ...record.criterios_coincidencia_mobile_de,
    cilindrada_cc: Array.isArray(record.criterios_coincidencia_mobile_de.cilindrada_cc)
      ? record.criterios_coincidencia_mobile_de.cilindrada_cc
      : [record.criterios_coincidencia_mobile_de.cilindrada_cc],
  },
  dataQuality,
});
const engines: EngineDatabaseRecord[] = [
  ...(curatedEngineDatabase as RawEngineDatabaseRecord[]).map((record) => normalizeRecord(record, 'curated')),
  ...(expandedEngineDatabase.nuevos_registros as RawEngineDatabaseRecord[]).map((record) => normalizeRecord(record, 'family-only')),
];
const canonical = (value?: string): string => value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '') ?? '';
const includesAny = (value: string, options: string[]): string | undefined => options.find((option) => value.includes(canonical(option)));
const isFuelCompatible = (fuel: string, options: string[]): boolean => {
  const aliases: Record<string, string> = { benzin: 'gasoline', gasolina: 'gasoline', petrol: 'gasoline' };
  const normalized = aliases[canonical(fuel)] ?? canonical(fuel);
  return options.some((option) => (aliases[canonical(option)] ?? canonical(option)) === normalized);
};

/** Infers an engine from local catalogue data. It never confirms an engine identity. */
export function identifyProbableEngine(listing: VehicleListing): ProbableEngineResult {
  const make = canonical(listing.make?.value);
  const fuel = listing.fuel?.value;
  const displacement = listing.displacementCc?.value;

  if (!make || !fuel || displacement === undefined) {
    return noMatch('Faltan marca, combustible o cilindrada para aplicar el filtro primario.');
  }

  const modelAndVersion = canonical(`${listing.model?.value ?? ''} ${listing.variant?.value ?? ''}`);
  const chassisAndVersion = canonical(`${listing.modelRange?.value ?? ''} ${listing.variant?.value ?? ''}`);
  const year = listing.firstRegistration?.value?.year;
  const powerKw = listing.powerKw?.value;
  const powerCv = listing.powerCv?.value;
  const explicitCodes = listing.explicitEngineCodes.value?.map(({ code }) => canonical(code)) ?? [];
  const candidates: ScoredEngine[] = [];

  for (const record of engines) {
    const criteria = record.criterios_coincidencia_mobile_de;
    if (!criteria.marca_mobile.some((alias) => canonical(alias) === make)) continue;
    if (!isFuelCompatible(fuel, criteria.combustible)) continue;

    const displacementDifference = Math.min(...criteria.cilindrada_cc.map((cc) => Math.abs(displacement - cc)));
    if (displacementDifference > 5) continue;

    let score = 0;
    const reasons = [`Filtro primario: marca, combustible y cilindrada (${displacement} cc) compatibles.`];
    const matchingPower = (powerKw !== undefined && criteria.potencia_kw.includes(powerKw))
      || (powerCv !== undefined && criteria.potencia_cv.includes(powerCv));
    if (matchingPower) {
      score += 30;
      reasons.push(`Potencia coincidente (${powerKw !== undefined ? `${powerKw} kW` : `${powerCv} CV`}): +30.`);
    }
    if (year !== undefined && year >= criteria.ano_matriculacion_inicio && year <= criteria.ano_matriculacion_fin) {
      score += 30;
      reasons.push(`Matriculación ${year} dentro de ${criteria.ano_matriculacion_inicio}-${criteria.ano_matriculacion_fin}: +30.`);
    }
    const matchingModel = record.dataQuality === 'curated' ? includesAny(modelAndVersion, criteria.modelos_compatibles) : undefined;
    if (matchingModel) {
      score += 20;
      reasons.push(`Modelo o versión compatible (${matchingModel}): +20.`);
    }
    const matchingChassis = record.dataQuality === 'curated' ? includesAny(chassisAndVersion, criteria.generaciones_chasis) : undefined;
    if (matchingChassis) {
      score += 20;
      reasons.push(`Chasis compatible (${matchingChassis}): +20.`);
    }
    const engineIdentifiers = [record.codigo_motor, record.familia].map(canonical).filter((identifier) => identifier.length >= 3);
    const explicitCodeMatch = explicitCodes.some((code) => engineIdentifiers.some((identifier) => code.includes(identifier) || identifier.includes(code)));
    if (explicitCodeMatch) reasons.push('Código o familia citado explícitamente en el anuncio; usado como desempate.');
    if (record.dataQuality === 'family-only') reasons.push('Catálogo ampliado sin modelos/chasis OEM validados: solo permite inferir la familia.');
    candidates.push({ record, score, exactDisplacement: displacementDifference === 0, explicitCodeMatch, reasons });
  }

  if (!candidates.length) return noMatch('Ningún motor supera el filtro primario excluyente.');

  candidates.sort((left, right) => right.score - left.score
    || Number(right.exactDisplacement) - Number(left.exactDisplacement)
    || Number(right.explicitCodeMatch) - Number(left.explicitCodeMatch)
    || Number(right.record.dataQuality === 'curated') - Number(left.record.dataQuality === 'curated'));
  const best = candidates[0];
  const tied = candidates.filter((candidate) => candidate.score === best.score
    && candidate.exactDisplacement === best.exactDisplacement
    && candidate.explicitCodeMatch === best.explicitCodeMatch
    && candidate.record.dataQuality === best.record.dataQuality);
  if (tied.length > 1) {
    return noMatch(`Empate no resoluble entre ${tied.map(({ record }) => record.codigo_motor).join(', ')}; se requiere VIN o documentación.`);
  }

  if (best.exactDisplacement && candidates.some((candidate) => candidate !== best && candidate.score === best.score)) {
    best.reasons.push('Desempate por cilindrada exacta en año de transición.');
  }
  const confidence: EngineConfidence = best.record.dataQuality === 'family-only' ? 'Baja' : best.score >= 90 ? 'Alta' : best.score >= 70 ? 'Media' : 'Baja';
  if (confidence === 'Baja') best.reasons.push('Puntuación inferior al 70%; identificación de baja confianza.');
  best.reasons.push('Motor inferido: confirmar siempre mediante VIN, documentación del fabricante o inspección.');

  return {
    motor_detectado: {
      id_motor: best.record.id_motor,
      codigo_motor: best.record.dataQuality === 'curated' ? best.record.codigo_motor : best.record.familia,
      familia: best.record.familia,
      marca: best.record.marca,
      confianza: confidence,
      puntuacion: best.score,
      motivo_coincidencia: best.reasons,
      confirmado: false,
      nivel_identificacion: best.record.dataQuality === 'curated' ? 'Código probable' : 'Familia probable',
    },
    evaluacion_fiabilidad: best.record.dataQuality === 'curated' ? best.record.diagnostico_fiabilidad : null,
    confianza: confidence,
    puntuacion: best.score,
    motivo_coincidencia: best.reasons,
  };
}

function noMatch(reason: string): ProbableEngineResult {
  return { motor_detectado: null, evaluacion_fiabilidad: null, confianza: 'Baja', puntuacion: 0, motivo_coincidencia: [reason] };
}
