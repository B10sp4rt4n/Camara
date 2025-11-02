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
    const parts = rawText.split('|');

    if (parts.length < 15) {
      console.log('Formato no es INE. Partes:', parts.length);
      return null;
    }

    const curp = parts[3]?.trim() || '';
    if (curp.length !== 18) {
      return null;
    }

    return {
      apellidoPaterno: parts[0]?.trim() || '',
      apellidoMaterno: parts[1]?.trim() || '',
      nombres: parts[2]?.trim() || '',
      curp: curp,
      claveElector: parts[4]?.trim() || '',
      fechaNacimiento: parts[5]?.trim() || '',
      sexo: parts[6]?.trim() || '',
      domicilio: parts[7] + ' ' + parts[8] + ' ' + parts[9],
      seccion: parts[10]?.trim() || '',
      municipio: parts[11]?.trim() || '',
      estado: parts[12]?.trim() || '',
      vigencia: parts[13]?.trim() || '',
      emision: parts[14]?.trim() || '',
      raw: rawText
    };
  } catch (error) {
    console.error('Error parsing INE:', error);
    return null;
  }
}

export function formatINEData(data: INEData): string {
  const sexoCompleto = data.sexo === 'H' ? 'Hombre' : data.sexo === 'M' ? 'Mujer' : data.sexo;
  
  return 'CREDENCIAL PARA VOTAR\n\n' +
    'NOMBRE COMPLETO:\n' +
    data.apellidoPaterno + ' ' + data.apellidoMaterno + '\n' +
    data.nombres + '\n\n' +
    'IDENTIFICACION:\n' +
    'CURP: ' + data.curp + '\n' +
    'Clave Elector: ' + data.claveElector + '\n\n' +
    'DATOS PERSONALES:\n' +
    'Fecha de Nacimiento: ' + data.fechaNacimiento + '\n' +
    'Sexo: ' + sexoCompleto + '\n\n' +
    'UBICACION ELECTORAL:\n' +
    'Seccion: ' + data.seccion + '\n' +
    'Municipio: ' + data.municipio + '\n' +
    'Estado: ' + data.estado + '\n\n' +
    'DOMICILIO:\n' + data.domicilio + '\n\n' +
    'VIGENCIA:\n' +
    'Emision: ' + data.emision + '\n' +
    'Vigencia: ' + data.vigencia;
}
