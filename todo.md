# Planejador de Despesas - TODO

## Funcionalidades Principais

- [x] Definir modelo de dados (tabelas de despesas, categorias, periodos)
- [x] Implementar interface de entrada de despesas semanais (Segunda a Domingo)
- [x] Implementar categorias de despesas (Hospedagem, Alimentacao, Combustivel, Diarias/Balsa)
- [x] Implementar calculo automatico de total diario
- [x] Implementar calculo automatico de total semanal
- [x] Implementar secao de deslocamento (KM/L, Distancia, Litros, Valor/Litro)
- [x] Implementar secao de trajeto com calculo de reembolso
- [x] Implementar dashboard com resumo semanal
- [ ] Implementar edicao e exclusao de despesas
- [x] Implementar autenticacao de representantes
- [x] Implementar controle de acesso por usuario
- [x] Implementar campo de preenchimento automatico por categoria
- [x] Simplificar calculo de combustivel (apenas KM como entrada)
- [x] Implementar exportacao em PDF
- [x] Testar funcionalidades principais
- [x] Revisar design e UX

## Ajustes Solicitados

- [x] Adicionar data do mês na exibição da semana
- [x] Implementar seleção de dias de trabalho (checkboxes)
- [x] Implementar seção de trajetos com origem, destino e quilometragem
- [x] Implementar projeção de custos acumulados ao longo da semana
- [x] Atualizar schema do banco com tabelas workWeeks e routes
- [x] Implementar rotas tRPC para workWeeks e routes
- [x] Testar todas as funcionalidades novas

## Novos Ajustes Solicitados

- [x] Implementar projeção de caixa (quanto o representante precisa ter em mãos)
- [x] Mostrar custo individual de cada trajeto no relatório PDF
- [x] Implementar seletor de data flexível com calendário
- [x] Permitir programações que atravessam múltiplas semanas

## Correções Necessárias

- [x] Corrigir projeção de caixa: deslocamento deve aparecer apenas nos dias que ocorre
- [x] Adicionar linha de PROJEÇÃO no PDF com valores acumulados de despesas
- [x] Ajustar cálculo de "Total em Caixa" para acumular despesas + deslocamento do dia

## Novos Ajustes

- [x] Implementar seletor de data de intervalo (data de: X até data: Y)
- [x] Permitir seleção de datas futuras (30, 60+ dias)
- [x] Remover calendário automático e deixar apenas seleção manual

## Novos Ajustes Solicitados

- [x] Mudar relatório PDF para orientação paisagem
- [x] Adicionar dia da semana no cabeçalho das colunas (ex: Sábado, 22/11/25)
- [x] Colorir linha de PROJEÇÃO com fundo cinza no PDF
- [ ] Adicionar campo para inserir valor do combustível manualmente
- [x] Remover seletor de dia da semana para trajetos
- [ ] Adicionar campo de Observações no final do formulário

## Bugs e Melhorias

- [x] Corrigir calendário para usar localização brasileira (pt-BR)
- [x] Seção "Dias de Trabalho": 22/11 está sendo mostrado como Domingo em vez de Sábado
- [x] Garantir que as datas exibidas na tabela sejam exatamente as selecionadas
- [x] Corrigir relatório PDF para mostrar as datas exatas selecionadas (21/11 a 30/11)
- [x] Corrigir cálculo de dia da semana: 22/11/25 (sábado) está sendo mostrado como sexta
- [x] Ajustar tabela de despesas para mostrar datas reais em vez de DAYS_OF_WEEK genéricos
- [x] Corrigir erro "Invalid array length" ao selecionar datas com grande intervalo
- [x] Corrigir tabela de despesas para mostrar exatamente a quantidade de dias selecionados
- [x] Ajustar cálculos para respeitar o período real selecionado (não apenas 7 dias)
- [x] Alterar seletor de trajeto: de dia da semana para data específica do mês
- [x] Sincronizar tabela de despesas com as datas selecionadas no calendário
- [x] Corrigir inconsistência: tabela de despesas estava usando cálculo diferente dos botões de seleção
- [x] Corrigir cálculo de dia da semana no relatório PDF (cabeçalho da tabela de despesas)
- [x] Corrigir cálculo de dia da semana na tabela de trajetos do PDF
- [x] Corrigir cálculo de dia da semana na seção "Projeção de Caixa" do PDF
- [x] Corrigir seção "Projeção de Caixa" para mostrar todos os dias do período selecionado (não apenas 7)
- [x] Formatar linhas "Total do Dia" (cinza) e "PROJEÇÃO" (amarelo) no PDF
- [x] Corrigir cálculo de deslocamento acumulado na seção "Projeção de Caixa"
- [x] Corrigir linha de PROJEÇÃO no PDF para somar deslocamento exatamente na data inserida

## Otimização Mobile

- [x] Ajustar layout da página ExpenseForm para mobile
- [x] Tornar tabelas scrolláveis horizontalmente em telas pequenas
- [x] Melhorar espaçamento e tamanho de botões para toque
- [x] Otimizar seletor de datas para mobile
- [x] Ajustar cards e seções para empilhamento vertical em mobile
- [x] Testar responsividade em diferentes tamanhos de tela

## Bugs Reportados

- [x] Preenchimento rápido não está copiando valores para todos os dias selecionados

## Melhorias Solicitadas

- [x] RESOLVIDO: Linha "Deslocamento" aparece corretamente no PDF após correção do workDays[i]
- [x] Testado diretamente no navegador e PDF gerado com sucesso
- [x] Estrutura implementada: Alimentação, Combustível, Diárias/Balsa, Hospedagem, Deslocamento (R$ 875.00), Total do Dia, PROJEÇÃO

## Bugs Reportados - Nova Correção

- [x] RESOLVIDO: Somas não batiam porque calculateWeeklyTotal estava hardcoded com 7 dias
- [x] Corrigido para usar daysDifference em vez de 7
- [x] Agora o Total Despesas no Resumo soma todos os dias do período selecionado

## Melhorias Solicitadas - Novas

- [x] Linha Combustível: não inserir valores nos sábados e domingos (apenas dias úteis)
- [x] Campos de Combustível desabilitados em fins de semana na tabela
- [x] Preenchimento rápido de Combustível pula sábados e domingos automaticamente
- [x] Alterar "PROJEÇÃO" para "Projeção" (capitalização normal)

## Bug de Layout PDF

- [x] Título "Deslocamento" está sendo separado de sua tabela (aparece na página 1, tabela na página 2)
- [x] Adicionar propriedade para manter título e tabela juntos na mesma página

## Ajustes de Layout PDF - Títulos das Seções

- [x] Integrar títulos das seções (Trajetos, Deslocamento, Resumo) diretamente nas tabelas
- [x] Eliminar espaçamento visual excessivo entre títulos e tabelas
- [x] Fazer títulos aparecerem como parte da própria tabela (header ou linha especial)

## Implementação de Histórico

- [x] Criar página de Histórico (/history)
- [x] Implementar rota no App.tsx para a página de Histórico
- [x] Criar procedimento tRPC para listar todas as programações salvas do usuário
- [x] Implementar interface de listagem com cards de programações
- [x] Adicionar filtros por data (período)
- [x] Adicionar busca por representante ou período
- [x] Adicionar ordenação (mais recentes/mais antigas)
- [x] Contador de resultados filtrados
- [ ] Implementar visualização de detalhes de cada programação
- [ ] Adicionar botão para exportar PDF de programações antigas
- [ ] Adicionar opção para editar/duplicar programação existente

## Correção - Carregamento de Programações Salvas

- [x] Implementar carregamento de dados completos ao acessar programação do histórico
- [x] Carregar despesas salvas (expenses JSON)
- [x] Carregar trajetos salvos (trips JSON)
- [x] Carregar dias trabalhados (workDays JSON)
- [x] Preencher formulário automaticamente com dados carregados
- [x] Corrigir problema de timezone no carregamento de datas
- [x] Corrigir procedimento tRPC getById para aceitar número diretamente
- [ ] Adicionar indicador visual de que está visualizando programação salva
- [ ] Permitir editar programação existente ou criar nova versão

## Nova Abordagem - Salvar Despesas como JSON
- [x] Adicionar campo `expenses` (JSON) na tabela workWeeks
- [x] Modificar função de salvamento para salvar despesas como JSON
- [x] Modificar função de carregamento para ler despesas do JSON
- [x] Testar salvamento e carregamento completo
- [x] Corrigir useEffect de inicialização para não sobrescrever dados carregados


## Modificação do Histórico - Visualização de PDFs

- [x] Remover botão "Ver Detalhes" que carrega dados no formulário
- [x] Adicionar botão "Baixar PDF" para cada programação no histórico
- [x] Implementar geração de PDF de programações antigas (via redirect com parâmetro pdf=true)
- [x] Permitir visualizar/exportar PDFs diretamente do histórico
## Nova Página - Gráficos e Relatórios

- [x] Criar nova página de Gráficos/Relatórios (/reports)
- [x] Adicionar rota no App.tsx para a página de Relatórios
- [x] Adicionar card na Home para acessar Relatórios
- [x] Implementar filtros por período (data inicial e final)
- [x] Adicionar botão "Último Mês" para facilitar filtro
- [x] Criar procedimento tRPC para listar todas as workWeeks do usuário
- [x] Criar procedimento tRPC para listar todos os trajetos (routes) do usuário
- [x] Implementar métrica: Total de KM percorridos no período
- [x] Implementar métrica: Gastos por categoria (Hospedagem, Alimentação, Combustível, Diárias)
- [x] Adicionar cards com resumo numérico das métricas principais
- [x] Exibir gastos por categoria com barras de progresso e percentuais
- [x] Corrigir salvamento de workWeekId nas rotas
- [x] Corrigir campo de distância (usar `distance` em vez de `kilometers`)
- [x] Remover multiplicação por 100 no salvamento de distância
- [ ] Criar gráfico de evolução de gastos ao longo do tempo (opcional)
- [ ] Criar gráfico de distribuição de gastos por categoria em pizza (opcional)
- [ ] Implementar comparativo entre períodos (opcional)


## Ajuste de Larguras de Colunas no PDF
- [x] Reduzir largura das colunas dos dias da semana
- [x] Aumentar largura da coluna "Total"
- [x] Garantir que não haja quebra de linha na coluna "Total"
- [x] Testar com valores grandes para validar que tudo fica em uma página

## Correção de Quebra de Página para Períodos Longos
- [x] Corrigir quebra de página no PDF para períodos de 12+ dias
- [x] Reduzir espaçamentos entre seções de 3mm para 1.5mm
- [x] Reduzir cellPadding de todas as tabelas de 2 para 1.5
- [ ] Testar com período de 12 dias (14/01 a 25/01) - aguardando validação do usuário

## Melhorias na Página de Histórico
- [x] Implementar ordenação por data de criação (mais recentes primeiro)
- [x] Melhorar layout visual dos cards de programação
- [x] Adicionar informações de valores totais nos cards
- [x] Aprimorar filtros de busca e período
- [x] Implementar funcionalidade de editar programação existente
- [x] Implementar funcionalidade de duplicar programação
- [x] Implementar funcionalidade de excluir programação
- [x] Adicionar confirmação antes de excluir
