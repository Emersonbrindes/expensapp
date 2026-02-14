import type { jsPDF } from "jspdf";
import type autoTable from "jspdf-autotable";

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAYS_OF_WEEK_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Route {
  origin: string;
  destination: string;
  distance: number;
  dateOfRoute?: string;
}

interface FuelValues {
  kmPerLiter: number;
  literPrice: number;
}

interface PDFData {
  dateFrom: string;
  dateTo: string;
  workDays: boolean[];
  dailyExpenses: Record<number, Record<number, number>>;
  routes: Route[];
  categories: Category[];
  fuelValues: FuelValues;
}

export async function generateExpensePDF(data: PDFData) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Calcular diferença de dias
  const [yearFrom, monthFrom, dayFrom] = data.dateFrom.split('-').map(Number);
  const [yearTo, monthTo, dayTo] = data.dateTo.split('-').map(Number);
  const dateFromObj = new Date(yearFrom, monthFrom - 1, dayFrom);
  const dateToObj = new Date(yearTo, monthTo - 1, dayTo);
  const daysDifference = Math.max(1, Math.ceil((dateToObj.getTime() - dateFromObj.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Título
  doc.setFontSize(14);
  doc.text("Programação de Despesas", pageWidth / 2, 12, { align: "center" });

  // Subtítulo com período
  doc.setFontSize(9);
  const startDate = new Date(dateFromObj);
  const endDate = new Date(dateToObj);
  const periodText = `${startDate.toLocaleDateString("pt-BR")} a ${endDate.toLocaleDateString("pt-BR")} • ${startDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
  doc.text(periodText, pageWidth / 2, 18, { align: "center" });

  // Representante
  doc.setFontSize(9);
  doc.text("Representante: Emerson Barbosa", pageWidth / 2, 23, { align: "center" });

  let currentY = 27;

  // Preparar dados da tabela de despesas
  const workingDays = data.workDays
    .map((isWorking, index) => (isWorking ? index : -1))
    .filter((index) => index !== -1);

  const tableHeaders = workingDays.map((dayIndex) => {
    const currentDate = new Date(dateFromObj);
    currentDate.setDate(currentDate.getDate() + dayIndex);
    const dayOfWeek = DAYS_OF_WEEK_SHORT[currentDate.getDay()];
    const dayMonth = currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return `${dayOfWeek}\n${dayMonth}`;
  });

  const tableData: any[][] = [];

  // Linhas de categorias
  data.categories.forEach((category) => {
    const row = [category.name];
    workingDays.forEach((dayIndex) => {
      const value = data.dailyExpenses[dayIndex]?.[category.id] || 0;
      row.push(value > 0 ? `R$ ${value.toFixed(2)}` : "0,00");
    });
    const total = workingDays.reduce((sum, dayIndex) => {
      return sum + (data.dailyExpenses[dayIndex]?.[category.id] || 0);
    }, 0);
    row.push(`R$\n${total.toFixed(2)}`);
    tableData.push(row);
  });

  // Linha de Total do Dia
  const totalDayRow = ["Total do Dia"];
  workingDays.forEach((dayIndex) => {
    const dayTotal = data.categories.reduce((sum, cat) => {
      return sum + (data.dailyExpenses[dayIndex]?.[cat.id] || 0);
    }, 0);
    totalDayRow.push(`R$ ${dayTotal.toFixed(2)}`);
  });
  const grandTotal = workingDays.reduce((sum, dayIndex) => {
    return sum + data.categories.reduce((catSum, cat) => {
      return catSum + (data.dailyExpenses[dayIndex]?.[cat.id] || 0);
    }, 0);
  }, 0);
  totalDayRow.push(`R$\n${grandTotal.toFixed(2)}`);
  tableData.push(totalDayRow);

  // Linha de Projeção
  const projectionRow = ["Projeção"];
  let accumulated = 0;
  workingDays.forEach((dayIndex) => {
    const dayTotal = data.categories.reduce((sum, cat) => {
      return sum + (data.dailyExpenses[dayIndex]?.[cat.id] || 0);
    }, 0);
    accumulated += dayTotal;
    projectionRow.push(`R$ ${accumulated.toFixed(2)}`);
  });
  projectionRow.push("");
  tableData.push(projectionRow);

  // Calcular larguras das colunas
  const numDays = tableHeaders.length;
  const categoryWidth = 35; // Largura da coluna Categoria
  const totalWidth = 28; // Largura da coluna Total (aumentada)
  const remainingWidth = pageWidth - categoryWidth - totalWidth - 20; // 20 para margens
  const dayWidth = remainingWidth / numDays; // Dividir espaço restante entre os dias

  const columnWidths: Record<number, number> = {
    0: categoryWidth, // Categoria
  };
  for (let i = 1; i <= numDays; i++) {
    columnWidths[i] = dayWidth; // Dias da semana
  }
  columnWidths[numDays + 1] = totalWidth; // Total

  // Tabela de despesas
  (doc as any).autoTable({
    startY: currentY,
    head: [["Categoria", ...tableHeaders, "Total"]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5, halign: "center" },
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: categoryWidth },
      [numDays + 1]: { cellWidth: totalWidth },
    },
    didParseCell: (data: any) => {
      if (data.row.index === tableData.length - 2) {
        data.cell.styles.fillColor = [229, 231, 235];
        data.cell.styles.fontStyle = "bold";
      }
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = [211, 211, 211];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 1.5;

  // Tabela de Trajetos
  if (data.routes.length > 0) {
    doc.setFontSize(9);
    doc.text("Trajetos", 14, currentY);
    currentY += 1;

    const routeTableData = data.routes.map((route) => {
      const routeDate = route.dateOfRoute ? new Date(route.dateOfRoute + 'T00:00:00') : new Date(dateFromObj);
      const dayOfWeek = DAYS_OF_WEEK[routeDate.getDay()];
      const formattedDate = `${dayOfWeek}, ${routeDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
      const cost = (route.distance / data.fuelValues.kmPerLiter) * data.fuelValues.literPrice;
      return [formattedDate, route.origin, route.destination, `${route.distance.toFixed(2)} KM`, `R$ ${cost.toFixed(2)}`];
    });

    const totalKm = data.routes.reduce((sum, route) => sum + route.distance, 0);
    const totalCost = (totalKm / data.fuelValues.kmPerLiter) * data.fuelValues.literPrice;
    routeTableData.push(["", "", "Total", `${totalKm.toFixed(2)} KM`, `R$ ${totalCost.toFixed(2)}`]);

    (doc as any).autoTable({
      startY: currentY,
      head: [["Dia", "Origem", "Destino", "Distância", "Custo"]],
      body: routeTableData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.5, halign: "center" },
      headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        1: { halign: "left" },
        2: { halign: "left" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      didParseCell: (data: any) => {
        if (data.row.index === routeTableData.length - 1) {
          data.cell.styles.fillColor = [229, 231, 235];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 1.5;
  }

  // Deslocamento
  const totalKm = data.routes.reduce((sum, route) => sum + route.distance, 0);
  const litersNeeded = totalKm / data.fuelValues.kmPerLiter;
  const totalFuelCost = litersNeeded * data.fuelValues.literPrice;

  doc.setFontSize(9);
  doc.text("Deslocamento", 14, currentY);
  currentY += 1;

  (doc as any).autoTable({
    startY: currentY,
    head: [["Descrição", "Valor"]],
    body: [
      ["Quilometragem Total", `${totalKm} KM`],
      ["Média KM/L", `${data.fuelValues.kmPerLiter} KM/L`],
      ["Litros Necessários", `${litersNeeded.toFixed(2)} L`],
      ["Valor/Litro", `R$ ${data.fuelValues.literPrice.toFixed(2)}`],
      ["Custo Total", `R$ ${totalFuelCost.toFixed(2)}`],
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 1.5;

  // Resumo da Semana
  doc.setFontSize(9);
  doc.text("Resumo da Semana", 14, currentY);
  currentY += 1;

  const totalExpenses = workingDays.reduce((sum, dayIndex) => {
    return sum + data.categories.reduce((catSum, cat) => {
      return catSum + (data.dailyExpenses[dayIndex]?.[cat.id] || 0);
    }, 0);
  }, 0);

  (doc as any).autoTable({
    startY: currentY,
    head: [["Descrição", "Valor"]],
    body: [
      ["Total Despesas", `R$ ${totalExpenses.toFixed(2)}`],
      ["Total Deslocamento", `R$ ${totalFuelCost.toFixed(2)}`],
      ["TOTAL GERAL", `R$ ${(totalExpenses + totalFuelCost).toFixed(2)}`],
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  // Salvar PDF
  const fileName = `Despesas_${startDate.toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
}
