"use client";
import { useState } from "react";
import ExcelJS from "exceljs";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Excelfile() {
  const [file, setFile] = useState(null);
  const [columnData, setColumnData] = useState([]);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const currentMonth = new Date().getMonth() + 1; // Obtener el mes actual (0 = Enero, 11 = Diciembre)
  const meses = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];
  const codigoMap = {
    5: "BA",
    3: "BV",
    6: "CP",
    1: "FT",
    9: "GS",
    13: "LB",
    4: "LQ",
    7: "NA",
    87: "NC",
    8: "ND",
    11: "PB",
    10: "RA",
    14: "RC",
    2: "RH",
    50: "RL",
    37: "RV",
    12: "TK",
  };
  const handleSelect = (mesValue) => {
    setSelectedMonth(mesValue);
    setButtonDisabled(false);
  };
  // Filtrar los meses para que solo se muestren aquellos antes o igual al mes actual
  const filteredMeses = meses.filter(
    (mes) => parseInt(mes.value) <= currentMonth
  );

  // Modificar la etiqueta del mes actual para incluir "(Actual)"
  const mesesConEtiqueta = filteredMeses.map((mes) => {
    if (parseInt(mes.value) === currentMonth) {
      return { ...mes, label: `${mes.label} (Actual)` };
    }
    return mes;
  });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target.result;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];

        const columnIndices = [
          5, // Fecha de emision
          6, // fecha de venc
          7, // tipo cp
          8, // serie de cdp
          10, // numero cp
          13, // numero de identidad
          14, // apellidos y nombres
          15, // BI Gravado DG
          16, // IGV / IPM DG
          25, // total cp
          26, // moneda
          27, // tipo de cambio
          21, // valor adquirido
          24, // otros trib
          17, // BI Gravado DGNG
          18, // IGV / IPM DGNG
          19, // BI Gravado DNG
          20, // IGV / IPM DNG
          22, // ISC
          23, // ICBPER
        ];
        const startRow = 2;

        const values = [];
        let recordCount = 0;

        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          if (rowNumber >= startRow) {
            const rowValues = columnIndices.map(
              (index) => row.getCell(index).value
            );

            // Check if the row is not empty
            if (
              rowValues.some((value) => value !== null && value !== undefined)
            ) {
              values.push(rowValues);
              recordCount++;
            }
          }
        });

        setColumnData(values);
        console.log("Número de registros:", recordCount);
      };

      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleGenerateXLSX = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    worksheet.addRow([
      "campo",
      "sub diario",
      "numero de comprobante",
      "fecha de emision",
      "fecha de vencimiento",
      "tipo cp",
      "serie",
      "identificacion",
      "nombre",
      "monto",
      "debe/haber",
      "moneda",
      "igv",
    ]);

    let campo = 1;
    let subComp = 1;
    let rows = [];
    columnData.forEach((rowValues) => {
      const subCompFormatted = String(subComp).padStart(4, "0");
      let divisionResult = ((rowValues[8] / rowValues[7]) * 100).toFixed(0);
      let igvValue =
        divisionResult === "18" ? "18" : divisionResult === "10" ? "10" : "";
      // Verificar y agregar row1
      if (rowValues[7] !== 0) {
        const row1 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[7] / rowValues[11]).toFixed(2))
            : rowValues[7], // BI Gravado DG
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row1);
      }
      // Verificar y agregar row2
      if (rowValues[8] !== 0) {
        const row2 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[8] / rowValues[11]).toFixed(2))
            : rowValues[8], // IGV / IPM DG
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row2);
      }
      // Verificar y agregar row3
      if (rowValues[14] !== 0) {
        const row3 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[14] / rowValues[11]).toFixed(2))
            : rowValues[14], // BI Gravado DGNG
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row3);
      }
      // Verificar y agregar row4
      if (rowValues[15] !== 0) {
        const row4 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[15] / rowValues[11]).toFixed(2))
            : rowValues[15], // IGV / IPM DGNG
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row4);
      }
      // Verificar y agregar row5
      if (rowValues[16] !== 0) {
        const row5 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[16] / rowValues[11]).toFixed(2))
            : rowValues[16], // BI Gravado DNG
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row5);
      }
      // Verificar y agregar row6
      if (rowValues[17] !== 0) {
        const row6 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[17] / rowValues[11]).toFixed(2))
            : rowValues[17], // IGV / IPM DNG
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row6);
      }
      // Verificar y agregar row7
      if (rowValues[12] !== 0) {
        const row7 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[12] / rowValues[11]).toFixed(2))
            : rowValues[12], // valor adquirido
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row7);
      }
      // Verificar y agregar row8
      if (rowValues[18] !== 0) {
        const row8 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[18] / rowValues[11]).toFixed(2))
            : rowValues[18], // ISC
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row8);
      }
      // Verificar y agregar row9
      if (rowValues[19] !== 0) {
        const row9 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          //...rowValues.slice(5, 6)
          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[19] / rowValues[11]).toFixed(2))
            : rowValues[19], // ICBPER
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row9);
      }
      if (rowValues[13] !== 0) {
        const row10 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,

          rowValues[5],
          rowValues[6].substring(0, 40), //nombre
          rowValues[10] === "USD"
            ? parseFloat((rowValues[13] / rowValues[11]).toFixed(2))
            : rowValues[13], // otros tributos
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
        ];
        rows.push(row10);
      }
      // Verificar y agregar row10
      const row11 = [
        campo, //campo
        11, //subdiario
        `${selectedMonth}${subCompFormatted}`, // número de comprobante
        rowValues[0], // fecha de emisión
        rowValues[0], // fecha de vencimiento
        codigoMap[rowValues[2]] || rowValues[2], // tipo cp
        `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`, // serie
        rowValues[5],
        rowValues[6].substring(0, 40), // nombre
        rowValues[10] === "USD"
          ? parseFloat((rowValues[9] / rowValues[11]).toFixed(2))
          : rowValues[9], // monto del total
        "H", // debe y haber
        rowValues[10] === "PEN" ? "MN" : "US", // moneda
        igvValue,
      ];
      rows.push(row11);

      // Alterna colores cada 3 filas
      const isEvenGroup = campo % 2 === 0;

      rows.forEach((row) => {
        const newRow = worksheet.addRow(row);
        if (isEvenGroup) {
          newRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "D3D3D3" }, // Gris claro
            };
          });
        }
      });

      campo++;
      subComp++;
      rows.length = 0;
    });

    // Obtener la fecha y hora actual
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const formattedTime = `${String(now.getHours()).padStart(2, "0")}.${String(
      now.getMinutes()
    ).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;
    const fileName = `documento_${formattedDate}_${formattedTime}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendToDatabase = async () => {
    const dataToSend = [];

    let campo = 1;
    let subComp = 1;
    const now = new Date();
    columnData.forEach((rowValues) => {
      const subCompFormatted = String(subComp).padStart(4, "0");

      dataToSend.push({
        campo: campo,
        sub_diario: 11,
        numero_comprobante: `${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}${subCompFormatted}`,
        fecha_emision: rowValues[0],
        fecha_vencimiento: rowValues[1],
        tipo_cp: rowValues[2],
        serie: rowValues[3],
        num_cp: rowValues[4],
        identificacion: rowValues[5],
        nombre: rowValues[6],
        monto: rowValues[7],
        tipo: "bi",
        debe_haber: "D",
        moneda: rowValues[10] === "PEN" ? "MN" : "US",
      });

      dataToSend.push({
        campo: campo,
        sub_diario: 11,
        numero_comprobante: `${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}${subCompFormatted}`,
        fecha_emision: rowValues[0],
        fecha_vencimiento: rowValues[1],
        tipo_cp: rowValues[2],
        serie: rowValues[3],
        num_cp: rowValues[4],
        identificacion: rowValues[5],
        nombre: rowValues[6],
        monto: rowValues[8],
        tipo: "igv",
        debe_haber: "D",
        moneda: rowValues[10] === "PEN" ? "MN" : "US",
      });

      dataToSend.push({
        campo: campo,
        sub_diario: 11,
        numero_comprobante: `${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}${subCompFormatted}`,
        fecha_emision: rowValues[0],
        fecha_vencimiento: rowValues[1],
        tipo_cp: rowValues[2],
        serie: rowValues[3],
        num_cp: rowValues[4],
        identificacion: rowValues[5],
        nombre: rowValues[6],
        monto: rowValues[9],
        tipo: "total",
        debe_haber: "H",
        moneda: rowValues[10] === "PEN" ? "MN" : "US",
      });

      campo++;
      subComp++;
    });

    try {
      console.log(dataToSend);
      //const response = await axios.post("/api/dbsend", { data: dataToSend });
      // console.log("Datos enviados:", response.data);
    } catch (error) {
      console.error("Error al enviar datos:", error);
    }
  };

  return (
    <>
      <div className="py-2">
        <h4 className="text-base font-medium leading-none">1.Subir archivo</h4>
      </div>
      <Separator />
      <div className="grid grid-cols-3 py-4">
        <form>
          <Label htmlFor="excel">Seleccionar Archivo</Label>
          <Input
            id="excel"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
          />
        </form>
      </div>
      <div className="py-2">
        <h4 className="text-base font-medium leading-none">2.Vista Previa</h4>
      </div>
      <Separator />
      <div className="py-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificacion</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>BI</TableHead>
              <TableHead>IGV</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Moneda</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {columnData.slice(0, 4).map((rowValues, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <div className="font-medium">{rowValues[5]}</div>
                </TableCell>
                <TableCell>{rowValues[6]}</TableCell>
                <TableCell>{rowValues[7]}</TableCell>
                <TableCell>{rowValues[8]}</TableCell>
                <TableCell>
                  <div className="font-medium">{rowValues[9]}</div>
                </TableCell>
                <TableCell>{rowValues[10] === "PEN" ? "MN" : "US"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="py-2">
        <h4 className="text-base font-medium leading-none">3.Envios</h4>
      </div>

      <Separator />
      <div className="py-4 flex gap-4">
        <Select onValueChange={(value) => handleSelect(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccione un mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {mesesConEtiqueta.map((mes) => (
                <SelectItem key={mes.value} value={mes.value}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="py-4 flex gap-4">
        <Button
          variant="outline"
          onClick={handleGenerateXLSX}
          className="bg-green-700 text-white hover:bg-green-300"
          disabled={buttonDisabled}
        >
          Generar XLSX
        </Button>
        <Button
          variant="outline"
          onClick={handleSendToDatabase}
          className="bg-sky-700 text-white hover:bg-sky-300"
          disabled={buttonDisabled}
        >
          Enviar a Base de Datos
        </Button>
      </div>
    </>
  );
}

export default Excelfile;

//rows = [row1, row2, row3, row4, row5, row6, row7, row8, row9, row10];

// if (rowValues[12] === 0 && rowValues[13] === 0) {
//   const row3 = [
//     campo, //campo
//     11, //subdiario
//     `${selectedMonth}${subCompFormatted}`, // número de comprobante
//     rowValues[0], // fecha de emisión
//     rowValues[0], // fecha de vencimiento
//     codigoMap[rowValues[2]] || rowValues[2], // tipo cp
//     `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`, // serie
//     rowValues[5],
//     rowValues[6].substring(0, 40), // nombre
//     rowValues[10] === "USD"
//       ? parseFloat((rowValues[9] / rowValues[11]).toFixed(2))
//       : rowValues[9], // monto
//     "H", // debe y haber
//     rowValues[10] === "PEN" ? "MN" : "US", // moneda
//     igvValue,
//   ];

//   rows = [row1, row2, row3];
// } else {
// const row3 = [
//   campo, //campo
//   11, //subdiario
//   `${selectedMonth}${subCompFormatted}`, // número de comprobante
//   rowValues[0], // fecha de emisión
//   rowValues[0], // fecha de vencimiento
//   codigoMap[rowValues[2]] || rowValues[2], // tipo cp
//   `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`, // serie
//   rowValues[5],
//   rowValues[6].substring(0, 40), // nombre
//   rowValues[10] === "USD"
//     ? parseFloat(
//         (
//           (rowValues[12] === 0 ? rowValues[13] : rowValues[12]) /
//           rowValues[11]
//         ).toFixed(2)
//       )
//     : rowValues[12] === 0
//     ? rowValues[13]
//     : rowValues[12], // monto dependiendo de si alguno de los valores no es cero
//   "D", // debe y haber
//   rowValues[10] === "PEN" ? "MN" : "US", // moneda
//   igvValue,
// ];

// const row4 = [
//   campo, //campo
//   11, //subdiario
//   `${selectedMonth}${subCompFormatted}`, // número de comprobante
//   rowValues[0], // fecha de emisión
//   rowValues[0], // fecha de vencimiento
//   codigoMap[rowValues[2]] || rowValues[2], // tipo cp
//   `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`, // serie
//   rowValues[5],
//   rowValues[6].substring(0, 40), // nombre
//   rowValues[10] === "USD"
//     ? parseFloat((rowValues[9] / rowValues[11]).toFixed(2))
//     : rowValues[9], // monto del total
//   "H", // debe y haber
//   rowValues[10] === "PEN" ? "MN" : "US", // moneda
//   igvValue,
// ];

// rows = [row1, row2, row3, row4];
// }
