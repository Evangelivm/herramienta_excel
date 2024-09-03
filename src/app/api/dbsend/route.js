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
        identificacion,
        nombre,
        monto,
        debe_haber,
        moneda,
        igv,
        cuenta_contable,
        codigo_anexo_aux,
        tipo_doc_ref,
        num_doc_ref,
        fecha_doc_ref,
        tipo_convers,
        flag_conver_mon,
      }) => [
        campo,
        sub_diario,
        numero_comprobante, // Asegúrate que `numero_comprobante` corresponde a `num_comprobante` en la tabla
        fecha_emision,
        fecha_vencimiento,
        tipo_cp, // Asegúrate que `tipo_cp` corresponde a `tipo_cambio` si es el caso
        serie, // Asegúrate que `serie` corresponde a `numero_documento`
        identificacion,
        nombre, // Asegúrate que `nombre` corresponde a `glosa_principal`
        monto, // Asegúrate que `monto` corresponde a `importe_original`
        debe_haber,
        moneda, // Asegúrate que `moneda` corresponde a `cod_moneda`
        igv, // Asegúrate que `igv` corresponde a `tasa_igv`
        cuenta_contable,
        codigo_anexo_aux, // Asegúrate que `codigo_anexo_aux` corresponde a `codigo_auxiliar`
        tipo_doc_ref,
        num_doc_ref,
        fecha_doc_ref,
        tipo_convers, // Asegúrate que `tipo_convers` corresponde a `tipo_conversion`
        flag_conver_mon, // Asegúrate que `flag_conver_mon` corresponde a `flag_conversion`
      ]
    );

    // Crear la consulta SQL para la inserción masiva
    const query = `
      INSERT INTO masivo_copy1 (
        campo,
        sub_diario,
        num_comprobante,
        fecha_documento,
        fecha_vencimiento,
        tipo_documento,
        numero_documento,
        codigo_anexo,
        glosa_principal,
        importe_original,
        debe_haber,
        cod_moneda,
        tasa_igv,
        cuenta_contable,
        codigo_auxiliar,
        tipo_doc_referencia,
        num_doc_referencia,
        fecha_doc_referencia,
        tipo_conversion,
        flag_conversion
      ) 
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
