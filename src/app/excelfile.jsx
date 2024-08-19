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

        const columnIndices = [5, 6, 7, 8, 10, 13, 14, 15, 16, 25, 26];
        const startRow = 4;

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
      "num cp",
      "identificacion",
      "nombre",
      "monto",
      "debe/haber",
      "moneda",
    ]);

    let campo = 1;
    let subComp = 1;

    columnData.forEach((rowValues) => {
      const subCompFormatted = String(subComp).padStart(4, "0");

      const row1 = [
        campo,
        11,
        `${selectedMonth}${subCompFormatted}`,
        rowValues[0],
        rowValues[0],
        ...rowValues.slice(2, 7),
        rowValues[7],
        "D",
        rowValues[10] === "PEN" ? "MN" : "US",
      ];

      const row2 = [
        campo,
        11,
        `${selectedMonth}${subCompFormatted}`,
        rowValues[0],
        rowValues[0],
        ...rowValues.slice(2, 7),
        rowValues[8],
        "D",
        rowValues[10] === "PEN" ? "MN" : "US",
      ];

      const row3 = [
        campo,
        11,
        `${selectedMonth}${subCompFormatted}`,
        rowValues[0],
        rowValues[0],
        ...rowValues.slice(2, 7),
        rowValues[9],
        "H",
        rowValues[10] === "PEN" ? "MN" : "US",
      ];

      const rows = [row1, row2, row3];

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
