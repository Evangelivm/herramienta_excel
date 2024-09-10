import { NextResponse } from "next/server";
import { conn } from "../libs/mysql";

export async function GET() {
  try {
    // Consulta para obtener el valor de AUTO_INCREMENT
    const [result] = await conn.query(
      "SELECT AUTO_INCREMENT as nextId FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'masivo'"
    );

    // Obtener el valor de AUTO_INCREMENT
    const nextAutoIncrementId = result[0].nextId;

    return NextResponse.json({
      nextId: nextAutoIncrementId - 1, // Valor del próximo ID auto-incremental
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
