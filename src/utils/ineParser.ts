// Parser for Mexican INE/IFE credential (PDF417)
export interface INEData {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  curp: string;
  claveElector: string;
  fechaNacimiento: string;
  sexo: string;
  domicilio: string;
  seccion: string;
  municipio: string;
  estado: string;
  vigencia: string;
  emision: string;
  raw: string;
}

export function parseINECredential(rawText: string): INEData | null {
  try {
    console.log("=== PARSEANDO INE ===");
    console.log("Texto completo:", rawText);
    
    const parts = rawText.split('|');
    console.log("Numero de partes:", parts.length);
    console.log("Primeras 5 partes:", parts.slice(0, 5));

    // Credenciales INE tienen al menos 10 campos
    if (parts.length < 10) {
      console.log("NO ES INE - Muy pocos campos");
      return null;
    }

    // Validar que tenga un CURP valido (18 caracteres)
    const curpIndex = parts.findIndex(p => p?.trim().length === 18);
    console.log("Indice de CURP:", curpIndex);
    
    if (curpIndex === -1) {
      console.log("NO ES INE - No se encontro CURP");
      return null;
    }

    console.log("SI ES INE! Parseando datos...");

    const result = {
      apellidoPaterno: parts[0]?.trim() || '',
      apellidoMaterno: parts[1]?.trim() || '',
      nombres: parts[2]?.trim() || '',
      curp: parts[curpIndex]?.trim() || '',
      claveElector: parts[curpIndex + 1]?.trim() || '',
      fechaNacimiento: parts[curpIndex - 2]?.trim() || '',
      sexo: parts[curpIndex - 1]?.trim() || '',
      domicilio: (parts[7] || '') + ' ' + (parts[8] || '') + ' ' + (parts[9] || ''),
      seccion: parts[curpIndex + 2]?.trim() || '',
      municipio: parts[curpIndex + 3]?.trim() || '',
      estado: parts[curpIndex + 4]?.trim() || '',
      vigencia: parts[parts.length - 2]?.trim() || '',
      emision: parts[parts.length - 1]?.trim() || '',
      raw: rawText
    };

    console.log("Datos parseados:", result);
    return result;
  } catch (error) {
    console.error('Error parsing INE:', error);
    return null;
  }
}
