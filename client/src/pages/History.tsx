import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, FileText, Filter, Loader2, TrendingUp, X, Edit, Copy, Trash2, DollarSign, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const { data: workWeeks, isLoading } = trpc.workWeeks.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteMutation = trpc.workWeeks.delete.useMutation({
    onSuccess: () => {
      toast.success("Programação excluída com sucesso!");
      utils.workWeeks.list.invalidate();
    },
    onError: () => {
      toast.error("Erro ao excluir programação");
    },
  });

  const duplicateMutation = trpc.workWeeks.duplicate.useMutation({
    onSuccess: (newWorkWeek) => {
      toast.success("Programação duplicada com sucesso!");
      utils.workWeeks.list.invalidate();
      if (newWorkWeek) {
        setLocation(`/expenses?id=${newWorkWeek.id}`);
      }
    },
    onError: () => {
      toast.error("Erro ao duplicar programação");
    },
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Extrair anos e meses disponíveis
  const availableYears = useMemo(() => {
    if (!workWeeks) return [];
    const years = new Set(workWeeks.map(week => new Date(week.weekStartDate).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [workWeeks]);

  const availableMonths = useMemo(() => {
    return [
      { value: "0", label: "Janeiro" },
      { value: "1", label: "Fevereiro" },
      { value: "2", label: "Março" },
      { value: "3", label: "Abril" },
      { value: "4", label: "Maio" },
      { value: "5", label: "Junho" },
      { value: "6", label: "Julho" },
      { value: "7", label: "Agosto" },
      { value: "8", label: "Setembro" },
      { value: "9", label: "Outubro" },
      { value: "10", label: "Novembro" },
      { value: "11", label: "Dezembro" },
    ];
  }, []);

  // Filtrar e ordenar programações
  const filteredWorkWeeks = useMemo(() => {
    if (!workWeeks) return [];

    let filtered = [...workWeeks];

    // Filtro por busca (ID ou data)
    if (searchTerm) {
      filtered = filtered.filter(week => {
        const idMatch = week.id.toString().includes(searchTerm);
        const start = new Date(week.weekStartDate);
        const end = new Date(week.weekEndDate);
        let dateRangeStr = "";
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
          dateRangeStr = `${start.getDate()} a ${end.getDate()} de ${start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
        } else {
          dateRangeStr = `${start.toLocaleDateString("pt-BR")} a ${end.toLocaleDateString("pt-BR")}`;
        }
        const dateMatch = dateRangeStr.toLowerCase().includes(searchTerm.toLowerCase());
        return idMatch || dateMatch;
      });
    }

    // Filtro por mês
    if (selectedMonth !== "all") {
      filtered = filtered.filter(week => {
        const weekMonth = new Date(week.weekStartDate).getMonth();
        return weekMonth === parseInt(selectedMonth);
      });
    }

    // Filtro por ano
    if (selectedYear !== "all") {
      filtered = filtered.filter(week => {
        const weekYear = new Date(week.weekStartDate).getFullYear();
        return weekYear === parseInt(selectedYear);
      });
    }

    // Ordenação por data de criação
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [workWeeks, searchTerm, selectedMonth, selectedYear, sortOrder]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedMonth("all");
    setSelectedYear("all");
    setSortOrder("desc");
  };

  const hasActiveFilters = searchTerm || selectedMonth !== "all" || selectedYear !== "all" || sortOrder !== "desc";

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta programação? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate(id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Você precisa estar autenticado para acessar o histórico de programações.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Fazer Login</a>
          </Button>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} a ${end.getDate()} de ${start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
    }
    
    return `${formatDate(start)} a ${formatDate(end)}`;
  };

  const getDaysDifference = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                ← Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Histórico de Programações</h2>
          <p className="text-gray-600">
            Visualize todas as suas programações de despesas anteriores
          </p>
        </div>

        {/* Filtros */}
        {workWeeks && workWeeks.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-lg">Filtros</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar
                </label>
                <Input
                  type="text"
                  placeholder="Buscar por ID ou data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro de Mês */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mês
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Ano */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ano
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ordenação */}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-2">
                <Button
                  variant={sortOrder === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOrder("desc")}
                >
                  Mais Recentes
                </Button>
                <Button
                  variant={sortOrder === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOrder("asc")}
                >
                  Mais Antigas
                </Button>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 text-sm text-gray-600">
              Exibindo {filteredWorkWeeks.length} de {workWeeks.length} programações
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredWorkWeeks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkWeeks.map((week) => {
              const workDaysArray = JSON.parse(week.workDays || "[]");
              const workDaysCount = workDaysArray.filter((day: boolean) => day).length;
              const totalDays = getDaysDifference(week.weekStartDate, week.weekEndDate);

              // Calculate totals from expenses JSON
              let totalExpenses = 0;
              try {
                const expensesData = JSON.parse(week.expenses || "{}");
                Object.values(expensesData).forEach((dayExpenses: any) => {
                  if (typeof dayExpenses === 'object') {
                    Object.values(dayExpenses).forEach((value: any) => {
                      totalExpenses += Number(value) || 0;
                    });
                  }
                });
              } catch (e) {
                // Ignore parse errors
              }

              return (
                <Card key={week.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-sm text-gray-500">
                        Programação #{week.id}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(week.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-3">
                    {formatDateRange(week.weekStartDate, week.weekEndDate)}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>
                        {workDaysCount} de {totalDays} dias trabalhados
                      </span>
                    </div>
                    {totalExpenses > 0 && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          R$ {totalExpenses.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/expenses?id=${week.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/expenses?id=${week.id}&pdf=true`}>
                          <FileText className="w-4 h-4 mr-2" />
                          PDF
                        </Link>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDuplicate(week.id)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(week.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : workWeeks && workWeeks.length > 0 ? (
          <Card className="p-12 text-center">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma programação encontrada</h3>
            <p className="text-gray-600 mb-6">
              Nenhuma programação corresponde aos filtros aplicados.
            </p>
            <Button onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma programação encontrada</h3>
            <p className="text-gray-600 mb-6">
              Você ainda não criou nenhuma programação de despesas.
            </p>
            <Button asChild>
              <Link href="/expenses">Criar Nova Programação</Link>
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
