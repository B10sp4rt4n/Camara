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
    // INE PDF417 format has fields separated by pipes (|)
    const parts = rawText.split('|');
    
    if (parts.length < 15) {
      console.warn('Not enough parts in INE data', parts.length);
      return null;
    }

    return {
      apellidoPaterno: parts[0]?.trim() || '',
      apellidoMaterno: parts[1]?.trim() || '',
      nombres: parts[2]?.trim() || '',
      curp: parts[3]?.trim() || '',
      claveElector: parts[4]?.trim() || '',
      fechaNacimiento: parts[5]?.trim() || '',
      sexo: parts[6]?.trim() || '',
      domicilio: `${parts[7]} ${parts[8]} ${parts[9]}`.trim(),
      seccion: parts[10]?.trim() || '',
      municipio: parts[11]?.trim() || '',
      estado: parts[12]?.trim() || '',
      vigencia: parts[13]?.trim() || '',
      emision: parts[14]?.trim() || '',
      raw: rawText
    };
  } catch (error) {
    console.error('Error parsing INE credential:', error);
    return null;
  }
}

export function formatINEData(data: INEData): string {
  return `
📋 DATOS DE CREDENCIAL INE/IFE

👤 Nombre Completo:
${data.apellidoPaterno} ${data.apellidoMaterno} ${data.nombres}

🆔 Identificación:
• CURP: ${data.curp}
• Clave Elector: ${data.claveElector}

📅 Datos Personales:
• Fecha Nacimiento: ${data.fechaNacimiento}
• Sexo: ${data.sexo}

📍 Ubicación Electoral:
• Sección: ${data.seccion}
• Municipio: ${data.municipio}
• Estado: ${data.estado}

🏠 Domicilio:
${data.domicilio}

📅 Vigencia:
• Emisión: ${data.emision}
• Vigencia: ${data.vigencia}
`.trim();
}
