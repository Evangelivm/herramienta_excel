import { NextResponse } from "next/server";
import { conn } from "../libs/mysql";

export async function POST(request) {
  try {
    const { data } = await request.json(); // Recibe los datos enviados desde el frontend

    // Verificar si hay datos
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "No se proporcionaron datos" },
        { status: 400 }
      );
    }

    // Preparar los valores para la consulta SQL
    const values = data.map(
      ({
        campo,
        sub_diario,
        numero_comprobante,
        fecha_emision,
        fecha_vencimiento,
        tipo_cp,
        serie,
        num_cp,
        identificacion,
        nombre,
        monto,
        debe_haber,
        moneda,
      }) => [
        campo,
        sub_diario,
        numero_comprobante,
        fecha_emision,
        fecha_vencimiento,
        tipo_cp,
        serie,
        num_cp,
        identificacion, // "identificacion" va al campo "codigo_anexo"
        nombre, // "nombre" va al campo "glosa_principal"
        monto, // "monto" va al campo "debe_haber"
        debe_haber,
        moneda,
      ]
    );

    // Crear la consulta SQL para la inserción masiva
    const query = `
      INSERT INTO masivo_copy1 (campo, sub_diario, num_comprobante, fecha_documento, fecha_vencimiento, numero_documento, codigo_anexo, glosa_principal, debe_haber,moneda) 
      VALUES ?
    `;

    // Ejecutar la consulta de inserción masiva
    const [result] = await conn.query(query, [values]);

    return NextResponse.json({
      message: "Datos insertados exitosamente",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
