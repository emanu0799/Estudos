# SDD - Academia de Estudos

## 1. Proposito

Construir uma plataforma pessoal de estudo que funcione para qualquer assunto,
comecando por legislacao municipal e concursos. O produto deve transformar fontes
em estudo ativo, registrar desempenho real e decidir o que revisar hoje.

Regra principal: nenhuma funcionalidade entra sem ter uma necessidade de estudo,
um dado de origem e um criterio de aceite definidos.

## 2. Produto inicial e expansao

Usuario inicial: uma pessoa estudando para concurso de Fiscal de Obras de
Balneario Picarras.

Materias iniciais:

- Codigo de Obras - LC 231/2023.
- Plano Diretor - LC 163/2019 e alteracoes, com foco na LC 285/2026.
- Direito Constitucional, quando o recorte do edital estiver confirmado.

O mesmo ambiente deve servir, sem uma versao paralela do produto, para:

- disciplinas de graduacao e pos-graduacao;
- outros concursos e certificacoes;
- idiomas, cursos livres e estudo profissional;
- materiais proprios, como anotacoes, slides, listas e provas antigas.

Fiscal de Obras e a primeira trilha de conteudo. A materia nunca define as
regras centrais da plataforma, os nomes das entidades nem limita os tipos de
fonte aceitos.

Resultados que o produto precisa gerar:

1. Saber exatamente o que estudar hoje.
2. Localizar a fonte legal de toda resposta e explicacao.
3. Retomar automaticamente erros e pontos fracos.
4. Medir dominio por topico, nao apenas quantidade de horas ou questoes.

## 3. Principios de arquitetura

- Fonte antes de IA: todo resumo, flashcard e questao deve apontar para uma
  fonte, artigo ou pagina de origem.
- Estudo ativo antes de leitura passiva: a base do produto e recuperar a
  informacao, receber correcao e revisar no momento certo.
- Estrutura universal: Materia > Modulo > Topico > Fonte > Item de estudo.
- Dados do usuario sao persistentes e exportaveis; interface local nao e fonte
  de verdade para desempenho, erros ou revisoes.
- Entregas pequenas e fechadas: cada fase deve compilar, funcionar e ter um
  criterio de aceite antes da proxima.
- Sem duplicar conteudo: uma fonte pode gerar diversos itens de estudo, mas a
  referencia de origem e unica.

## 4. Decisoes ja tomadas

| Tema | Decisao | Motivo |
| --- | --- | --- |
| Interface | Next/React no projeto atual | Base ja criada e publicada. |
| Sistema visual | Academia de Estudos, editorial tecnico | Mantem foco e leitura confortavel em qualquer materia. |
| Conteudo | Fonte > topico > item | Permite usar leis, PDFs, apostilas e provas. |
| Identidade | Supabase Auth | Login e dados pessoais fora do frontend. |
| Banco | Supabase Postgres | Relacoes, busca e historico de estudo. |
| Arquivos | Supabase Storage | PDFs, anexos e futuros materiais enviados. |
| Repositorio | GitHub | Fonte de verdade do codigo e revisoes. |
| Producao futura | Vercel | Deploy por branch e preview de mudancas. |

Nota: a hospedagem atual e apenas o ambiente de demonstracao. A migracao para
GitHub + Vercel + Supabase sera feita depois do nucleo local estar fechado.

## 5. Modelo de dominio

```text
Usuario
  -> Perfil de estudo
  -> Materia
       -> Modulo
            -> Topico
                 -> Fonte (PDF, lei, prova, anotacao)
                 -> Item de estudo (resumo, flashcard, questao, caso)
  -> Tentativa de resposta
       -> Agenda de revisao
  -> Registro de erro
```

Entidades planejadas para o banco:

- profiles
- subjects
- modules
- topics
- sources
- source_sections
- study_items
- questions
- question_options
- attempts
- review_cards
- review_events
- error_notes
- study_sessions

## 6. Regras do motor de estudo

### Revisao

- Erro: retorna em 1, 3, 7, 15 e 30 dias.
- Acerto com dificuldade: retorna em intervalo curto.
- Acerto seguro: aumenta o intervalo gradualmente.
- Uma revisao nunca desaparece sem registro de resposta.

### Questoes

- Cada questao deve ter enunciado, resposta, explicacao, dificuldade, topico e
  fonte.
- Alternativas erradas devem representar pegadinhas plausiveis, nao erros
  evidentes.
- O usuario pode marcar a questao como duvidosa ou contestar a explicacao.

### Fontes legislativas

- Lei original e alteracoes sao fontes separadas.
- Texto consolidado e marcado como derivado, com data de atualizacao.
- Artigos alterados, revogados ou vetados recebem status explicito.

## 7. Roadmap por prioridade

### Fase 0 - Fundacao e contrato do produto

Entrega: este SDD, estrutura de projeto e convencoes de dados.

Aceite: toda nova funcionalidade deve referenciar uma secao deste documento ou
propor uma decisao nova antes de ser feita.

### Fase 1 - Biblioteca confiavel

Entrega:

- Navegacao por materia, modulo e topico.
- Cadastro de fontes e secoes/artigos.
- Codigo de Obras e revisao do Plano Diretor organizados integralmente.
- Busca por artigo, termo e assunto.

Aceite: localizar qualquer artigo cadastrado em ate tres interacoes e abrir sua
fonte correspondente.

### Fase 2 - Estudo ativo

Entrega:

- Questoes de multipla escolha e verdadeiro/falso.
- Flashcards e respostas explicadas.
- Caderno de erros automatico.
- Primeiro algoritmo de revisao espacada.

Aceite: uma resposta altera o historico, atualiza o caderno de erros quando
necessario e agenda a proxima revisao.

### Fase 3 - Plano diario e desempenho

Entrega:

- Tela Hoje baseada em revisoes pendentes e metas.
- Evolucao por materia, topico e tipo de erro.
- Simulado com tempo e correcao.

Aceite: o painel indica claramente a proxima melhor acao de estudo e justifica
a prioridade.

### Fase 3.1 - Multimateria

Entrega:

- Seletor de materia e objetivo de estudo.
- Criacao de materias pessoais, por exemplo "Calculo I" ou "Direito Penal".
- Painel Hoje que combina revisoes de todas as materias sem misturar fontes.
- Indicadores separados por materia, modulo e periodo.

Aceite: o usuario alterna de concurso para faculdade sem perder materiais,
historico, agenda ou rastreabilidade de cada fonte.

### Fase 4 - Conteudo assistido

Entrega:

- Importacao de PDF e criacao assistida de topicos, resumos e questoes.
- Revisao humana antes de publicar itens no banco pessoal.
- Comparacao entre alteracoes legislativas.

Aceite: nenhum conteudo gerado perde o vinculo com a fonte original.

#### Pipeline de importacao e qualidade

1. O arquivo e armazenado de forma privada e vinculado a uma materia.
2. A extracao cria trechos com pagina, titulo e texto de origem.
3. A IA recebe apenas trechos selecionados e devolve rascunhos estruturados.
4. Um validador confere fonte, alternativa correta unica, explicacao e
   duplicidade antes de publicar.
5. O usuario pode editar, aprovar ou descartar cada lote.

O agendamento, historico e calculo de desempenho nunca dependem de IA. A IA
apenas sugere estrutura e conteudo, e cada sugestao permanece auditavel.

### Fase 5 - Plataforma completa

Entrega:

- Login, sincronizacao e backup.
- GitHub como repositorio do codigo.
- Supabase para autenticacao, dados e arquivos.
- Vercel para producao e previews por pull request.

Aceite: o usuario entra em outro dispositivo e encontra o mesmo progresso,
materiais e agenda de revisoes.

## 8. Ordem tecnica de implementacao

1. Fechar Fase 1 com dados locais tipados e telas reais.
2. Definir contratos TypeScript para todas as entidades antes de criar telas
   adicionais.
3. Introduzir Supabase somente quando a Fase 2 precisar guardar respostas,
   revisoes e erros de forma duravel.
4. Criar repositorio GitHub antes da primeira migracao de banco.
5. Configurar Vercel depois que o repositorio e os ambientes estiverem estaveis.
6. Cada alteracao de banco vem com migration, dados de exemplo e criterio de
   rollback.

## 9. Fora de escopo agora

- Rede social, ranking publico ou gamificacao decorativa.
- Geracao massiva de milhares de questoes antes de validar qualidade.
- Aplicativo mobile nativo.
- Publicacao de conteudo juridico sem fonte ou revisao.

## 10. Proxima entrega

Fase 3.1: criar a camada de materias e objetivos no aplicativo. A trilha Fiscal
de Obras permanece como material inicial, e qualquer nova materia passa a usar
o mesmo fluxo de fontes, questoes, revisoes e simulados.
