import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Calendar, DollarSign, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-16 h-16 mx-auto mb-6" />}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{APP_TITLE}</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md">
              Gerencie suas despesas semanais de forma simples e eficiente
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl">
              <Card className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold mb-2">Planejamento Semanal</h3>
                <p className="text-sm text-gray-600">Organize suas despesas por dia da semana</p>
              </Card>

              <Card className="p-6 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-2">Cálculos Automáticos</h3>
                <p className="text-sm text-gray-600">Totais diários e semanais calculados automaticamente</p>
              </Card>

              <Card className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold mb-2">Deslocamento</h3>
                <p className="text-sm text-gray-600">Controle de combustível e reembolso de KM</p>
              </Card>
            </div>

            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Fazer Login
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8" />}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Olá, {user?.name || "Usuário"}</span>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <Calendar className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">Programar Despesas</h2>
            <p className="text-gray-600 mb-6">
              Crie uma nova programação de despesas para a semana. Preencha as despesas diárias, deslocamento e gere um resumo completo.
            </p>
            <Link href="/expenses">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Ir para Programação
              </Button>
            </Link>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">Histórico</h2>
            <p className="text-gray-600 mb-6">
              Visualize suas programações anteriores, acompanhe o histórico de despesas e analise tendências ao longo do tempo.
            </p>
            <Link href="/history">
              <Button variant="outline" className="w-full">
                Ver Histórico
              </Button>
            </Link>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">Relatórios</h2>
            <p className="text-gray-600 mb-6">
              Analise seus gastos por período, visualize total de KM percorridos e gastos por categoria com gráficos.
            </p>
            <Link href="/reports">
              <Button variant="outline" className="w-full">
                Ver Relatórios
              </Button>
            </Link>
          </Card>
        </div>

        <Card className="mt-8 p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold mb-4">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-semibold mb-2">Preencha as Despesas</h3>
              <p className="text-gray-600">
                Insira os valores de hospedagem, alimentação, combustível e diárias para cada dia da semana.
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="font-semibold mb-2">Registre o Deslocamento</h3>
              <p className="text-gray-600">
                Informe a quilometragem, consumo de combustível e valores para cálculo automático de reembolso.
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="font-semibold mb-2">Salve e Exporte</h3>
              <p className="text-gray-600">
                Salve sua programação no sistema e exporte em PDF para enviar ao gestor ou contabilidade.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
