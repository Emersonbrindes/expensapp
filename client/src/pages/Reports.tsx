import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { BarChart3, Calendar, Loader2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function Reports() {
  const { user, loading: authLoading } = useAuth();
  const { data: workWeeks, isLoading: workWeeksLoading } = trpc.workWeeks.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: allRoutes, isLoading: routesLoading } = trpc.routes.listAll.useQuery(undefined, {
    enabled: !!user,
  });

  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calcular estatísticas baseadas no período filtrado
  const statistics = useMemo(() => {
    if (!workWeeks || !categories || !allRoutes) return null;

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    // Filtrar workWeeks no período
    const filteredWeeks = workWeeks.filter(week => {
      const weekStart = new Date(week.weekStartDate);
      const weekEnd = new Date(week.weekEndDate);
      return (weekStart >= fromDate && weekStart <= toDate) || 
             (weekEnd >= fromDate && weekEnd <= toDate) ||
             (weekStart <= fromDate && weekEnd >= toDate);
    });

    let totalKm = 0;
    const categoryTotals: Record<number, number> = {};
    
    // Inicializar totais por categoria
    categories.forEach(cat => {
      categoryTotals[cat.id] = 0;
    });

    // IDs das workWeeks filtradas
    const filteredWeekIds = new Set(filteredWeeks.map(w => w.id));

    // Calcular KM dos trajetos
    allRoutes.forEach((route: any) => {
      if (filteredWeekIds.has(route.workWeekId)) {
        totalKm += route.distance || 0;
      }
    });

    // Processar despesas
    filteredWeeks.forEach(week => {
      if (week.expenses) {
        try {
          const expenses = JSON.parse(week.expenses);
          Object.values(expenses).forEach((dayExpenses: any) => {
            Object.entries(dayExpenses).forEach(([catId, value]) => {
              const categoryId = parseInt(catId);
              if (categoryTotals[categoryId] !== undefined) {
                categoryTotals[categoryId] += Number(value) || 0;
              }
            });
          });
        } catch (e) {
          console.error('Erro ao parsear expenses:', e);
        }
      }
    });

    // Calcular total geral
    const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    return {
      totalKm,
      categoryTotals,
      totalExpenses,
      weekCount: filteredWeeks.length,
    };
  }, [workWeeks, categories, allRoutes, dateFrom, dateTo]);

  if (authLoading || workWeeksLoading || routesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Você precisa estar logado para ver os relatórios.</p>
      </div>
    );
  }

  const handleSetLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    setDateFrom(lastMonth.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Voltar
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Relatórios e Estatísticas
          </h1>
          <p className="text-muted-foreground">
            Analise seus gastos e quilometragem por período
          </p>
        </div>

        {/* Filtros de Período */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Período de Análise</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Inicial</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Data Final</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleSetLastMonth} variant="outline" className="w-full">
                Último Mês
              </Button>
            </div>
          </div>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Programações</span>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{statistics?.weekCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">no período selecionado</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Quilometragem</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{statistics?.totalKm || 0} KM</div>
            <p className="text-xs text-muted-foreground mt-1">percorridos</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total de Despesas</span>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(statistics?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">no período</p>
          </Card>
        </div>

        {/* Gastos por Categoria */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Gastos por Categoria</h2>
          
          <div className="space-y-4">
            {categories?.map(category => {
              const total = statistics?.categoryTotals[category.id] || 0;
              const percentage = statistics?.totalExpenses 
                ? (total / statistics.totalExpenses) * 100 
                : 0;

              return (
                <div key={category.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{category.name}</span>
                    <span className="font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% do total
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
