import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, Download, Copy, Plus, Trash2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ptBR } from "date-fns/locale";

// Usar localização brasileira do date-fns
const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAYS_OF_WEEK_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

const DEFAULT_CATEGORIES = [
  { name: "Hospedagem", color: "#3B82F6" },
  { name: "Alimentação", color: "#10B981" },
  { name: "Combustível", color: "#F59E0B" },
  { name: "Diárias/Balsa", color: "#8B5CF6" },
];

const FUEL_CONFIG = {
  kmPerLiter: 12,
  literPrice: 7.0,
};

interface FuelValues {
  kmPerLiter: number;
  literPrice: number;
}

interface Route {
  id?: number;
  origin: string;
  destination: string;
  distance: number;
  dateOfRoute?: string;
}

export default function ExpenseForm() {
  const { user, loading: authLoading } = useAuth();
  
  // Ler ID da workWeek da URL se existir
  const urlParams = new URLSearchParams(window.location.search);
  const workWeekId = urlParams.get('id') ? parseInt(urlParams.get('id')!) : null;
  const shouldGeneratePDF = urlParams.get('pdf') === 'true';
  const [pdfGenerated, setPdfGenerated] = useState(false);
  
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    const today = new Date();
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
    return endDate.toISOString().split('T')[0];
  });
  const [loadedWorkWeekId, setLoadedWorkWeekId] = useState<number | null>(null);

  // Calcular a diferença de dias usando strings de data para evitar problemas de fuso horário
  const [yearFrom, monthFromCalc, dayFromCalc] = dateFrom.split('-').map(Number);
  const [yearTo, monthToCalc, dayToCalc] = dateTo.split('-').map(Number);
  const dateFromObj = new Date(yearFrom, monthFromCalc - 1, dayFromCalc);
  const dateToObj = new Date(yearTo, monthToCalc - 1, dayToCalc);
  const daysDifference = Math.max(1, Math.ceil((dateToObj.getTime() - dateFromObj.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  const weekStart = dateFromObj;
  const weekEnd = dateToObj;
  const [workDays, setWorkDays] = useState<boolean[]>(() => {
    const numDays = Math.min(daysDifference, 31);
    const days = Array(numDays).fill(true);
    if (numDays >= 6) days[5] = false;
    if (numDays >= 7) days[6] = false;
    return days;
  });

  useEffect(() => {
    setWorkDays((prev) => {
      const numDays = Math.min(daysDifference, 31);
      const newDays = Array(numDays).fill(false);
      for (let i = 0; i < Math.min(prev.length, newDays.length); i++) {
        newDays[i] = prev[i];
      }
      return newDays;
    });
  }, [daysDifference]);
  const [dailyExpenses, setDailyExpenses] = useState<Record<number, Record<number, number>>>({});
  const [quickFillValues, setQuickFillValues] = useState<Record<number, string>>({});
  const [routes, setRoutes] = useState<Route[]>([]);
  const [newRoute, setNewRoute] = useState<Route>({
    origin: "",
    destination: "",
    distance: 0,
    dateOfRoute: dateFrom,
  });
  const [fuelValues, setFuelValues] = useState<FuelValues>({
    kmPerLiter: FUEL_CONFIG.kmPerLiter,
    literPrice: FUEL_CONFIG.literPrice,
  });
  const [observations, setObservations] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const categoriesQuery = trpc.categories.list.useQuery();
  const createExpenseMutation = trpc.expenses.create.useMutation();
  const createCategoryMutation = trpc.categories.create.useMutation();
  const createWorkWeekMutation = trpc.workWeeks.create.useMutation();
  const createRouteMutation = trpc.routes.create.useMutation();
  
  // Carregar workWeek se ID estiver presente na URL
  const workWeekQuery = trpc.workWeeks.getById.useQuery(
    workWeekId || 0,
    { enabled: !!workWeekId && !!user }
  );
  
  // Carregar routes da workWeek
  const routesQuery = trpc.routes.list.useQuery(
    workWeekId || 0,
    { enabled: !!workWeekId && !!user }
  );
  
  // Carregar expenses da workWeek (baseado nas datas)
  const expensesQuery = trpc.expenses.list.useQuery(
    {
      startDate: workWeekQuery.data?.weekStartDate,
      endDate: workWeekQuery.data?.weekEndDate,
    },
    { enabled: !!workWeekQuery.data && !!user }
  );

  useEffect(() => {
    if (categoriesQuery.data && categoriesQuery.data.length === 0 && user) {
      DEFAULT_CATEGORIES.forEach((cat) => {
        createCategoryMutation.mutate(cat);
      });
    }
  }, [categoriesQuery.data, user]);

  // Carregar dados da workWeek quando disponível
  useEffect(() => {
    if (workWeekQuery.data && workWeekId && loadedWorkWeekId !== workWeekId) {
      const workWeek = workWeekQuery.data;
      
      // Carregar datas (usar UTC para evitar problemas de timezone)
      const startDate = new Date(workWeek.weekStartDate);
      const endDate = new Date(workWeek.weekEndDate);
      
      // Formatar datas em formato local YYYY-MM-DD
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setDateFrom(formatLocalDate(startDate));
      setDateTo(formatLocalDate(endDate));
      
      // Carregar workDays
      try {
        const workDaysArray = JSON.parse(workWeek.workDays);
        setWorkDays(workDaysArray);
      } catch (e) {
        console.error('Erro ao parsear workDays:', e);
      }
      
      // Carregar expenses do JSON
      if (workWeek.expenses) {
        try {
          const loadedExpenses = JSON.parse(workWeek.expenses);
          setDailyExpenses(loadedExpenses);
        } catch (e) {
          console.error('Erro ao parsear expenses:', e);
        }
      }
      
      setLoadedWorkWeekId(workWeekId);
    }
  }, [workWeekQuery.data, workWeekId, loadedWorkWeekId]);

  // Carregar routes quando disponíveis
  useEffect(() => {
    if (routesQuery.data && workWeekId && loadedWorkWeekId === workWeekId) {
      const loadedRoutes = routesQuery.data.map(route => ({
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        distance: route.distance,
        dateOfRoute: dateFrom,
      }));
      setRoutes(loadedRoutes);
    }
  }, [routesQuery.data, workWeekId, loadedWorkWeekId, dateFrom]);

  // Gerar PDF automaticamente se shouldGeneratePDF for true
  useEffect(() => {
    if (shouldGeneratePDF && !pdfGenerated && loadedWorkWeekId === workWeekId && workWeekId) {
      // Aguardar um momento para garantir que todos os dados foram carregados
      const timer = setTimeout(() => {
        handleExportPDF();
        setPdfGenerated(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldGeneratePDF, pdfGenerated, loadedWorkWeekId, workWeekId]);

  // Expenses agora são carregadas diretamente do JSON da workWeek (ver useEffect acima)

  useEffect(() => {
    // Só inicializar se não houver dados carregados de uma workWeek
    if (categoriesQuery.data && !workWeekId) {
      const expenses: Record<number, Record<number, number>> = {};
      const quickFill: Record<number, string> = {};
      for (let i = 0; i < daysDifference; i++) {
        expenses[i] = {};
        categoriesQuery.data.forEach((cat) => {
          expenses[i][cat.id] = 0;
        });
      }
      categoriesQuery.data.forEach((cat) => {
        quickFill[cat.id] = "";
      });
      setDailyExpenses(expenses);
      setQuickFillValues(quickFill);
    }
  }, [categoriesQuery.data, daysDifference, workWeekId]);

  const handleWorkDayToggle = (dayIndex: number) => {
    setWorkDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = !updated[dayIndex];
      return updated;
    });
  };

  const handleExpenseChange = (dayIndex: number, categoryId: number, value: string) => {
    setDailyExpenses((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [categoryId]: parseFloat(value) || 0,
      },
    }));
  };

  const handleQuickFill = (categoryId: number, value: string) => {
    setQuickFillValues((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  };

  const applyQuickFill = (categoryId: number) => {
    const value = parseFloat(quickFillValues[categoryId]) || 0;
    if (value > 0) {
      // Verificar se é categoria Combustível
      const category = categoriesQuery.data?.find(c => c.id === categoryId);
      const isFuelCategory = category?.name.toLowerCase().includes('combust');

      setDailyExpenses((prev) => {
        const updated = { ...prev };
        for (let i = 0; i < daysDifference; i++) {
          if (workDays[i]) {
            // Se for Combustível, pular sábados e domingos
            if (isFuelCategory) {
              const dateStr = dateFrom;
              const baseDate = new Date(dateStr + 'T00:00:00Z');
              const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
              const dayOfWeek = (date.getUTCDay() + 6) % 7; // 0=segunda, 5=sábado, 6=domingo
              if (dayOfWeek === 5 || dayOfWeek === 6) continue; // Pular sábado e domingo
            }
            
            updated[i] = {
              ...updated[i],
              [categoryId]: value,
            };
          }
        }
        return updated;
      });
    }
  };

  const addRoute = () => {
    if (newRoute.origin && newRoute.destination && newRoute.distance > 0) {
      setRoutes([...routes, newRoute]);
      setNewRoute({
        origin: "",
        destination: "",
        distance: 0,
        dateOfRoute: dateFrom,
      });
    }
  };

  const removeRoute = (id: number | undefined) => {
    setRoutes(routes.filter((r) => r.id !== id));
  };

  const calculateDailyTotal = (dayIndex: number): number => {
    if (!workDays[dayIndex]) return 0;
    return Object.values(dailyExpenses[dayIndex] || {}).reduce((sum, val) => sum + val, 0);
  };

  const calculateWeeklyTotal = (): number => {
    return Array.from({ length: daysDifference }, (_, i) => calculateDailyTotal(i)).reduce((sum, val) => sum + val, 0);
  };

  const calculateTotalDistance = (): number => {
    return routes.reduce((sum, route) => sum + route.distance, 0);
  };

  const calculateFuelCost = (): number => {
    const liters = calculateTotalDistance() / FUEL_CONFIG.kmPerLiter;
    return liters * FUEL_CONFIG.literPrice;
  };

  const calculateFuelCostPerRoute = (distance: number): number => {
    const liters = distance / FUEL_CONFIG.kmPerLiter;
    return liters * FUEL_CONFIG.literPrice;
  };

  const calculateLiters = (): number => {
    return calculateTotalDistance() / FUEL_CONFIG.kmPerLiter;
  };

  const calculateAccumulatedCosts = (): any[] => {
    const accumulated: any[] = [];
    let total = 0;
    let accumulatedFuelCost = 0;

    for (let i = 0; i < daysDifference; i++) {
      if (workDays[i]) {
        const dayTotal = calculateDailyTotal(i);
        total += dayTotal;
        const baseDate = new Date(dateFrom + 'T00:00:00Z');
        const currentDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        const currentDateStr = currentDate.toISOString().split('T')[0];
        const dayRoutes = routes.filter((r) => r.dateOfRoute === currentDateStr);
        const dayFuelCost = dayRoutes.reduce((sum, route) => sum + calculateFuelCostPerRoute(route.distance), 0);
        accumulatedFuelCost += dayFuelCost;
        const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
        const dayOfWeek = (date.getDay() + 6) % 7;
        accumulated.push({
          day: DAYS_OF_WEEK_SHORT[dayOfWeek],
          date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          accumulated: total,
          dayFuelCost: dayFuelCost,
          cash: total + accumulatedFuelCost,
        });
      }
    }

    return accumulated;
  };

  const handleSaveExpenses = async () => {
    if (!user) return;

    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    const workDaysArray = workDays
      .map((isWorking, index) => (isWorking ? index : -1))
      .filter((index) => index !== -1);

    try {
      // Preparar expenses como JSON
      const expensesData = JSON.stringify(dailyExpenses);
      
      const workWeekResult = await createWorkWeekMutation.mutateAsync({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        workDays: JSON.stringify(workDaysArray),
        expenses: expensesData,
      });

      // Drizzle retorna [ResultSetHeader] com insertId
      const workWeekId = (workWeekResult as any)[0]?.insertId || (workWeekResult as any).insertId || 1;
      console.log('[handleSaveExpenses] workWeekId:', workWeekId, 'workWeekResult:', workWeekResult);

      for (const route of routes) {
        await createRouteMutation.mutateAsync({
          workWeekId,
          origin: route.origin,
          destination: route.destination,
          distance: Math.round(route.distance),
          dayOfWeek: 0,
        });
      }

      alert("Programação salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar programação");
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(14);
      doc.text("Programação de Despesas", pageWidth / 2, 12, { align: "center" });

      const dateFromObj = new Date(dateFrom + 'T00:00:00Z');
      const dateToObj = new Date(dateTo + 'T00:00:00Z');
      const dateFromStr = `${String(dateFromObj.getUTCDate()).padStart(2, '0')}/${String(dateFromObj.getUTCMonth() + 1).padStart(2, '0')}/${dateFromObj.getUTCFullYear()}`;
      const dateToStr = `${String(dateToObj.getUTCDate()).padStart(2, '0')}/${String(dateToObj.getUTCMonth() + 1).padStart(2, '0')}/${dateToObj.getUTCFullYear()}`;
      const dateRange = `${dateFromStr} a ${dateToStr}`;
      doc.setFontSize(9);
      doc.text(`Semana: ${dateRange}`, pageWidth / 2, 18, { align: "center" });
      if (user?.name) {
        doc.text(`Representante: ${user.name}`, pageWidth / 2, 23, { align: "center" });
      }

      const tableData: any[] = [];
      const headers = ["Categoria"];
      for (let i = 0; i < daysDifference; i++) {
        if (workDays[i]) {
          const date = new Date(dateFromObj.getTime() + i * 24 * 60 * 60 * 1000);
          const dayOfWeek = (date.getUTCDay() + 6) % 7;
          const dayName = DAYS_OF_WEEK[dayOfWeek];
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          headers.push(`${dayName}, ${day}/${month}`);
        }
      }
      headers.push("Total");

      categoriesQuery.data?.forEach((category) => {
        const row = [category.name];
        let weeklySum = 0;
        for (let i = 0; i < daysDifference; i++) {
          if (workDays[i]) {
            const value = dailyExpenses[i]?.[category.id] || 0;
            row.push(`R$ ${value.toFixed(2)}`);
            weeklySum += value;
          }
        }
        row.push(`R$ ${weeklySum.toFixed(2)}`);
        tableData.push(row);
      });

      // Adicionar linha de Deslocamento (ANTES do Total do Dia)
      const displacementRow: string[] = ["Deslocamento"];
      let totalFuel = 0;
      
      // Calcular deslocamento para cada dia - MESMO número de colunas que categorias
      for (let i = 0; i < daysDifference; i++) {
        if (workDays[i]) {  // <<<< CRITÍCO: SÓ adicionar se o dia estiver selecionado!
          const baseDate = new Date(dateFrom + 'T00:00:00Z');
          const currentDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
          const currentDateStr = currentDate.toISOString().split('T')[0];
          const dayRoutes = routes.filter((r) => r.dateOfRoute === currentDateStr);
          const dayFuelCost = dayRoutes.reduce((sum, route) => sum + calculateFuelCostPerRoute(route.distance), 0);
          displacementRow.push(`R$ ${dayFuelCost.toFixed(2)}`);
          totalFuel += dayFuelCost;
        }
      }
      displacementRow.push(`R$ ${totalFuel.toFixed(2)}`);
      
      console.log("=== DEBUG DESLOCAMENTO ===");
      console.log("Displacement Row:", displacementRow);
      console.log("Displacement Row Length:", displacementRow.length);
      console.log("Headers Length:", headers.length);
      console.log("Table Data Length before:", tableData.length);
      
      // GARANTIR que a linha seja adicionada
      tableData.push(displacementRow);
      
      console.log("Table Data Length after:", tableData.length);
      console.log("Last row added:", tableData[tableData.length - 1]);

      const totalsRow = ["Total do Dia"];
      let grandTotal = 0;
      for (let i = 0; i < daysDifference; i++) {
        if (workDays[i]) {
          const dayTotal = calculateDailyTotal(i);
          const baseDate = new Date(dateFrom + 'T00:00:00Z');
          const currentDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
          const currentDateStr = currentDate.toISOString().split('T')[0];
          const dayRoutes = routes.filter((r) => r.dateOfRoute === currentDateStr);
          const dayFuelCost = dayRoutes.reduce((sum, route) => sum + calculateFuelCostPerRoute(route.distance), 0);
          totalsRow.push(`R$ ${(dayTotal + dayFuelCost).toFixed(2)}`);
          grandTotal += dayTotal + dayFuelCost;
        }
      }
      totalsRow.push(`R$ ${grandTotal.toFixed(2)}`);
      tableData.push(totalsRow);

      // Adicionar linha de Projeção
      const projectionRow = ["Projeção"];
      let accumulation = 0;
      let accumulatedFuel = 0;
      for (let i = 0; i < daysDifference; i++) {
        if (workDays[i]) {
          accumulation += calculateDailyTotal(i);
          const baseDate = new Date(dateFrom + 'T00:00:00Z');
          const currentDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
          const currentDateStr = currentDate.toISOString().split('T')[0];
          const dayRoutes = routes.filter((r) => r.dateOfRoute === currentDateStr);
          const dayFuelCost = dayRoutes.reduce((sum, route) => sum + calculateFuelCostPerRoute(route.distance), 0);
          accumulatedFuel += dayFuelCost;
          projectionRow.push(`R$ ${(accumulation + accumulatedFuel).toFixed(2)}`);
        }
      }
      projectionRow.push(`R$ ${(accumulation + accumulatedFuel).toFixed(2)}`);
      tableData.push(projectionRow);

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 27,
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255], 
          fontStyle: "bold",
          fontSize: 8,
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: { 
          textColor: [0, 0, 0],
          fontSize: 8,
          halign: 'right',
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'left' } // Primeira coluna (Categoria) alinhada à esquerda
        },
        didParseCell: (data: any) => {
          // Penúltima linha: Total do Dia (cinza)
          if (data.row.index === tableData.length - 2) {
            data.cell.styles.fillColor = [200, 200, 200];
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
          // Última linha: Projeção (cinza claro - TODA a linha)
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = [220, 220, 220];
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 10, right: 10 },
      });

      let yPosition = (doc as any).lastAutoTable.finalY + 3;

      if (routes.length > 0) {
        doc.setFontSize(9);
        doc.text("Trajetos", 10, yPosition);
        yPosition += 1;

        const routeData = routes.map((r) => {
          const routeDate = r.dateOfRoute ? new Date(r.dateOfRoute + 'T00:00:00Z') : new Date();
          const dayOfWeek = (routeDate.getUTCDay() + 6) % 7;
          const day = String(routeDate.getUTCDate()).padStart(2, '0');
          const month = String(routeDate.getUTCMonth() + 1).padStart(2, '0');
          return [
            `${DAYS_OF_WEEK[dayOfWeek]}, ${day}/${month}`,
            r.origin,
            r.destination,
            `${r.distance.toFixed(2)} KM`,
            `R$ ${calculateFuelCostPerRoute(r.distance).toFixed(2)}`,
          ];
        });

        routeData.push([
          "",
          "",
          "Total",
          `${calculateTotalDistance().toFixed(2)} KM`,
          `R$ ${calculateFuelCost().toFixed(2)}`,
        ]);

        autoTable(doc, {
          head: [["Dia", "Origem", "Destino", "Distância", "Custo"]],
          body: routeData,
          startY: yPosition,
          theme: "grid",
          headStyles: { 
            fillColor: [245, 158, 11], 
            textColor: [0, 0, 0], 
            fontStyle: "bold",
            fontSize: 8,
            halign: 'center',
            valign: 'middle'
          },
          bodyStyles: {
            fontSize: 8,
            halign: 'center',
            valign: 'middle'
          },
          columnStyles: {
            1: { halign: 'left' }, // Origem
            2: { halign: 'left' }  // Destino
          },
          margin: { left: 10, right: 10 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 3;
      }

      doc.setFontSize(9);
      doc.text("Deslocamento", 10, yPosition);
      yPosition += 1;

      const displacementData = [
        ["Quilometragem Total", `${calculateTotalDistance()} KM`],
        ["Média KM/L", `${FUEL_CONFIG.kmPerLiter} KM/L`],
        ["Litros Necessários", `${calculateLiters().toFixed(2)} L`],
        ["Valor/Litro", `R$ ${FUEL_CONFIG.literPrice.toFixed(2)}`],
        ["Custo Total", `R$ ${calculateFuelCost().toFixed(2)}`],
      ];

      autoTable(doc, {
        head: [["Descrição", "Valor"]],
        body: displacementData,
        startY: yPosition,
        theme: "grid",
        headStyles: { 
          fillColor: [245, 158, 11], 
          textColor: [0, 0, 0], 
          fontStyle: "bold",
          fontSize: 8,
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 8,
          halign: 'right',
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'left' } // Descrição alinhada à esquerda
        },
        margin: { left: 10, right: 10 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 3;

      doc.setFontSize(9);
      doc.text("Resumo da Semana", 10, yPosition);
      yPosition += 1;

      const summaryData = [
        ["Total Despesas", `R$ ${calculateWeeklyTotal().toFixed(2)}`],
        ["Total Deslocamento", `R$ ${calculateFuelCost().toFixed(2)}`],
        ["TOTAL GERAL", `R$ ${(calculateWeeklyTotal() + calculateFuelCost()).toFixed(2)}`],
      ];

      autoTable(doc, {
        head: [["Descrição", "Valor"]],
        body: summaryData,
        startY: yPosition,
        theme: "grid",
        headStyles: { 
          fillColor: [16, 185, 129], 
          textColor: [255, 255, 255], 
          fontStyle: "bold",
          fontSize: 8,
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: { 
          fontStyle: "bold",
          fontSize: 8,
          halign: 'right',
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'left' } // Descrição alinhada à esquerda
        },
        margin: { left: 10, right: 10 },
      });

      doc.save(`Despesas_${weekStart.toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao exportar PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  // Formatar o intervalo de datas para exibição
  const dateRangeDisplay = `${String(dayFromCalc).padStart(2, '0')}/${String(monthFromCalc).padStart(2, '0')}/${yearFrom} a ${String(dayToCalc).padStart(2, '0')}/${String(monthToCalc).padStart(2, '0')}/${yearTo}`;
  const monthName = weekStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const dateRange = dateRangeDisplay;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
              <Button onClick={handleExportPDF} disabled={exporting} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{exporting ? "Exportando..." : "Exportar PDF"}</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Programação de Despesas</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {dateRange} • {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label className="text-xs font-medium text-gray-600">De:</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs font-medium text-gray-600">Até:</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Seleção de Dias de Trabalho */}
        <Card className="p-6 mb-6 bg-purple-50 border border-purple-200">
          <h2 className="text-lg font-semibold mb-4">Dias de Trabalho</h2>
          <p className="text-sm text-gray-600 mb-4">Selecione os dias que você vai trabalhar no período</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: daysDifference }).map((_, idx) => {
              const date = new Date(weekStart.getTime() + idx * 24 * 60 * 60 * 1000);
              // getDay() retorna 0 para domingo, 1 para segunda, etc.
              // Converter para índice do array DAYS_OF_WEEK (segunda=0, terça=1, ..., domingo=6)
              const dayOfWeek = (date.getDay() + 6) % 7;
              const dayName = DAYS_OF_WEEK[dayOfWeek];
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setWorkDays((prev) => {
                      const updated = [...prev];
                      if (idx < updated.length) {
                        updated[idx] = !updated[idx];
                      }
                      return updated;
                    });
                  }}
                  className={`p-3 rounded border-2 transition-all text-center whitespace-nowrap ${
                    workDays[idx]
                      ? "border-purple-600 bg-purple-100 text-purple-900 font-semibold"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  <div className="text-sm font-medium">{dayName}</div>
                  <div className="text-xs">{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Preenchimento Rápido */}
        <Card className="p-6 mb-6 bg-blue-50 border border-blue-200">
          <h2 className="text-lg font-semibold mb-4">Preenchimento Rápido por Categoria</h2>
          <p className="text-sm text-gray-600 mb-4">
            Insira o valor abaixo e clique em "Aplicar" para preencher todos os dias selecionados
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoriesQuery.data?.map((category) => (
              <div key={category.id}>
                <Label className="text-sm font-medium">{category.name}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={quickFillValues[category.id] || ""}
                    onChange={(e) => handleQuickFill(category.id, e.target.value)}
                    placeholder="0,00"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => applyQuickFill(category.id)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabela de Despesas */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Despesas Diárias</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left font-semibold">Categoria</th>
                  {Array.from({ length: daysDifference }).map((_, idx) => {
                    if (!workDays[idx]) return null;
                    const dateStr = dateFrom;
                    const baseDate = new Date(dateStr + 'T00:00:00Z');
                    const date = new Date(baseDate.getTime() + idx * 24 * 60 * 60 * 1000);
                    const dayOfWeek = (date.getUTCDay() + 6) % 7;
                    const dayName = DAYS_OF_WEEK[dayOfWeek];
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    return (
                      <th key={idx} className="border border-gray-300 p-3 text-center font-semibold">
                        <div className="text-sm">{dayName}</div>
                        <div className="text-xs text-gray-600">{day}/{month}</div>
                      </th>
                    );
                  })}
                  <th className="border border-gray-300 p-3 text-center font-semibold bg-yellow-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {categoriesQuery.data?.map((category) => {
                  const isFuelCategory = category.name.toLowerCase().includes('combust');
                  return (
                  <tr key={category.id}>
                    <td className="border border-gray-300 p-3 font-medium">{category.name}</td>
                    {Array.from({ length: daysDifference }).map((_, dayIndex) => {
                      if (!workDays[dayIndex]) return null;
                      
                      // Verificar se é fim de semana para Combustível
                      let isWeekend = false;
                      if (isFuelCategory) {
                        const dateStr = dateFrom;
                        const baseDate = new Date(dateStr + 'T00:00:00Z');
                        const date = new Date(baseDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
                        const dayOfWeek = (date.getUTCDay() + 6) % 7;
                        isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                      }
                      
                      return (
                        <td key={dayIndex} className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={dailyExpenses[dayIndex]?.[category.id] || ""}
                            onChange={(e) => handleExpenseChange(dayIndex, category.id, e.target.value)}
                            placeholder="0,00"
                            className="w-full text-center text-sm"
                            disabled={isWeekend}
                            title={isWeekend ? "Combustível não permitido em fins de semana" : ""}
                          />
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 p-3 text-center font-semibold bg-yellow-50">
                      R$ {Array.from({ length: daysDifference }, (_, i) => (workDays[i] ? dailyExpenses[i]?.[category.id] || 0 : 0)).reduce((a, b) => a + b, 0).toFixed(2)}
                    </td>
                  </tr>
                  );
                })}
                <tr className="bg-yellow-100 font-bold">
                  <td className="border border-gray-300 p-3">Total do Dia</td>
                  {Array.from({ length: daysDifference }).map((_, dayIndex) => {
                    if (!workDays[dayIndex]) return null;
                    return (
                      <td key={dayIndex} className="border border-gray-300 p-3 text-center">
                        R$ {calculateDailyTotal(dayIndex).toFixed(2)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 p-3 text-center bg-yellow-200">R$ {calculateWeeklyTotal().toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Projeção de Caixa */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
          <h2 className="text-xl font-semibold mb-4">Projeção de Caixa (Verba Necessária)</h2>
          <p className="text-sm text-gray-600 mb-4">Quanto o representante precisa ter em mãos (despesas + deslocamento)</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-100">
                  <th className="border border-red-300 p-3 text-left font-semibold">Dia</th>
                  <th className="border border-red-300 p-3 text-left font-semibold">Data</th>
                  <th className="border border-red-300 p-3 text-right font-semibold">Despesas Acumuladas</th>
                  <th className="border border-red-300 p-3 text-right font-semibold">+ Deslocamento</th>
                  <th className="border border-red-300 p-3 text-right font-semibold bg-red-200">Total em Caixa</th>
                </tr>
              </thead>
              <tbody>
                {calculateAccumulatedCosts().map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-red-50"}>
                    <td className="border border-red-300 p-3">{item.day}</td>
                    <td className="border border-red-300 p-3">{item.date}</td>
                    <td className="border border-red-300 p-3 text-right">R$ {item.accumulated.toFixed(2)}</td>
                    <td className="border border-red-300 p-3 text-right">R$ {item.dayFuelCost.toFixed(2)}</td>
                    <td className="border border-red-300 p-3 text-right font-bold bg-red-100">R$ {item.cash.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Seção de Trajetos */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Trajetos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium">Data do Trajeto</Label>
              <Input
                type="date"
                value={newRoute.dateOfRoute || ""}
                onChange={(e) => {
                  setNewRoute({ ...newRoute, dateOfRoute: e.target.value })
                }}
                className="w-full mt-1"
                min={dateFrom}
                max={dateTo}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Origem</Label>
              <Input
                value={newRoute.origin}
                onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                placeholder="Ex: Uberaba"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Destino</Label>
              <Input
                value={newRoute.destination}
                onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                placeholder="Ex: Parauapebas"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Quilômetros</Label>
              <Input
                type="number"
                step="0.1"
                value={newRoute.distance}
                onChange={(e) => setNewRoute({ ...newRoute, distance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addRoute} className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {routes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Data</th>
                    <th className="border border-gray-300 p-3 text-left">Origem</th>
                    <th className="border border-gray-300 p-3 text-left">Destino</th>
                    <th className="border border-gray-300 p-3 text-center">Quilômetros</th>
                    <th className="border border-gray-300 p-3 text-center">Custo</th>
                    <th className="border border-gray-300 p-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-3">{route.dateOfRoute ? new Date(route.dateOfRoute + 'T00:00:00Z').toLocaleDateString("pt-BR") : ""}</td>
                      <td className="border border-gray-300 p-3">{route.origin}</td>
                      <td className="border border-gray-300 p-3">{route.destination}</td>
                      <td className="border border-gray-300 p-3 text-center">{route.distance.toFixed(2)} KM</td>
                      <td className="border border-gray-300 p-3 text-center font-semibold">R$ {calculateFuelCostPerRoute(route.distance).toFixed(2)}</td>
                      <td className="border border-gray-300 p-3 text-center">
                        <Button
                          onClick={() => removeRoute(route.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 font-bold">
                    <td colSpan={3} className="border border-gray-300 p-3">
                      Total
                    </td>
                    <td className="border border-gray-300 p-3 text-center">{calculateTotalDistance().toFixed(2)} KM</td>
                    <td className="border border-gray-300 p-3 text-center">R$ {calculateFuelCost().toFixed(2)}</td>
                    <td className="border border-gray-300 p-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Seção de Deslocamento */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Deslocamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-600">Litros Necessários</p>
              <p className="text-3xl font-bold text-blue-600">{calculateLiters().toFixed(2)} L</p>
            </div>
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-gray-600">Custo Total</p>
              <p className="text-3xl font-bold text-green-600">R$ {calculateFuelCost().toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Configuração</p>
              <p className="text-sm font-medium">{FUEL_CONFIG.kmPerLiter} KM/L • R$ {FUEL_CONFIG.literPrice}/L</p>
            </div>
          </div>
        </Card>

        {/* Resumo da Semana */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <h2 className="text-xl font-semibold mb-4">Resumo da Semana</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Despesas</p>
              <p className="text-3xl font-bold text-gray-900">R$ {calculateWeeklyTotal().toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Deslocamento</p>
              <p className="text-3xl font-bold text-gray-900">R$ {calculateFuelCost().toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Geral</p>
              <p className="text-3xl font-bold text-gray-900">R$ {(calculateWeeklyTotal() + calculateFuelCost()).toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSaveExpenses} disabled={createExpenseMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {createExpenseMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            Salvar Programação
          </Button>
          <Button onClick={handleExportPDF} disabled={exporting} className="flex-1 bg-green-600 hover:bg-green-700">
            {exporting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? "Exportando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
