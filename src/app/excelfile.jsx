"use client";
import { useState } from "react";
import ExcelJS from "exceljs";
import axios from "axios";
import { Toaster, toast } from "sonner";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [inputValue, setInputValue] = useState("");
  const [columnData, setColumnData] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [isDataGenerating, setIsDataGenerating] = useState(false);
  const [isFileGenerating, setIsFileGenerating] = useState(false);
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
  let subCompEx = showInput ? inputValue : 1;

  const subCompValue = String(inputValue).padStart(4, "0");

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };
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
    setIsFileGenerating(true);
    setButtonDisabled(true);
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
      "cuenta contable",
    ]);

    let campo = 1;
    let rows = [];
    columnData.forEach((rowValues) => {
      const subCompFormatted = String(subCompEx).padStart(4, "0");
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
          "603219",
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
          "401111",
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
          "603219",
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
          "401111",
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
          "603219",
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
          "401111",
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
          "603219",
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
          "603219",
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
          "603219",
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
          rowValues[10] === "PEN" ? "421201" : "421202",
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
        rowValues[10] === "PEN" ? "421201" : "421202",
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
      subCompEx++;
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
    setTimeout(() => {
      setIsFileGenerating(false);
      setButtonDisabled(false);
      toast.success("Archivo creado con exito");
    }, 1000);
  };

  const handleSendToDatabase = async () => {
    setIsDataGenerating(true);
    setButtonDisabled(true);
    const dataToSend = [];
    // hacer otro json dentro del foreach para detectar el primero y modificarlo
    let campo = 1;
    //  let subComp = 1;
    const now = new Date();
    const selectedMonth = String(now.getMonth() + 1).padStart(2, "0");

    columnData.forEach((rowValues) => {
      // hacer otro json dentro del foreach para detectar el primero y modificarlo
      const dataTempToSend = [];
      const subCompFormatted = String(subCompEx).padStart(4, "0");
      let divisionResult = ((rowValues[8] / rowValues[7]) * 100).toFixed(0);
      let igvValue =
        divisionResult === "18" ? "18" : divisionResult === "10" ? "10" : "";

      // Verificar y agregar row1
      if (rowValues[7] !== 0) {
        dataTempToSend.push({
          campo: campo, //Campo
          sub_diario: 11, // Sub Diario
          numero_comprobante: `${selectedMonth}${subCompFormatted}`, // Numero de Comprobante
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "), // Fecha de Comprobante
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2], // Tipo de documento
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`, // Numero de documento
          identificacion: rowValues[5], // Aparecer a partir de la segunda repeticion de codigo de anexo

          nombre: rowValues[6].substring(0, 40), // Glosa Principal y Glosa Detalle
          // Importe Original
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[7] / rowValues[11]).toFixed(2))
              : rowValues[7],
          debe_haber: "D", // Debe / Haber
          moneda: rowValues[10] === "PEN" ? "MN" : "US", // Codigo de Moneda
          igv: igvValue, // Tasa IGV
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row2
      if (rowValues[8] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[8] / rowValues[11]).toFixed(2))
              : rowValues[8],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "401111",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row3
      if (rowValues[14] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[14] / rowValues[11]).toFixed(2))
              : rowValues[14],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row4
      if (rowValues[15] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[15] / rowValues[11]).toFixed(2))
              : rowValues[15],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "401111",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row5
      if (rowValues[16] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[16] / rowValues[11]).toFixed(2))
              : rowValues[16],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row6
      if (rowValues[17] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[17] / rowValues[11]).toFixed(2))
              : rowValues[17],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "401111",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row7
      if (rowValues[12] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[12] / rowValues[11]).toFixed(2))
              : rowValues[12],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row8
      if (rowValues[18] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[18] / rowValues[11]).toFixed(2))
              : rowValues[18],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row9
      if (rowValues[19] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[19] / rowValues[11]).toFixed(2))
              : rowValues[19],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[13] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],

          nombre: rowValues[6].substring(0, 40),
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[13] / rowValues[11]).toFixed(2))
              : rowValues[13],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: rowValues[10] === "PEN" ? "421201" : "421202",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      // Verificar y agregar row10
      // Este es el total
      dataTempToSend.push({
        campo: campo,
        sub_diario: 11,
        numero_comprobante: `${selectedMonth}${subCompFormatted}`,
        fecha_emision: new Date(rowValues[0])
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        fecha_vencimiento: new Date(rowValues[0])
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
        serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
        identificacion: rowValues[5],

        nombre: rowValues[6].substring(0, 40),
        monto:
          rowValues[10] === "USD"
            ? parseFloat((rowValues[9] / rowValues[11]).toFixed(2))
            : rowValues[9],
        debe_haber: "H",
        moneda: rowValues[10] === "PEN" ? "MN" : "US",
        igv: igvValue,
        cuenta_contable: rowValues[10] === "PEN" ? "421201" : "421202",
        codigo_anexo_aux: "SAT",
        tipo_doc_ref: "",
        num_doc_ref: "",
        fecha_doc_ref: null,
        tipo_convers: "V",
        flag_conver_mon: "S",
      });

      campo++;
      subCompEx++;
      // primero filtrar el primero de los array
      dataTempToSend[0].tipo_doc_ref = "OC";
      dataTempToSend[0].num_doc_ref = "SN";
      dataTempToSend[0].fecha_doc_ref = new Date(rowValues[0])
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      dataToSend.push(...dataTempToSend);
      // borrar el array
      dataTempToSend.value = 0;
    });

    try {
      //console.log(dataToSend);
      const response = await axios.post("/api/dbsend", { data: dataToSend });
      console.log("Datos enviados:", response.data);
      toast.success("Datos enviados con éxito");
    } catch (error) {
      console.error("Error al enviar datos:", error);
      toast.error("Datos enviados con éxito");
    }
    setTimeout(() => {
      setIsDataGenerating(false);
      setButtonDisabled(false);
    }, 1000);
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="py-2">
        <h4 className="text-base font-medium leading-none">1.Subir archivo</h4>
      </div>
      <Separator />
      <div className="grid grid-cols-3 py-4">
        <form>
          <div className="pb-4 flex gap-4">
            <Label htmlFor="excel">Seleccionar Archivo</Label>
          </div>
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
        <Label htmlFor="excel">1. Escoger mes del numero de comprobante</Label>
      </div>
      <div className="pb-4 flex gap-4">
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

      <div className="pb-4 flex gap-4">
        <RadioGroup defaultValue="option-one">
          <div className="pb-4 flex gap-4">
            <Label htmlFor="excel">2. Escoger numero de comprobante</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-one"
              id="option-one"
              onClick={() => setShowInput(false)}
            />
            <Label htmlFor="option-one">Empezar desde 0 (0001)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-two"
              id="option-two"
              onClick={() => setShowInput(true)}
            />
            <Label htmlFor="option-two">Asignar numero</Label>
          </div>
          {showInput && (
            <div className="py-2 flex gap-4">
              <Input
                type="number"
                placeholder="Número"
                value={inputValue}
                onChange={handleInputChange}
              />
            </div>
          )}
          <div className="pt-4 flex gap-4">
            <Label htmlFor="excel">
              Ejemplo: {selectedMonth}
              {showInput ? subCompValue : "0001"}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="pt-4 flex gap-4">
        <Button
          variant="outline"
          onClick={handleGenerateXLSX}
          className="bg-green-700 text-white hover:bg-green-300"
          disabled={buttonDisabled}
        >
          {isFileGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando
            </>
          ) : (
            "Generar XLSX"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleSendToDatabase}
          className="bg-sky-700 text-white hover:bg-sky-300"
          disabled={buttonDisabled}
        >
          {isDataGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando
            </>
          ) : (
            "Enviar a Base de Datos"
          )}
        </Button>
      </div>
    </>
  );
}

export default Excelfile;

//rows = [row1, row2, row3, row4, row5, row6, row7, row8, row9, row10];

// if (rowValues[12] === 0 && rowValues[13] === 0) {
//   const row3 = [
//
//
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
